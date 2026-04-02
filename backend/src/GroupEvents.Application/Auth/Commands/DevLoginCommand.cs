using GroupEvents.Application.Common.Exceptions;
using GroupEvents.Application.Common.Interfaces;
using GroupEvents.Contracts.Auth;
using GroupEvents.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GroupEvents.Application.Auth.Commands;

/// <summary>
/// Bypasses external OAuth validation and issues a real JWT for an existing seed user.
/// ONLY registered in Development — this command must never be reachable in production.
/// </summary>
public record DevLoginCommand(string Email) : IRequest<AuthResponse>;

public class DevLoginCommandHandler : IRequestHandler<DevLoginCommand, AuthResponse>
{
    private readonly IAppDbContext _db;
    private readonly IJwtTokenService _jwtService;

    public DevLoginCommandHandler(IAppDbContext db, IJwtTokenService jwtService)
    {
        _db = db;
        _jwtService = jwtService;
    }

    public async Task<AuthResponse> Handle(DevLoginCommand request, CancellationToken cancellationToken)
    {
        var user = await _db.Users
            .FirstOrDefaultAsync(u => u.Email == request.Email && u.IsActive, cancellationToken)
            ?? throw new NotFoundException(nameof(User), request.Email);

        var accessToken  = _jwtService.GenerateAccessToken(user);
        var refreshToken = _jwtService.GenerateRefreshToken(user.Id);
        _db.RefreshTokens.Add(refreshToken);

        await _db.SaveChangesAsync(cancellationToken);

        return new AuthResponse(
            accessToken,
            refreshToken.Token,
            refreshToken.ExpiresAt,
            new UserResponse(user.Id, user.DisplayName, user.Email, user.AvatarUrl));
    }
}
