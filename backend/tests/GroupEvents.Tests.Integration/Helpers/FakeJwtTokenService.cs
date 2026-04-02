using GroupEvents.Application.Common.Interfaces;
using GroupEvents.Domain.Entities;

namespace GroupEvents.Tests.Integration.Helpers;

/// <summary>Deterministic JWT stub — no crypto, predictable output for assertions.</summary>
public class FakeJwtTokenService : IJwtTokenService
{
    public string GenerateAccessToken(User user) =>
        $"access-token-{user.Id}";

    public RefreshToken GenerateRefreshToken(Guid userId) =>
        new(userId, $"refresh-token-{userId}-{Guid.NewGuid()}", DateTime.UtcNow.AddDays(30));
}
