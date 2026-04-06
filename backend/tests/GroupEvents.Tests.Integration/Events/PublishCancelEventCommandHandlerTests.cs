using GroupEvents.Application.Common.Exceptions;
using GroupEvents.Application.Common.Interfaces;
using GroupEvents.Application.Events.Commands;
using GroupEvents.Domain.Entities;
using GroupEvents.Domain.Enums;
using GroupEvents.Infrastructure.Persistence;
using GroupEvents.Tests.Integration.Helpers;
using NSubstitute;

namespace GroupEvents.Tests.Integration.Events;

public class PublishCancelEventCommandHandlerTests
{
    private static INotificationService NoopNotifications() => Substitute.For<INotificationService>();

    private static PublishEventCommandHandler PublishHandler(AppDbContext db) => new(db);
    private static CancelEventCommandHandler  CancelHandler(AppDbContext db)  => new(db, NoopNotifications());

    private static (User owner, User member, Group group, Event ev) Seed(AppDbContext db)
    {
        var owner  = new User("ext-1", AuthProvider.Google, "owner@test.com", "Owner", null);
        var member = new User("ext-2", AuthProvider.Google, "member@test.com", "Member", null);
        db.Users.AddRange(owner, member);
        var group = new Group("Group", "group", owner.Id);
        db.Groups.Add(group);
        db.GroupMemberships.Add(new GroupMembership(group.Id, owner.Id,  MemberRole.Owner));
        db.GroupMemberships.Add(new GroupMembership(group.Id, member.Id, MemberRole.Member));
        var ev = new Event(group.Id, owner.Id, "Race", "race", null, "UTC",
            DateTime.UtcNow.AddDays(7), 60, 2, 10);
        db.Events.Add(ev);
        db.SaveChanges();
        return (owner, member, group, ev);
    }

    // --- Publish ---

    [Fact]
    public async Task Publish_OwnerPublishesDraft_Succeeds()
    {
        using var db = TestDbContextFactory.Create();
        var (owner, _, group, ev) = Seed(db);

        await PublishHandler(db).Handle(new PublishEventCommand(owner.Id, group.Id, ev.Id), default);

        Assert.Equal(EventStatus.Published, db.Events.Single().Status);
    }

    [Fact]
    public async Task Publish_AlreadyPublished_ThrowsInvalidOperation()
    {
        using var db = TestDbContextFactory.Create();
        var (owner, _, group, ev) = Seed(db);
        ev.Publish();
        await db.SaveChangesAsync();

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            PublishHandler(db).Handle(new PublishEventCommand(owner.Id, group.Id, ev.Id), default));
    }

    [Fact]
    public async Task Publish_MemberTries_ThrowsForbiddenException()
    {
        using var db = TestDbContextFactory.Create();
        var (_, member, group, ev) = Seed(db);

        await Assert.ThrowsAsync<ForbiddenException>(() =>
            PublishHandler(db).Handle(new PublishEventCommand(member.Id, group.Id, ev.Id), default));
    }

    [Fact]
    public async Task Publish_EventNotFound_ThrowsNotFoundException()
    {
        using var db = TestDbContextFactory.Create();
        var (owner, _, group, _) = Seed(db);

        await Assert.ThrowsAsync<NotFoundException>(() =>
            PublishHandler(db).Handle(new PublishEventCommand(owner.Id, group.Id, Guid.NewGuid()), default));
    }

    // --- Cancel ---

    [Fact]
    public async Task Cancel_OwnerCancelsDraft_Succeeds()
    {
        using var db = TestDbContextFactory.Create();
        var (owner, _, group, ev) = Seed(db);

        await CancelHandler(db).Handle(new CancelEventCommand(owner.Id, group.Id, ev.Id), default);

        Assert.Equal(EventStatus.Cancelled, db.Events.Single().Status);
    }

    [Fact]
    public async Task Cancel_OwnerCancelsPublished_Succeeds()
    {
        using var db = TestDbContextFactory.Create();
        var (owner, _, group, ev) = Seed(db);
        ev.Publish();
        await db.SaveChangesAsync();

        await CancelHandler(db).Handle(new CancelEventCommand(owner.Id, group.Id, ev.Id), default);

        Assert.Equal(EventStatus.Cancelled, db.Events.Single().Status);
    }

    [Fact]
    public async Task Cancel_MemberTries_ThrowsForbiddenException()
    {
        using var db = TestDbContextFactory.Create();
        var (_, member, group, ev) = Seed(db);

        await Assert.ThrowsAsync<ForbiddenException>(() =>
            CancelHandler(db).Handle(new CancelEventCommand(member.Id, group.Id, ev.Id), default));
    }
}
