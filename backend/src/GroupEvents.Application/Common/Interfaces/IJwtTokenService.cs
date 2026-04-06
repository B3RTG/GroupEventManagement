using GroupEvents.Domain.Entities;

namespace GroupEvents.Application.Common.Interfaces;

public record AccessTokenResult(string Token, int ExpiresIn);

public interface IJwtTokenService
{
    AccessTokenResult GenerateAccessToken(User user);
    RefreshToken GenerateRefreshToken(Guid userId);
}
