using GroupEvents.Application.Common.Exceptions;
using GroupEvents.Application.Common.Interfaces;
using GroupEvents.Contracts.Auth;
using GroupEvents.Domain.Entities;
using GroupEvents.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GroupEvents.Application.Auth.Commands;

public record LoginCommand(
    string IdToken,
    AuthProvider Provider,
    string? PushToken
) : IRequest<AuthResponse>;

public class LoginCommandHandler : IRequestHandler<LoginCommand, AuthResponse>
{
    private readonly IAppDbContext _db;
    private readonly IExternalTokenValidatorFactory _validatorFactory;
    private readonly IJwtTokenService _jwtService;

    public LoginCommandHandler(
        IAppDbContext db,
        IExternalTokenValidatorFactory validatorFactory,
        IJwtTokenService jwtService)
    {
        _db = db;
        _validatorFactory = validatorFactory;
        _jwtService = jwtService;
    }

    public async Task<AuthResponse> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        // 1. Validate external token
        var validator = _validatorFactory.GetValidator(request.Provider);
        var externalUser = await validator.ValidateAsync(request.IdToken, cancellationToken);
        if (externalUser is null)
            throw new UnauthorizedException("Invalid identity token.");

        // 2. Find or create user
        var user = await _db.Users.FirstOrDefaultAsync(
            u => u.ExternalId == externalUser.ExternalId && u.AuthProvider == request.Provider,
            cancellationToken);

        if (user is null)
        {
            user = new User(externalUser.ExternalId, request.Provider,
                            externalUser.Email, externalUser.DisplayName, externalUser.AvatarUrl);
            _db.Users.Add(user);
        }
        else
        {
            if (!user.IsActive)
                throw new UnauthorizedException("Account is deactivated.");

            user.UpdateProfile(externalUser.DisplayName, externalUser.AvatarUrl);
        }

        // 3. Update push token if provided
        if (request.PushToken is not null)
            user.UpdatePushToken(request.PushToken);

        // 4. Generate tokens
        var accessToken = _jwtService.GenerateAccessToken(user);
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
