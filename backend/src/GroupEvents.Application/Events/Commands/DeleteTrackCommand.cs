using GroupEvents.Application.Common.Exceptions;
using GroupEvents.Application.Common.Interfaces;
using GroupEvents.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GroupEvents.Application.Events.Commands;

public record DeleteTrackCommand(Guid UserId, Guid GroupId, Guid EventId, Guid TrackId) : IRequest;

public class DeleteTrackCommandHandler : IRequestHandler<DeleteTrackCommand>
{
    private readonly IAppDbContext _db;

    public DeleteTrackCommandHandler(IAppDbContext db) => _db = db;

    public async Task Handle(DeleteTrackCommand request, CancellationToken cancellationToken)
    {
        var membership = await _db.GroupMemberships.FirstOrDefaultAsync(
            m => m.GroupId == request.GroupId && m.UserId == request.UserId && m.IsActive,
            cancellationToken)
            ?? throw new ForbiddenException("You are not a member of this group.");

        if (membership.Role == MemberRole.Member)
            throw new ForbiddenException("Only owners and co-admins can manage tracks.");

        var track = await _db.Tracks.FirstOrDefaultAsync(
            t => t.Id == request.TrackId && t.EventId == request.EventId, cancellationToken)
            ?? throw new NotFoundException("Track", request.TrackId);

        _db.Tracks.Remove(track);
        await _db.SaveChangesAsync(cancellationToken);
    }
}
