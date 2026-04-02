using GroupEvents.Application.Common.Exceptions;
using GroupEvents.Application.Events.Queries;
using GroupEvents.Domain.Entities;
using GroupEvents.Domain.Enums;
using GroupEvents.Infrastructure.Persistence;
using GroupEvents.Tests.Integration.Helpers;

namespace GroupEvents.Tests.Integration.Events;

public class GetEventsQueryHandlerTests
{
    private static GetEventsQueryHandler  ListHandler(AppDbContext db)   => new(db);
    private static GetEventQueryHandler   DetailHandler(AppDbContext db) => new(db);

    private static (User owner, User member, Group group) SeedGroup(AppDbContext db)
    {
        var owner  = new User("ext-1", AuthProvider.Google, "owner@test.com", "Owner", null);
        var member = new User("ext-2", AuthProvider.Google, "member@test.com", "Member", null);
        db.Users.AddRange(owner, member);
        var group = new Group("Group", "group", owner.Id);
        db.Groups.Add(group);
        db.GroupMemberships.Add(new GroupMembership(group.Id, owner.Id,  MemberRole.Owner));
        db.GroupMemberships.Add(new GroupMembership(group.Id, member.Id, MemberRole.Member));
        db.SaveChanges();
        return (owner, member, group);
    }

    private static Event AddEvent(AppDbContext db, Guid groupId, Guid createdBy,
        string title = "Race", int trackCount = 2, int capacityPerTrack = 10)
    {
        var ev = new Event(groupId, createdBy, title, "race", null, "UTC",
            DateTime.UtcNow.AddDays(7), 60, trackCount, capacityPerTrack);
        db.Events.Add(ev);
        db.SaveChanges();
        return ev;
    }

    // --- GetEvents (list) ---

    [Fact]
    public async Task GetEvents_MemberGetsEvents_ReturnsAll()
    {
        using var db = TestDbContextFactory.Create();
        var (owner, member, group) = SeedGroup(db);
        AddEvent(db, group.Id, owner.Id, "Race 1");
        AddEvent(db, group.Id, owner.Id, "Race 2");

        var result = await ListHandler(db).Handle(new GetEventsQuery(member.Id, group.Id), default);

        Assert.Equal(2, result.Count);
    }

    [Fact]
    public async Task GetEvents_NotMember_ThrowsForbiddenException()
    {
        using var db = TestDbContextFactory.Create();
        var (owner, _, group) = SeedGroup(db);
        AddEvent(db, group.Id, owner.Id);

        await Assert.ThrowsAsync<ForbiddenException>(() =>
            ListHandler(db).Handle(new GetEventsQuery(Guid.NewGuid(), group.Id), default));
    }

    [Fact]
    public async Task GetEvents_ConfirmedCountIsAccurate()
    {
        using var db = TestDbContextFactory.Create();
        var (owner, member, group) = SeedGroup(db);
        var ev = AddEvent(db, group.Id, owner.Id);

        // 1 confirmed, 1 cancelled
        db.EventRegistrations.Add(new EventRegistration(ev.Id, member.Id));
        var cancelled = new EventRegistration(ev.Id, owner.Id);
        cancelled.Cancel(owner.Id);
        db.EventRegistrations.Add(cancelled);
        await db.SaveChangesAsync();

        var result = await ListHandler(db).Handle(new GetEventsQuery(owner.Id, group.Id), default);

        Assert.Equal(1, result.Single().ConfirmedCount);
    }

    // --- GetEvent (detail) ---

    [Fact]
    public async Task GetEvent_MemberGetsDetail_ReturnsEvent()
    {
        using var db = TestDbContextFactory.Create();
        var (owner, member, group) = SeedGroup(db);
        var ev = AddEvent(db, group.Id, owner.Id);

        var result = await DetailHandler(db).Handle(
            new GetEventQuery(member.Id, group.Id, ev.Id), default);

        Assert.Equal(ev.Id, result.Id);
        Assert.Equal("race", result.EventType);
    }

    [Fact]
    public async Task GetEvent_NotMember_ThrowsForbiddenException()
    {
        using var db = TestDbContextFactory.Create();
        var (owner, _, group) = SeedGroup(db);
        var ev = AddEvent(db, group.Id, owner.Id);

        await Assert.ThrowsAsync<ForbiddenException>(() =>
            DetailHandler(db).Handle(new GetEventQuery(Guid.NewGuid(), group.Id, ev.Id), default));
    }

    [Fact]
    public async Task GetEvent_NotFound_ThrowsNotFoundException()
    {
        using var db = TestDbContextFactory.Create();
        var (owner, _, group) = SeedGroup(db);

        await Assert.ThrowsAsync<NotFoundException>(() =>
            DetailHandler(db).Handle(new GetEventQuery(owner.Id, group.Id, Guid.NewGuid()), default));
    }

    [Fact]
    public async Task GetEvent_AvailableSpotsIsAccurate()
    {
        using var db = TestDbContextFactory.Create();
        var (owner, member, group) = SeedGroup(db);
        var ev = AddEvent(db, group.Id, owner.Id, trackCount: 2, capacityPerTrack: 10); // total = 20
        db.EventRegistrations.Add(new EventRegistration(ev.Id, member.Id)); // 1 confirmed
        await db.SaveChangesAsync();

        var result = await DetailHandler(db).Handle(
            new GetEventQuery(owner.Id, group.Id, ev.Id), default);

        Assert.Equal(1,  result.ConfirmedCount);
        Assert.Equal(19, result.AvailableSpots);
        Assert.Equal(20, result.TotalCapacity);
    }
}
