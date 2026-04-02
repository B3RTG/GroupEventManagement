using GroupEvents.Application.Auth.Commands;
using GroupEvents.Application.Common.Exceptions;
using GroupEvents.Application.Common.Interfaces;
using GroupEvents.Application.Common.Models;
using GroupEvents.Domain.Entities;
using GroupEvents.Domain.Enums;
using GroupEvents.Infrastructure.Persistence;
using GroupEvents.Tests.Integration.Helpers;
using NSubstitute;

namespace GroupEvents.Tests.Integration.Auth;

public class LoginCommandHandlerTests
{
    private readonly IExternalTokenValidatorFactory _validatorFactory;
    private readonly IExternalTokenValidator _validator;
    private readonly FakeJwtTokenService _jwtService;

    public LoginCommandHandlerTests()
    {
        _validator = Substitute.For<IExternalTokenValidator>();
        _validatorFactory = Substitute.For<IExternalTokenValidatorFactory>();
        _validatorFactory.GetValidator(Arg.Any<AuthProvider>()).Returns(_validator);
        _jwtService = new FakeJwtTokenService();
    }

    private LoginCommandHandler CreateHandler(AppDbContext db) =>
        new(db, _validatorFactory, _jwtService);

    [Fact]
    public async Task Handle_NewUser_CreatesUserAndReturnsTokens()
    {
        using var db = TestDbContextFactory.Create();
        _validator.ValidateAsync("valid-token", default).Returns(
            new ExternalUserInfo("ext-123", "new@user.com", "New User", null));

        var result = await CreateHandler(db).Handle(
            new LoginCommand("valid-token", AuthProvider.Google, null), default);

        Assert.NotNull(result.AccessToken);
        Assert.NotNull(result.RefreshToken);
        Assert.Equal("New User", result.User.DisplayName);
        Assert.Single(db.Users);
        Assert.Single(db.RefreshTokens);
    }

    [Fact]
    public async Task Handle_ExistingUser_UpdatesProfileAndReturnsTokens()
    {
        using var db = TestDbContextFactory.Create();
        var existing = new User("ext-456", AuthProvider.Google, "old@user.com", "Old Name", null);
        db.Users.Add(existing);
        await db.SaveChangesAsync();

        _validator.ValidateAsync("valid-token", default).Returns(
            new ExternalUserInfo("ext-456", "old@user.com", "Updated Name", "https://avatar.url"));

        var result = await CreateHandler(db).Handle(
            new LoginCommand("valid-token", AuthProvider.Google, null), default);

        Assert.Equal("Updated Name", result.User.DisplayName);
        Assert.Single(db.Users);
    }

    [Fact]
    public async Task Handle_ExistingUserWithPushToken_StoresPushToken()
    {
        using var db = TestDbContextFactory.Create();
        _validator.ValidateAsync("valid-token", default).Returns(
            new ExternalUserInfo("ext-789", "push@user.com", "Push User", null));

        await CreateHandler(db).Handle(
            new LoginCommand("valid-token", AuthProvider.Google, "ExponentPushToken[abc]"), default);

        var user = db.Users.Single();
        Assert.Equal("ExponentPushToken[abc]", user.PushToken);
    }

    [Fact]
    public async Task Handle_InactiveUser_ThrowsUnauthorizedException()
    {
        using var db = TestDbContextFactory.Create();
        var inactive = new User("ext-999", AuthProvider.Google, "dead@user.com", "Dead", null);
        inactive.Deactivate();
        db.Users.Add(inactive);
        await db.SaveChangesAsync();

        _validator.ValidateAsync("valid-token", default).Returns(
            new ExternalUserInfo("ext-999", "dead@user.com", "Dead", null));

        await Assert.ThrowsAsync<UnauthorizedException>(() =>
            CreateHandler(db).Handle(new LoginCommand("valid-token", AuthProvider.Google, null), default));
    }

    [Fact]
    public async Task Handle_InvalidToken_ThrowsUnauthorizedException()
    {
        using var db = TestDbContextFactory.Create();
        _validator.ValidateAsync("bad-token", default).Returns((ExternalUserInfo?)null);

        await Assert.ThrowsAsync<UnauthorizedException>(() =>
            CreateHandler(db).Handle(new LoginCommand("bad-token", AuthProvider.Google, null), default));
    }
}
