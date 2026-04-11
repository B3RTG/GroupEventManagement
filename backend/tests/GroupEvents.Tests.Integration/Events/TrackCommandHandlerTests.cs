using GroupEvents.Application.Common.Exceptions;
using GroupEvents.Application.Events.Commands;
using GroupEvents.Domain.Entities;
using GroupEvents.Domain.Enums;
using GroupEvents.Infrastructure.Persistence;
using GroupEvents.Tests.Integration.Helpers;

namespace GroupEvents.Tests.Integration.Events;

public class TrackCommandHandlerTests
{
    private static CreateTrackCommandHandler CreateHandler(AppDbContext db) => new(db);
    private static UpdateTrackCommandHandler UpdateHandler(AppDbContext db) => new(db);
    private static DeleteTrackCommandHandler DeleteHandler(AppDbContext db) => new(db);

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
        db.Events.Add(ev);
        db.SaveChanges();
        return (owner, member, group, ev);
    }

    // --- Create ---

    [Fact]
    public async Task CreateTrack_OwnerCreates_ReturnsTrack()
    {
        using var db = TestDbContextFactory.Create();
        var (owner, _, group, ev) = Seed(db);

        var result = await CreateHandler(db).Handle(
            new CreateTrackCommand(owner.Id, group.Id, ev.Id, "Track A", SortOrder: 1), default);

        Assert.Equal("Track A", result.Name);
        Assert.Single(db.Tracks);
    }

    [Fact]
    public async Task CreateTrack_UpdatesEventTrackCountAndTotalCapacity()
    {
        using var db = TestDbContextFactory.Create();
        var (owner, _, group, ev) = Seed(db); // trackCount=2, capacityPerTrack=10 → total=20

        await CreateHandler(db).Handle(
            new CreateTrackCommand(owner.Id, group.Id, ev.Id, "Track C", SortOrder: 3), default);

        var updated = db.Events.Single();
        Assert.Equal(3, updated.TrackCount);
        Assert.Equal(30, updated.TotalCapacity);
    }

    [Fact]
    public async Task CreateTrack_NoCapacityProvided_DefaultsToEventCapacityPerTrack()
    {
        using var db = TestDbContextFactory.Create();
        var (owner, _, group, ev) = Seed(db); // CapacityPerTrack = 10

        var result = await CreateHandler(db).Handle(
            new CreateTrackCommand(owner.Id, group.Id, ev.Id, "Track A", SortOrder: 1, Capacity: null), default);

        Assert.Equal(10, result.Capacity);
    }

    [Fact]
    public async Task CreateTrack_CustomCapacity_UsesProvided()
    {
        using var db = TestDbContextFactory.Create();
        var (owner, _, group, ev) = Seed(db);

        var result = await CreateHandler(db).Handle(
            new CreateTrackCommand(owner.Id, group.Id, ev.Id, "Track A", SortOrder: 1, Capacity: 5), default);

        Assert.Equal(5, result.Capacity);
    }

    [Fact]
    public async Task CreateTrack_MemberTries_ThrowsForbiddenException()
    {
        using var db = TestDbContextFactory.Create();
        var (_, member, group, ev) = Seed(db);

        await Assert.ThrowsAsync<ForbiddenException>(() =>
            CreateHandler(db).Handle(
                new CreateTrackCommand(member.Id, group.Id, ev.Id, "Track A", 1), default));
    }

    // --- Update ---

    [Fact]
    public async Task UpdateTrack_OwnerUpdates_Succeeds()
    {
        using var db = TestDbContextFactory.Create();
        var (owner, _, group, ev) = Seed(db);
        var track = new Track(ev.Id, "Old Name", 10, 1);
        db.Tracks.Add(track);
        await db.SaveChangesAsync();

        await UpdateHandler(db).Handle(
            new UpdateTrackCommand(owner.Id, group.Id, ev.Id, track.Id, "New Name", SortOrder: 2), default);

        Assert.Equal("New Name", db.Tracks.Single().Name);
        Assert.Equal(2, db.Tracks.Single().SortOrder);
    }

    [Fact]
    public async Task UpdateTrack_NotFound_ThrowsNotFoundException()
    {
        using var db = TestDbContextFactory.Create();
        var (owner, _, group, ev) = Seed(db);

        await Assert.ThrowsAsync<NotFoundException>(() =>
            UpdateHandler(db).Handle(
                new UpdateTrackCommand(owner.Id, group.Id, ev.Id, Guid.NewGuid(), "X", 1), default));
    }

    [Fact]
    public async Task UpdateTrack_MemberTries_ThrowsForbiddenException()
    {
        using var db = TestDbContextFactory.Create();
        var (_, member, group, ev) = Seed(db);

        await Assert.ThrowsAsync<ForbiddenException>(() =>
            UpdateHandler(db).Handle(
                new UpdateTrackCommand(member.Id, group.Id, ev.Id, Guid.NewGuid(), "X", 1), default));
    }

    // --- Delete ---

    [Fact]
    public async Task DeleteTrack_OwnerDeletes_Succeeds()
    {
        using var db = TestDbContextFactory.Create();
        var (owner, _, group, ev) = Seed(db);
        var track = new Track(ev.Id, "Track A", 10, 1);
        db.Tracks.Add(track);
        await db.SaveChangesAsync();

        await DeleteHandler(db).Handle(
            new DeleteTrackCommand(owner.Id, group.Id, ev.Id, track.Id), default);

        Assert.Empty(db.Tracks);
    }

    [Fact]
    public async Task DeleteTrack_UpdatesEventTrackCountAndTotalCapacity()
    {
        // Regression: deleting a track was not decrementing TrackCount on the Event,
        // so TotalCapacity stayed stale after deletion.
        using var db = TestDbContextFactory.Create();
        var (owner, _, group, ev) = Seed(db); // trackCount=2, capacityPerTrack=10 → total=20
        var track = new Track(ev.Id, "Track A", 10, 1);
        db.Tracks.Add(track);
        await db.SaveChangesAsync();

        await DeleteHandler(db).Handle(
            new DeleteTrackCommand(owner.Id, group.Id, ev.Id, track.Id), default);

        var updated = db.Events.Single();
        Assert.Equal(1, updated.TrackCount);
        Assert.Equal(10, updated.TotalCapacity);
    }

    [Fact]
    public async Task DeleteTrack_WouldDropBelowConfirmedCount_ThrowsInvalidOperationException()
    {
        using var db = TestDbContextFactory.Create();
        var (owner, member, group, ev) = Seed(db, trackCount: 1, capacityPerTrack: 1);
        db.EventRegistrations.Add(new EventRegistration(ev.Id, member.Id)); // 1 confirmed = full
        var track = new Track(ev.Id, "Track A", 1, 1);
        db.Tracks.Add(track);
        await db.SaveChangesAsync();

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            DeleteHandler(db).Handle(
                new DeleteTrackCommand(owner.Id, group.Id, ev.Id, track.Id), default));
    }

    [Fact]
    public async Task DeleteTrack_NotFound_ThrowsNotFoundException()
    {
        using var db = TestDbContextFactory.Create();
        var (owner, _, group, ev) = Seed(db);

        await Assert.ThrowsAsync<NotFoundException>(() =>
            DeleteHandler(db).Handle(
                new DeleteTrackCommand(owner.Id, group.Id, ev.Id, Guid.NewGuid()), default));
    }

    [Fact]
    public async Task DeleteTrack_MemberTries_ThrowsForbiddenException()
    {
        using var db = TestDbContextFactory.Create();
        var (_, member, group, ev) = Seed(db);

        await Assert.ThrowsAsync<ForbiddenException>(() =>
            DeleteHandler(db).Handle(
                new DeleteTrackCommand(member.Id, group.Id, ev.Id, Guid.NewGuid()), default));
    }
}
