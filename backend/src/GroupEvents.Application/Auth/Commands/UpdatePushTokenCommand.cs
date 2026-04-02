using GroupEvents.Application.Common.Exceptions;
using GroupEvents.Application.Common.Interfaces;
using GroupEvents.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GroupEvents.Application.Auth.Commands;

public record UpdatePushTokenCommand(Guid UserId, string? PushToken) : IRequest;

public class UpdatePushTokenCommandHandler : IRequestHandler<UpdatePushTokenCommand>
{
    private readonly IAppDbContext _db;

    public UpdatePushTokenCommandHandler(IAppDbContext db) => _db = db;

    public async Task Handle(UpdatePushTokenCommand request, CancellationToken cancellationToken)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == request.UserId && u.IsActive, cancellationToken)
            ?? throw new NotFoundException(nameof(User), request.UserId);

        user.UpdatePushToken(request.PushToken);

        await _db.SaveChangesAsync(cancellationToken);
    }
}
