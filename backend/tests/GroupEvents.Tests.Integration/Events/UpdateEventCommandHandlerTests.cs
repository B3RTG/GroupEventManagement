using GroupEvents.Application.Common.Exceptions;
using GroupEvents.Application.Events.Commands;
using GroupEvents.Domain.Entities;
using GroupEvents.Domain.Enums;
using GroupEvents.Infrastructure.Persistence;
using GroupEvents.Tests.Integration.Helpers;

namespace GroupEvents.Tests.Integration.Events;

public class UpdateEventCommandHandlerTests
{
    private static UpdateEventCommandHandler CreateHandler(AppDbContext db) => new(db);

    private static (User owner, User member, Group group, Event ev) Seed(AppDbContext db)
    {
        var owner  = new User("ext-1", AuthProvider.Google, "owner@test.com", "Owner", null);
        var member = new User("ext-2", AuthProvider.Google, "member@test.com", "Member", null);
        db.Users.AddRange(owner, member);
        var group = new Group("Group", "group", owner.Id);
        db.Groups.Add(group);
        db.GroupMemberships.Add(new GroupMembership(group.Id, owner.Id,  MemberRole.Owner));
        db.GroupMemberships.Add(new GroupMembership(group.Id, member.Id, MemberRole.Member));
        var ev = new Event(group.Id, owner.Id, "Original Title", "race", null, "UTC",
            DateTime.UtcNow.AddDays(7), 60, trackCount: 2, capacityPerTrack: 10);
        db.Events.Add(ev);
        db.SaveChanges();
        return (owner, member, group, ev);
    }

    [Fact]
    public async Task Handle_OwnerUpdatesTitle_Succeeds()
    {
        using var db = TestDbContextFactory.Create();
        var (owner, _, group, ev) = Seed(db);

        await CreateHandler(db).Handle(
            new UpdateEventCommand(owner.Id, group.Id, ev.Id, Title: "New Title"), default);

        Assert.Equal("New Title", db.Events.Single().Title);
    }

    [Fact]
    public async Task Handle_OwnerUpdatesCapacityNoRegistrations_Succeeds()
    {
        using var db = TestDbContextFactory.Create();
        var (owner, _, group, ev) = Seed(db);

        await CreateHandler(db).Handle(
            new UpdateEventCommand(owner.Id, group.Id, ev.Id, TrackCount: 3, CapacityPerTrack: 5), default);

        var updated = db.Events.Single();
        Assert.Equal(3, updated.TrackCount);
        Assert.Equal(5, updated.CapacityPerTrack);
    }

    [Fact]
    public async Task Handle_ReduceCapacityBelowConfirmed_ThrowsInvalidOperation()
    {
        using var db = TestDbContextFactory.Create();
        var (owner, member, group, ev) = Seed(db);
        // Add 15 confirmed registrations (capacity = 20, new capacity would be 5)
        for (var i = 0; i < 15; i++)
        {
            var u = new User($"ext-r{i}", AuthProvider.Google, $"r{i}@test.com", $"Rider{i}", null);
            db.Users.Add(u);
            db.EventRegistrations.Add(new EventRegistration(ev.Id, u.Id));
        }
        await db.SaveChangesAsync();

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            CreateHandler(db).Handle(
                new UpdateEventCommand(owner.Id, group.Id, ev.Id, TrackCount: 1, CapacityPerTrack: 4), default));
    }

    [Fact]
    public async Task Handle_MemberTries_ThrowsForbiddenException()
    {
        using var db = TestDbContextFactory.Create();
        var (_, member, group, ev) = Seed(db);

        await Assert.ThrowsAsync<ForbiddenException>(() =>
            CreateHandler(db).Handle(
                new UpdateEventCommand(member.Id, group.Id, ev.Id, Title: "Hack"), default));
    }

    [Fact]
    public async Task Handle_UpdatePublishedEvent_ThrowsInvalidOperation()
    {
        using var db = TestDbContextFactory.Create();
        var (owner, _, group, ev) = Seed(db);
        ev.Publish();
        await db.SaveChangesAsync();

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            CreateHandler(db).Handle(
                new UpdateEventCommand(owner.Id, group.Id, ev.Id, Title: "New Title"), default));
    }
}
