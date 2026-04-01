using GroupEvents.Application.Common.Exceptions;
using GroupEvents.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GroupEvents.Application.Auth.Commands;

public record RevokeTokenCommand(string RefreshToken) : IRequest;

public class RevokeTokenCommandHandler : IRequestHandler<RevokeTokenCommand>
{
    private readonly IAppDbContext _db;

    public RevokeTokenCommandHandler(IAppDbContext db) => _db = db;

    public async Task Handle(RevokeTokenCommand request, CancellationToken cancellationToken)
    {
        var token = await _db.RefreshTokens
            .FirstOrDefaultAsync(r => r.Token == request.RefreshToken, cancellationToken);

        if (token is null || !token.IsActive)
            throw new UnauthorizedException("Refresh token is invalid or already revoked.");

        token.Revoke();
        await _db.SaveChangesAsync(cancellationToken);
    }
}
