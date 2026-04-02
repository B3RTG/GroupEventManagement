using GroupEvents.Application.Auth.Commands;
using GroupEvents.Application.Common.Exceptions;
using GroupEvents.Domain.Entities;
using GroupEvents.Domain.Enums;
using GroupEvents.Infrastructure.Persistence;
using GroupEvents.Tests.Integration.Helpers;

namespace GroupEvents.Tests.Integration.Auth;

public class RefreshTokenCommandHandlerTests
{
    private readonly FakeJwtTokenService _jwtService = new();

    private RefreshTokenCommandHandler CreateHandler(AppDbContext db) =>
        new(db, _jwtService);

    private static (User user, RefreshToken token) SeedActiveToken(AppDbContext db, bool userActive = true)
    {
        var user = new User("ext-1", AuthProvider.Google, "u@test.com", "User", null);
        if (!userActive) user.Deactivate();
        db.Users.Add(user);

        var token = new RefreshToken(user.Id, "valid-refresh-token", DateTime.UtcNow.AddDays(30));
        db.RefreshTokens.Add(token);
        db.SaveChanges();
        return (user, token);
    }

    [Fact]
    public async Task Handle_ValidToken_ReturnsNewTokenPair()
    {
        using var db = TestDbContextFactory.Create();
        SeedActiveToken(db);

        var result = await CreateHandler(db).Handle(
            new RefreshTokenCommand("valid-refresh-token"), default);

        Assert.NotNull(result.AccessToken);
        Assert.NotNull(result.RefreshToken);
        Assert.NotEqual("valid-refresh-token", result.RefreshToken);
    }

    [Fact]
    public async Task Handle_ValidToken_RevokesOldToken()
    {
        using var db = TestDbContextFactory.Create();
        var (_, oldToken) = SeedActiveToken(db);

        await CreateHandler(db).Handle(
            new RefreshTokenCommand("valid-refresh-token"), default);

        Assert.True(oldToken.IsRevoked);
        Assert.False(oldToken.IsActive);
    }

    [Fact]
    public async Task Handle_ValidToken_IssuedNewTokenIsActive()
    {
        using var db = TestDbContextFactory.Create();
        SeedActiveToken(db);

        var result = await CreateHandler(db).Handle(
            new RefreshTokenCommand("valid-refresh-token"), default);

        var newToken = db.RefreshTokens.Single(t => t.Token == result.RefreshToken);
        Assert.True(newToken.IsActive);
    }

    [Fact]
    public async Task Handle_InvalidToken_ThrowsUnauthorizedException()
    {
        using var db = TestDbContextFactory.Create();

        await Assert.ThrowsAsync<UnauthorizedException>(() =>
            CreateHandler(db).Handle(new RefreshTokenCommand("nonexistent"), default));
    }

    [Fact]
    public async Task Handle_RevokedToken_ThrowsUnauthorizedException()
    {
        using var db = TestDbContextFactory.Create();
        var (_, token) = SeedActiveToken(db);
        token.Revoke();
        await db.SaveChangesAsync();

        await Assert.ThrowsAsync<UnauthorizedException>(() =>
            CreateHandler(db).Handle(new RefreshTokenCommand("valid-refresh-token"), default));
    }

    [Fact]
    public async Task Handle_ExpiredToken_ThrowsUnauthorizedException()
    {
        using var db = TestDbContextFactory.Create();
        var user = new User("ext-2", AuthProvider.Google, "e@test.com", "Expired", null);
        db.Users.Add(user);
        var expired = new RefreshToken(user.Id, "expired-token", DateTime.UtcNow.AddDays(-1));
        db.RefreshTokens.Add(expired);
        await db.SaveChangesAsync();

        await Assert.ThrowsAsync<UnauthorizedException>(() =>
            CreateHandler(db).Handle(new RefreshTokenCommand("expired-token"), default));
    }

    [Fact]
    public async Task Handle_InactiveUser_ThrowsUnauthorizedException()
    {
        using var db = TestDbContextFactory.Create();
        SeedActiveToken(db, userActive: false);

        await Assert.ThrowsAsync<UnauthorizedException>(() =>
            CreateHandler(db).Handle(new RefreshTokenCommand("valid-refresh-token"), default));
    }
}
