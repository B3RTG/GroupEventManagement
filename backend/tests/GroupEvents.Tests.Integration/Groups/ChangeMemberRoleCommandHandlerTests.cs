using GroupEvents.Application.Common.Exceptions;
using GroupEvents.Application.Groups.Commands;
using GroupEvents.Domain.Entities;
using GroupEvents.Domain.Enums;
using GroupEvents.Infrastructure.Persistence;
using GroupEvents.Tests.Integration.Helpers;

namespace GroupEvents.Tests.Integration.Groups;

public class ChangeMemberRoleCommandHandlerTests
{
    private static ChangeMemberRoleCommandHandler CreateHandler(AppDbContext db) => new(db);

    private static (User owner, User member, Group group) Seed(AppDbContext db)
    {
        var owner  = new User("ext-1", AuthProvider.Google, "owner@test.com", "Owner", null);
        var member = new User("ext-2", AuthProvider.Google, "member@test.com", "Member", null);
        db.Users.AddRange(owner, member);

        var group = new Group("Group", "group", owner.Id);
        db.Groups.Add(group);
        db.GroupMemberships.Add(new GroupMembership(group.Id, owner.Id, MemberRole.Owner));
        db.GroupMemberships.Add(new GroupMembership(group.Id, member.Id, MemberRole.Member));

        db.SaveChanges();
        return (owner, member, group);
    }

    [Fact]
    public async Task Handle_OwnerPromotesMemberToCoAdmin_Succeeds()
    {
        using var db = TestDbContextFactory.Create();
        var (owner, member, group) = Seed(db);

        await CreateHandler(db).Handle(
            new ChangeMemberRoleCommand(owner.Id, group.Id, member.Id, MemberRole.CoAdmin), default);

        var membership = db.GroupMemberships.Single(m => m.UserId == member.Id);
        Assert.Equal(MemberRole.CoAdmin, membership.Role);
    }

    [Fact]
    public async Task Handle_NonOwner_ThrowsForbiddenException()
    {
        using var db = TestDbContextFactory.Create();
        var (_, member, group) = Seed(db);

        await Assert.ThrowsAsync<ForbiddenException>(() =>
            CreateHandler(db).Handle(
                new ChangeMemberRoleCommand(member.Id, group.Id, member.Id, MemberRole.CoAdmin), default));
    }

    [Fact]
    public async Task Handle_OwnerChangesOwnRole_ThrowsInvalidOperation()
    {
        using var db = TestDbContextFactory.Create();
        var (owner, _, group) = Seed(db);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            CreateHandler(db).Handle(
                new ChangeMemberRoleCommand(owner.Id, group.Id, owner.Id, MemberRole.Member), default));
    }

    [Fact]
    public async Task Handle_AssignOwnerRole_ThrowsInvalidOperation()
    {
        using var db = TestDbContextFactory.Create();
        var (owner, member, group) = Seed(db);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            CreateHandler(db).Handle(
                new ChangeMemberRoleCommand(owner.Id, group.Id, member.Id, MemberRole.Owner), default));
    }

    [Fact]
    public async Task Handle_TargetNotMember_ThrowsNotFoundException()
    {
        using var db = TestDbContextFactory.Create();
        var (owner, _, group) = Seed(db);

        await Assert.ThrowsAsync<NotFoundException>(() =>
            CreateHandler(db).Handle(
                new ChangeMemberRoleCommand(owner.Id, group.Id, Guid.NewGuid(), MemberRole.CoAdmin), default));
    }
}
