using GroupEvents.Application.Groups.Commands;
using GroupEvents.Domain.Entities;
using GroupEvents.Domain.Enums;
using GroupEvents.Infrastructure.Persistence;
using GroupEvents.Tests.Integration.Helpers;

namespace GroupEvents.Tests.Integration.Groups;

public class CreateGroupCommandHandlerTests
{
    private static CreateGroupCommandHandler CreateHandler(AppDbContext db) => new(db);

    private static User SeedUser(AppDbContext db)
    {
        var user = new User("ext-1", AuthProvider.Google, "u@test.com", "User", null);
        db.Users.Add(user);
        db.SaveChanges();
        return user;
    }

    [Fact]
    public async Task Handle_ValidRequest_CreatesGroup()
    {
        using var db = TestDbContextFactory.Create();
        var user = SeedUser(db);

        var result = await CreateHandler(db).Handle(
            new CreateGroupCommand(user.Id, "My Awesome Group"), default);

        Assert.Equal("My Awesome Group", result.Name);
        Assert.Equal(user.Id, result.OwnerId);
        Assert.Single(db.Groups);
    }

    [Fact]
    public async Task Handle_ValidRequest_CreatesOwnerMembership()
    {
        using var db = TestDbContextFactory.Create();
        var user = SeedUser(db);

        var result = await CreateHandler(db).Handle(
            new CreateGroupCommand(user.Id, "Test Group"), default);

        var membership = db.GroupMemberships.Single();
        Assert.Equal(user.Id, membership.UserId);
        Assert.Equal(result.Id, membership.GroupId);
        Assert.Equal(MemberRole.Owner, membership.Role);
    }

    [Fact]
    public async Task Handle_ValidRequest_ReportsMemberCountOfOne()
    {
        using var db = TestDbContextFactory.Create();
        var user = SeedUser(db);

        var result = await CreateHandler(db).Handle(
            new CreateGroupCommand(user.Id, "Solo Group"), default);

        Assert.Equal(1, result.MemberCount);
    }

    [Fact]
    public async Task Handle_GroupName_GeneratesSlug()
    {
        using var db = TestDbContextFactory.Create();
        var user = SeedUser(db);

        var result = await CreateHandler(db).Handle(
            new CreateGroupCommand(user.Id, "Hello World Group"), default);

        Assert.Equal("hello-world-group", result.Slug);
    }

    [Fact]
    public async Task Handle_DuplicateName_GeneratesUniqueSlug()
    {
        using var db = TestDbContextFactory.Create();
        var user = SeedUser(db);

        var first = await CreateHandler(db).Handle(
            new CreateGroupCommand(user.Id, "Same Name"), default);
        var second = await CreateHandler(db).Handle(
            new CreateGroupCommand(user.Id, "Same Name"), default);

        Assert.NotEqual(first.Slug, second.Slug);
        Assert.Equal(2, db.Groups.Count());
    }
}
