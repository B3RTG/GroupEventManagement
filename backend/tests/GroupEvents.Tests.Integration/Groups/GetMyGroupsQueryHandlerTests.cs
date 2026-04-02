using GroupEvents.Application.Groups.Queries;
using GroupEvents.Domain.Entities;
using GroupEvents.Domain.Enums;
using GroupEvents.Infrastructure.Persistence;
using GroupEvents.Tests.Integration.Helpers;

namespace GroupEvents.Tests.Integration.Groups;

public class GetMyGroupsQueryHandlerTests
{
    private static GetMyGroupsQueryHandler CreateHandler(AppDbContext db) => new(db);

    [Fact]
    public async Task Handle_UserWithGroups_ReturnsAll()
    {
        using var db = TestDbContextFactory.Create();
        var user = new User("ext-1", AuthProvider.Google, "u@test.com", "User", null);
        db.Users.Add(user);

        var g1 = new Group("Group One", "group-one", user.Id);
        var g2 = new Group("Group Two", "group-two", user.Id);
        db.Groups.AddRange(g1, g2);
        db.GroupMemberships.Add(new GroupMembership(g1.Id, user.Id, MemberRole.Owner));
        db.GroupMemberships.Add(new GroupMembership(g2.Id, user.Id, MemberRole.Owner));
        await db.SaveChangesAsync();

        var result = await CreateHandler(db).Handle(new GetMyGroupsQuery(user.Id), default);

        Assert.Equal(2, result.Count);
    }

    [Fact]
    public async Task Handle_UserWithNoGroups_ReturnsEmpty()
    {
        using var db = TestDbContextFactory.Create();
        var user = new User("ext-1", AuthProvider.Google, "u@test.com", "User", null);
        db.Users.Add(user);
        await db.SaveChangesAsync();

        var result = await CreateHandler(db).Handle(new GetMyGroupsQuery(user.Id), default);

        Assert.Empty(result);
    }

    [Fact]
    public async Task Handle_InactiveMembership_NotIncluded()
    {
        using var db = TestDbContextFactory.Create();
        var user = new User("ext-1", AuthProvider.Google, "u@test.com", "User", null);
        db.Users.Add(user);

        var group = new Group("Group", "group", user.Id);
        db.Groups.Add(group);
        var membership = new GroupMembership(group.Id, user.Id, MemberRole.Member);
        membership.Leave();
        db.GroupMemberships.Add(membership);
        await db.SaveChangesAsync();

        var result = await CreateHandler(db).Handle(new GetMyGroupsQuery(user.Id), default);

        Assert.Empty(result);
    }

    [Fact]
    public async Task Handle_OnlyReturnsGroupsForRequestingUser()
    {
        using var db = TestDbContextFactory.Create();
        var user1 = new User("ext-1", AuthProvider.Google, "u1@test.com", "User1", null);
        var user2 = new User("ext-2", AuthProvider.Google, "u2@test.com", "User2", null);
        db.Users.AddRange(user1, user2);

        var group = new Group("Group", "group", user1.Id);
        db.Groups.Add(group);
        db.GroupMemberships.Add(new GroupMembership(group.Id, user1.Id, MemberRole.Owner));
        await db.SaveChangesAsync();

        var result = await CreateHandler(db).Handle(new GetMyGroupsQuery(user2.Id), default);

        Assert.Empty(result);
    }

    [Fact]
    public async Task Handle_MemberCountIsCorrect()
    {
        using var db = TestDbContextFactory.Create();
        var owner  = new User("ext-1", AuthProvider.Google, "o@test.com", "Owner", null);
        var member = new User("ext-2", AuthProvider.Google, "m@test.com", "Member", null);
        db.Users.AddRange(owner, member);

        var group = new Group("Group", "group", owner.Id);
        db.Groups.Add(group);
        db.GroupMemberships.Add(new GroupMembership(group.Id, owner.Id,  MemberRole.Owner));
        db.GroupMemberships.Add(new GroupMembership(group.Id, member.Id, MemberRole.Member));
        await db.SaveChangesAsync();

        var result = await CreateHandler(db).Handle(new GetMyGroupsQuery(owner.Id), default);

        Assert.Equal(2, result.Single().MemberCount);
    }
}
