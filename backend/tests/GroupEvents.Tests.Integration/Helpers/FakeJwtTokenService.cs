using GroupEvents.Application.Common.Interfaces;
using GroupEvents.Domain.Entities;

namespace GroupEvents.Tests.Integration.Helpers;

/// <summary>Deterministic JWT stub — no crypto, predictable output for assertions.</summary>
public class FakeJwtTokenService : IJwtTokenService
{
    public AccessTokenResult GenerateAccessToken(User user) =>
        new($"access-token-{user.Id}", 3600);

    public RefreshToken GenerateRefreshToken(Guid userId) =>
        new(userId, $"refresh-token-{userId}-{Guid.NewGuid()}", DateTime.UtcNow.AddDays(30));
}
