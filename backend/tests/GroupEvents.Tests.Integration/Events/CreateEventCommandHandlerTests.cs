using GroupEvents.Application.Common.Exceptions;
using GroupEvents.Application.Events.Commands;
using GroupEvents.Domain.Entities;
using GroupEvents.Domain.Enums;
using GroupEvents.Infrastructure.Persistence;
using GroupEvents.Tests.Integration.Helpers;

namespace GroupEvents.Tests.Integration.Events;

public class CreateEventCommandHandlerTests
{
    private static CreateEventCommandHandler CreateHandler(AppDbContext db) => new(db);

    private static (User owner, User member, Group group) Seed(AppDbContext db)
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

    private static CreateEventCommand BuildCommand(Guid userId, Guid groupId) =>
        new(userId, groupId, "Test Race", "race", "Track A", "UTC",
            DateTime.UtcNow.AddDays(7), 120, TrackCount: 2, CapacityPerTrack: 10);

    [Fact]
    public async Task Handle_OwnerCreatesEvent_ReturnsEventInDraft()
    {
        using var db = TestDbContextFactory.Create();
        var (owner, _, group) = Seed(db);

        var result = await CreateHandler(db).Handle(BuildCommand(owner.Id, group.Id), default);

        Assert.Equal("draft", result.Status);
        Assert.Equal("Test Race", result.Title);
        Assert.Equal(0, result.ConfirmedCount);
        Assert.Equal(20, result.TotalCapacity);
    }

    [Fact]
    public async Task Handle_CoAdminCreatesEvent_Succeeds()
    {
        using var db = TestDbContextFactory.Create();
        var (owner, member, group) = Seed(db);
        db.GroupMemberships.Single(m => m.UserId == member.Id).ChangeRole(MemberRole.CoAdmin);
        await db.SaveChangesAsync();

        var result = await CreateHandler(db).Handle(BuildCommand(member.Id, group.Id), default);

        Assert.NotNull(result);
    }

    [Fact]
    public async Task Handle_MemberTriesToCreate_ThrowsForbiddenException()
    {
        using var db = TestDbContextFactory.Create();
        var (_, member, group) = Seed(db);

        await Assert.ThrowsAsync<ForbiddenException>(() =>
            CreateHandler(db).Handle(BuildCommand(member.Id, group.Id), default));
    }

    [Fact]
    public async Task Handle_NotMember_ThrowsForbiddenException()
    {
        using var db = TestDbContextFactory.Create();
        var (_, _, group) = Seed(db);

        await Assert.ThrowsAsync<ForbiddenException>(() =>
            CreateHandler(db).Handle(BuildCommand(Guid.NewGuid(), group.Id), default));
    }
}
