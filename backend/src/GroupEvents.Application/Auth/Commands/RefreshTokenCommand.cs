using GroupEvents.Application.Common.Exceptions;
using GroupEvents.Application.Common.Interfaces;
using GroupEvents.Contracts.Auth;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GroupEvents.Application.Auth.Commands;

public record RefreshTokenCommand(string RefreshToken) : IRequest<AuthResponse>;

public class RefreshTokenCommandHandler : IRequestHandler<RefreshTokenCommand, AuthResponse>
{
    private readonly IAppDbContext _db;
    private readonly IJwtTokenService _jwtService;

    public RefreshTokenCommandHandler(IAppDbContext db, IJwtTokenService jwtService)
    {
        _db = db;
        _jwtService = jwtService;
    }

    public async Task<AuthResponse> Handle(RefreshTokenCommand request, CancellationToken cancellationToken)
    {
        var existing = await _db.RefreshTokens
            .Include(r => r.User)
            .FirstOrDefaultAsync(r => r.Token == request.RefreshToken, cancellationToken);

        if (existing is null || !existing.IsActive)
            throw new UnauthorizedException("Refresh token is invalid or expired.");

        if (!existing.User.IsActive)
            throw new UnauthorizedException("Account is deactivated.");

        // Rotate: revoke old, issue new
        var newRefreshToken = _jwtService.GenerateRefreshToken(existing.UserId);
        existing.Revoke(replacedByToken: newRefreshToken.Token);
        _db.RefreshTokens.Add(newRefreshToken);

        var accessToken = _jwtService.GenerateAccessToken(existing.User);

        await _db.SaveChangesAsync(cancellationToken);

        return new AuthResponse(
            accessToken,
            newRefreshToken.Token,
            newRefreshToken.ExpiresAt,
            new UserResponse(existing.User.Id, existing.User.DisplayName,
                             existing.User.Email, existing.User.AvatarUrl));
    }
}
