using GroupEvents.Application.Common.Exceptions;
using GroupEvents.Application.Groups.Commands;
using GroupEvents.Domain.Entities;
using GroupEvents.Domain.Enums;
using GroupEvents.Infrastructure.Persistence;
using GroupEvents.Tests.Integration.Helpers;

namespace GroupEvents.Tests.Integration.Groups;

public class RemoveMemberCommandHandlerTests
{
    private static RemoveMemberCommandHandler CreateHandler(AppDbContext db) => new(db);

    private static (User owner, User coAdmin, User member, Group group) Seed(AppDbContext db)
    {
        var owner   = new User("ext-1", AuthProvider.Google, "owner@test.com",   "Owner",   null);
        var coAdmin = new User("ext-2", AuthProvider.Google, "coadmin@test.com", "CoAdmin", null);
        var member  = new User("ext-3", AuthProvider.Google, "member@test.com",  "Member",  null);
        db.Users.AddRange(owner, coAdmin, member);

        var group = new Group("Group", "group", owner.Id);
        db.Groups.Add(group);
        db.GroupMemberships.Add(new GroupMembership(group.Id, owner.Id,   MemberRole.Owner));
        db.GroupMemberships.Add(new GroupMembership(group.Id, coAdmin.Id, MemberRole.CoAdmin));
        db.GroupMemberships.Add(new GroupMembership(group.Id, member.Id,  MemberRole.Member));

        db.SaveChanges();
        return (owner, coAdmin, member, group);
    }

    [Fact]
    public async Task Handle_OwnerRemovesMember_Succeeds()
    {
        using var db = TestDbContextFactory.Create();
        var (owner, _, member, group) = Seed(db);

        await CreateHandler(db).Handle(
            new RemoveMemberCommand(owner.Id, group.Id, member.Id), default);

        var membership = db.GroupMemberships.Single(m => m.UserId == member.Id);
        Assert.False(membership.IsActive);
    }

    [Fact]
    public async Task Handle_CoAdminRemovesMember_Succeeds()
    {
        using var db = TestDbContextFactory.Create();
        var (_, coAdmin, member, group) = Seed(db);

        await CreateHandler(db).Handle(
            new RemoveMemberCommand(coAdmin.Id, group.Id, member.Id), default);

        var membership = db.GroupMemberships.Single(m => m.UserId == member.Id);
        Assert.False(membership.IsActive);
    }

    [Fact]
    public async Task Handle_MemberTriesToRemove_ThrowsForbiddenException()
    {
        using var db = TestDbContextFactory.Create();
        var (_, coAdmin, member, group) = Seed(db);

        await Assert.ThrowsAsync<ForbiddenException>(() =>
            CreateHandler(db).Handle(
                new RemoveMemberCommand(member.Id, group.Id, coAdmin.Id), default));
    }

    [Fact]
    public async Task Handle_RemoveOwner_ThrowsForbiddenException()
    {
        using var db = TestDbContextFactory.Create();
        var (owner, coAdmin, _, group) = Seed(db);

        await Assert.ThrowsAsync<ForbiddenException>(() =>
            CreateHandler(db).Handle(
                new RemoveMemberCommand(coAdmin.Id, group.Id, owner.Id), default));
    }

    [Fact]
    public async Task Handle_CoAdminRemovesCoAdmin_ThrowsForbiddenException()
    {
        using var db = TestDbContextFactory.Create();
        var (_, coAdmin, _, group) = Seed(db);
        var coAdmin2 = new User("ext-4", AuthProvider.Google, "ca2@test.com", "CoAdmin2", null);
        db.Users.Add(coAdmin2);
        db.GroupMemberships.Add(new GroupMembership(group.Id, coAdmin2.Id, MemberRole.CoAdmin));
        await db.SaveChangesAsync();

        await Assert.ThrowsAsync<ForbiddenException>(() =>
            CreateHandler(db).Handle(
                new RemoveMemberCommand(coAdmin.Id, group.Id, coAdmin2.Id), default));
    }

    [Fact]
    public async Task Handle_RemoveSelf_ThrowsInvalidOperation()
    {
        using var db = TestDbContextFactory.Create();
        var (owner, _, _, group) = Seed(db);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            CreateHandler(db).Handle(
                new RemoveMemberCommand(owner.Id, group.Id, owner.Id), default));
    }
}
