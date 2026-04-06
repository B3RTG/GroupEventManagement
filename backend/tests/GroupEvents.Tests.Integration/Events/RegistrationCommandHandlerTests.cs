using GroupEvents.Application.Common.Exceptions;
using GroupEvents.Application.Common.Interfaces;
using GroupEvents.Application.Events.Commands;
using GroupEvents.Application.Events.Queries;
using GroupEvents.Domain.Entities;
using GroupEvents.Domain.Enums;
using GroupEvents.Infrastructure.Persistence;
using GroupEvents.Tests.Integration.Helpers;
using NSubstitute;

namespace GroupEvents.Tests.Integration.Events;

public class RegistrationCommandHandlerTests
{
    private static INotificationService NoopNotifications() => Substitute.For<INotificationService>();

    private static RegisterForEventCommandHandler   RegisterHandler(AppDbContext db)  => new(db, NoopNotifications());
    private static CancelRegistrationCommandHandler CancelHandler(AppDbContext db)    => new(db, NoopNotifications());
    private static JoinWaitlistCommandHandler       WaitlistHandler(AppDbContext db)  => new(db);
    private static LeaveWaitlistCommandHandler      LeaveHandler(AppDbContext db)     => new(db);
    private static RegisterGuestCommandHandler      GuestHandler(AppDbContext db)     => new(db);
    private static GetRegistrationsQueryHandler     GetRegHandler(AppDbContext db)    => new(db);
    private static GetWaitlistPositionQueryHandler  GetPosHandler(AppDbContext db)    => new(db);

    private static (User owner, User member, Group group, Event ev) Seed(
        AppDbContext db, int trackCount = 2, int capacityPerTrack = 10)
    {
        var owner  = new User("ext-1", AuthProvider.Google, "owner@test.com", "Owner", null);
        var member = new User("ext-2", AuthProvider.Google, "member@test.com", "Member", null);
        db.Users.AddRange(owner, member);
        var group = new Group("Group", "group", owner.Id);
        db.Groups.Add(group);
        db.GroupMemberships.Add(new GroupMembership(group.Id, owner.Id,  MemberRole.Owner));
        db.GroupMemberships.Add(new GroupMembership(group.Id, member.Id, MemberRole.Member));
        var ev = new Event(group.Id, owner.Id, "Race", "race", null, "UTC",
            DateTime.UtcNow.AddDays(7), 60, trackCount, capacityPerTrack);
        ev.Publish();
        db.Events.Add(ev);
        db.SaveChanges();
        return (owner, member, group, ev);
    }

    // --- Register ---

    [Fact]
    public async Task Register_MemberRegisters_ReturnsId()
    {
        using var db = TestDbContextFactory.Create();
        var (_, member, group, ev) = Seed(db);

        var result = await RegisterHandler(db).Handle(
            new RegisterForEventCommand(member.Id, group.Id, ev.Id), default);

        Assert.NotEqual(Guid.Empty, result.RegistrationId);
        Assert.Single(db.EventRegistrations);
    }

    [Fact]
    public async Task Register_NotMember_ThrowsForbiddenException()
    {
        using var db = TestDbContextFactory.Create();
        var (_, _, group, ev) = Seed(db);

        await Assert.ThrowsAsync<ForbiddenException>(() =>
            RegisterHandler(db).Handle(
                new RegisterForEventCommand(Guid.NewGuid(), group.Id, ev.Id), default));
    }

    [Fact]
    public async Task Register_EventNotPublished_ThrowsInvalidOperation()
    {
        using var db = TestDbContextFactory.Create();
        var owner  = new User("ext-1", AuthProvider.Google, "owner@test.com", "Owner", null);
        db.Users.Add(owner);
        var group = new Group("Group", "group", owner.Id);
        db.Groups.Add(group);
        db.GroupMemberships.Add(new GroupMembership(group.Id, owner.Id, MemberRole.Owner));
        var ev = new Event(group.Id, owner.Id, "Race", "race", null, "UTC",
            DateTime.UtcNow.AddDays(7), 60, 2, 10); // Draft
        db.Events.Add(ev);
        db.SaveChanges();

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            RegisterHandler(db).Handle(
                new RegisterForEventCommand(owner.Id, group.Id, ev.Id), default));
    }

    [Fact]
    public async Task Register_AlreadyRegistered_ThrowsConflictException()
    {
        using var db = TestDbContextFactory.Create();
        var (_, member, group, ev) = Seed(db);
        db.EventRegistrations.Add(new EventRegistration(ev.Id, member.Id));
        db.SaveChanges();

        await Assert.ThrowsAsync<ConflictException>(() =>
            RegisterHandler(db).Handle(
                new RegisterForEventCommand(member.Id, group.Id, ev.Id), default));
    }

    [Fact]
    public async Task Register_EventFull_ThrowsConflictException()
    {
        using var db = TestDbContextFactory.Create();
        var (owner, member, group, ev) = Seed(db, trackCount: 1, capacityPerTrack: 1);
        db.EventRegistrations.Add(new EventRegistration(ev.Id, owner.Id));
        db.SaveChanges();

        await Assert.ThrowsAsync<ConflictException>(() =>
            RegisterHandler(db).Handle(
                new RegisterForEventCommand(member.Id, group.Id, ev.Id), default));
    }

    // --- Cancel Registration ---

    [Fact]
    public async Task CancelRegistration_Succeeds()
    {
        using var db = TestDbContextFactory.Create();
        var (_, member, group, ev) = Seed(db);
        db.EventRegistrations.Add(new EventRegistration(ev.Id, member.Id));
        db.SaveChanges();

        await CancelHandler(db).Handle(
            new CancelRegistrationCommand(member.Id, group.Id, ev.Id), default);

        Assert.Equal(RegistrationStatus.Cancelled, db.EventRegistrations.Single().Status);
    }

    [Fact]
    public async Task CancelRegistration_NoRegistration_ThrowsNotFoundException()
    {
        using var db = TestDbContextFactory.Create();
        var (_, member, group, ev) = Seed(db);

        await Assert.ThrowsAsync<NotFoundException>(() =>
            CancelHandler(db).Handle(
                new CancelRegistrationCommand(member.Id, group.Id, ev.Id), default));
    }

    [Fact]
    public async Task CancelRegistration_WithWaitlist_PromotesFirst()
    {
        using var db = TestDbContextFactory.Create();
        var (owner, member, group, ev) = Seed(db, trackCount: 1, capacityPerTrack: 1);
        // owner has the only spot
        db.EventRegistrations.Add(new EventRegistration(ev.Id, owner.Id));
        // member is waiting
        db.WaitlistEntries.Add(new WaitlistEntry(ev.Id, member.Id));
        db.SaveChanges();

        await CancelHandler(db).Handle(
            new CancelRegistrationCommand(owner.Id, group.Id, ev.Id), default);

        // original registration cancelled
        var cancelled = db.EventRegistrations.First(r => r.UserId == owner.Id);
        Assert.Equal(RegistrationStatus.Cancelled, cancelled.Status);

        // member promoted
        var promoted = db.EventRegistrations.First(r => r.UserId == member.Id);
        Assert.True(promoted.PromotedFromWaitlist);

        // waitlist entry updated
        var entry = db.WaitlistEntries.Single(w => w.UserId == member.Id);
        Assert.Equal(WaitlistStatus.Promoted, entry.Status);
    }

    // --- Waitlist ---

    [Fact]
    public async Task JoinWaitlist_MemberJoins_ReturnsPosition()
    {
        using var db = TestDbContextFactory.Create();
        var (_, member, group, ev) = Seed(db);

        var result = await WaitlistHandler(db).Handle(
            new JoinWaitlistCommand(member.Id, group.Id, ev.Id), default);

        Assert.Equal(1, result.Position);
        Assert.Single(db.WaitlistEntries);
    }

    [Fact]
    public async Task JoinWaitlist_AlreadyOnWaitlist_ThrowsConflictException()
    {
        using var db = TestDbContextFactory.Create();
        var (_, member, group, ev) = Seed(db);
        db.WaitlistEntries.Add(new WaitlistEntry(ev.Id, member.Id));
        db.SaveChanges();

        await Assert.ThrowsAsync<ConflictException>(() =>
            WaitlistHandler(db).Handle(
                new JoinWaitlistCommand(member.Id, group.Id, ev.Id), default));
    }

    [Fact]
    public async Task JoinWaitlist_AlreadyRegistered_ThrowsConflictException()
    {
        using var db = TestDbContextFactory.Create();
        var (_, member, group, ev) = Seed(db);
        db.EventRegistrations.Add(new EventRegistration(ev.Id, member.Id));
        db.SaveChanges();

        await Assert.ThrowsAsync<ConflictException>(() =>
            WaitlistHandler(db).Handle(
                new JoinWaitlistCommand(member.Id, group.Id, ev.Id), default));
    }

    [Fact]
    public async Task LeaveWaitlist_Succeeds()
    {
        using var db = TestDbContextFactory.Create();
        var (_, member, group, ev) = Seed(db);
        db.WaitlistEntries.Add(new WaitlistEntry(ev.Id, member.Id));
        db.SaveChanges();

        await LeaveHandler(db).Handle(
            new LeaveWaitlistCommand(member.Id, group.Id, ev.Id), default);

        Assert.Equal(WaitlistStatus.Cancelled, db.WaitlistEntries.Single().Status);
    }

    [Fact]
    public async Task LeaveWaitlist_NotOnWaitlist_ThrowsNotFoundException()
    {
        using var db = TestDbContextFactory.Create();
        var (_, member, group, ev) = Seed(db);

        await Assert.ThrowsAsync<NotFoundException>(() =>
            LeaveHandler(db).Handle(
                new LeaveWaitlistCommand(member.Id, group.Id, ev.Id), default));
    }

    // --- Register Guest ---

    [Fact]
    public async Task RegisterGuest_OwnerRegistersGuest_Succeeds()
    {
        using var db = TestDbContextFactory.Create();
        var (owner, _, group, ev) = Seed(db);

        var result = await GuestHandler(db).Handle(
            new RegisterGuestCommand(owner.Id, group.Id, ev.Id, "Guest Person", "guest@test.com"), default);

        Assert.NotEqual(Guid.Empty, result.RegistrationId);
        Assert.Single(db.Guests);
        var reg = db.EventRegistrations.Single();
        Assert.True(reg.IsGuestRegistration);
        Assert.NotNull(reg.GuestId);
    }

    [Fact]
    public async Task RegisterGuest_MemberTries_ThrowsForbiddenException()
    {
        using var db = TestDbContextFactory.Create();
        var (_, member, group, ev) = Seed(db);

        await Assert.ThrowsAsync<ForbiddenException>(() =>
            GuestHandler(db).Handle(
                new RegisterGuestCommand(member.Id, group.Id, ev.Id, "Guest", null), default));
    }

    [Fact]
    public async Task RegisterGuest_EventFull_ThrowsConflictException()
    {
        using var db = TestDbContextFactory.Create();
        var (owner, member, group, ev) = Seed(db, trackCount: 1, capacityPerTrack: 1);
        db.EventRegistrations.Add(new EventRegistration(ev.Id, member.Id));
        db.SaveChanges();

        await Assert.ThrowsAsync<ConflictException>(() =>
            GuestHandler(db).Handle(
                new RegisterGuestCommand(owner.Id, group.Id, ev.Id, "Guest", null), default));
    }

    // --- Get Registrations ---

    [Fact]
    public async Task GetRegistrations_ReturnsMembersOnly()
    {
        using var db = TestDbContextFactory.Create();
        var (owner, member, group, ev) = Seed(db);
        db.EventRegistrations.Add(new EventRegistration(ev.Id, owner.Id));
        var cancelled = new EventRegistration(ev.Id, member.Id);
        cancelled.Cancel(owner.Id);
        db.EventRegistrations.Add(cancelled);
        db.SaveChanges();

        var result = await GetRegHandler(db).Handle(
            new GetRegistrationsQuery(owner.Id, group.Id, ev.Id), default);

        Assert.Single(result); // only confirmed
        Assert.Equal(owner.Id, result[0].UserId);
    }

    // --- Get Waitlist Position ---

    [Fact]
    public async Task GetWaitlistPosition_ReturnsCorrectPosition()
    {
        using var db = TestDbContextFactory.Create();
        var (owner, member, group, ev) = Seed(db);
        db.WaitlistEntries.Add(new WaitlistEntry(ev.Id, owner.Id));
        db.WaitlistEntries.Add(new WaitlistEntry(ev.Id, member.Id));
        db.SaveChanges();

        var result = await GetPosHandler(db).Handle(
            new GetWaitlistPositionQuery(member.Id, group.Id, ev.Id), default);

        Assert.Equal(2, result.Position);
    }

    [Fact]
    public async Task GetWaitlistPosition_NotOnWaitlist_ThrowsNotFoundException()
    {
        using var db = TestDbContextFactory.Create();
        var (_, member, group, ev) = Seed(db);

        await Assert.ThrowsAsync<NotFoundException>(() =>
            GetPosHandler(db).Handle(
                new GetWaitlistPositionQuery(member.Id, group.Id, ev.Id), default));
    }
}
