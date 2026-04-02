using GroupEvents.Application.Common.Exceptions;
using GroupEvents.Application.Common.Interfaces;
using GroupEvents.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GroupEvents.Application.Events.Commands;

public record PublishEventCommand(Guid UserId, Guid GroupId, Guid EventId) : IRequest;

public class PublishEventCommandHandler : IRequestHandler<PublishEventCommand>
{
    private readonly IAppDbContext _db;

    public PublishEventCommandHandler(IAppDbContext db) => _db = db;

    public async Task Handle(PublishEventCommand request, CancellationToken cancellationToken)
    {
        var membership = await _db.GroupMemberships.FirstOrDefaultAsync(
            m => m.GroupId == request.GroupId && m.UserId == request.UserId && m.IsActive,
            cancellationToken)
            ?? throw new ForbiddenException("You are not a member of this group.");

        if (membership.Role == MemberRole.Member)
            throw new ForbiddenException("Only owners and co-admins can publish events.");

        var ev = await _db.Events.FirstOrDefaultAsync(
            e => e.Id == request.EventId && e.GroupId == request.GroupId, cancellationToken)
            ?? throw new NotFoundException("Event", request.EventId);

        ev.Publish();
        await _db.SaveChangesAsync(cancellationToken);
    }
}
