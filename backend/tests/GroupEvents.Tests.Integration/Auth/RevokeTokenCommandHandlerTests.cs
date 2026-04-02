using GroupEvents.Application.Auth.Commands;
using GroupEvents.Application.Common.Exceptions;
using GroupEvents.Domain.Entities;
using GroupEvents.Domain.Enums;
using GroupEvents.Infrastructure.Persistence;
using GroupEvents.Tests.Integration.Helpers;

namespace GroupEvents.Tests.Integration.Auth;

public class RevokeTokenCommandHandlerTests
{
    private static RevokeTokenCommandHandler CreateHandler(AppDbContext db) => new(db);

    [Fact]
    public async Task Handle_ValidToken_RevokesIt()
    {
        using var db = TestDbContextFactory.Create();
        var user = new User("ext-1", AuthProvider.Google, "u@test.com", "User", null);
        db.Users.Add(user);
        var token = new RefreshToken(user.Id, "active-token", DateTime.UtcNow.AddDays(30));
        db.RefreshTokens.Add(token);
        await db.SaveChangesAsync();

        await CreateHandler(db).Handle(new RevokeTokenCommand("active-token"), default);

        Assert.True(token.IsRevoked);
        Assert.False(token.IsActive);
    }

    [Fact]
    public async Task Handle_NonExistentToken_ThrowsUnauthorizedException()
    {
        using var db = TestDbContextFactory.Create();

        await Assert.ThrowsAsync<UnauthorizedException>(() =>
            CreateHandler(db).Handle(new RevokeTokenCommand("ghost-token"), default));
    }

    [Fact]
    public async Task Handle_AlreadyRevokedToken_ThrowsUnauthorizedException()
    {
        using var db = TestDbContextFactory.Create();
        var user = new User("ext-2", AuthProvider.Google, "r@test.com", "User", null);
        db.Users.Add(user);
        var token = new RefreshToken(user.Id, "revoked-token", DateTime.UtcNow.AddDays(30));
        token.Revoke();
        db.RefreshTokens.Add(token);
        await db.SaveChangesAsync();

        await Assert.ThrowsAsync<UnauthorizedException>(() =>
            CreateHandler(db).Handle(new RevokeTokenCommand("revoked-token"), default));
    }
}
