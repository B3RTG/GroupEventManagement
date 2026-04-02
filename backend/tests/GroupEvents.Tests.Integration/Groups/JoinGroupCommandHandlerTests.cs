using GroupEvents.Application.Common.Exceptions;
using GroupEvents.Application.Groups.Commands;
using GroupEvents.Domain.Entities;
using GroupEvents.Domain.Enums;
using GroupEvents.Infrastructure.Persistence;
using GroupEvents.Tests.Integration.Helpers;

namespace GroupEvents.Tests.Integration.Groups;

public class JoinGroupCommandHandlerTests
{
    private static JoinGroupCommandHandler CreateHandler(AppDbContext db) => new(db);

    private static (User owner, User member, Group group) Seed(AppDbContext db)
    {
        var owner  = new User("ext-1", AuthProvider.Google, "owner@test.com", "Owner", null);
        var member = new User("ext-2", AuthProvider.Google, "member@test.com", "Member", null);
        db.Users.AddRange(owner, member);

        var group = new Group("Test Group", "test-group", owner.Id);
        db.Groups.Add(group);
        db.GroupMemberships.Add(new GroupMembership(group.Id, owner.Id, MemberRole.Owner));

        db.SaveChanges();
        return (owner, member, group);
    }

    [Fact]
    public async Task Handle_ValidInviteCode_JoinsMember()
    {
        using var db = TestDbContextFactory.Create();
        var (_, member, group) = Seed(db);

        var result = await CreateHandler(db).Handle(
            new JoinGroupCommand(member.Id, group.InviteCode), default);

        Assert.Equal(group.Id, result.Id);
        Assert.Equal(2, result.MemberCount);
        Assert.Equal(2, db.GroupMemberships.Count(m => m.IsActive));
    }

    [Fact]
    public async Task Handle_ValidInviteCode_MembershipRoleIsMember()
    {
        using var db = TestDbContextFactory.Create();
        var (_, member, group) = Seed(db);

        await CreateHandler(db).Handle(
            new JoinGroupCommand(member.Id, group.InviteCode), default);

        var membership = db.GroupMemberships.Single(m => m.UserId == member.Id);
        Assert.Equal(MemberRole.Member, membership.Role);
    }

    [Fact]
    public async Task Handle_InvalidInviteCode_ThrowsNotFoundException()
    {
        using var db = TestDbContextFactory.Create();
        var (_, member, _) = Seed(db);

        await Assert.ThrowsAsync<NotFoundException>(() =>
            CreateHandler(db).Handle(new JoinGroupCommand(member.Id, "BADCODE"), default));
    }

    [Fact]
    public async Task Handle_AlreadyMember_ThrowsConflictException()
    {
        using var db = TestDbContextFactory.Create();
        var (owner, _, group) = Seed(db);

        await Assert.ThrowsAsync<ConflictException>(() =>
            CreateHandler(db).Handle(new JoinGroupCommand(owner.Id, group.InviteCode), default));
    }

    [Fact]
    public async Task Handle_InviteLinkDisabled_ThrowsForbiddenException()
    {
        using var db = TestDbContextFactory.Create();
        var (_, member, group) = Seed(db);
        group.SetInviteLinkEnabled(false);
        await db.SaveChangesAsync();

        await Assert.ThrowsAsync<ForbiddenException>(() =>
            CreateHandler(db).Handle(new JoinGroupCommand(member.Id, group.InviteCode), default));
    }
}
