using GroupEvents.Application.Common.Exceptions;
using GroupEvents.Application.Common.Interfaces;
using GroupEvents.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GroupEvents.Application.Events.Commands;

public record UpdateTrackCommand(
    Guid   UserId,
    Guid   GroupId,
    Guid   EventId,
    Guid   TrackId,
    string Name,
    int    SortOrder
) : IRequest;

public class UpdateTrackCommandHandler : IRequestHandler<UpdateTrackCommand>
{
    private readonly IAppDbContext _db;

    public UpdateTrackCommandHandler(IAppDbContext db) => _db = db;

    public async Task Handle(UpdateTrackCommand request, CancellationToken cancellationToken)
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

        track.Update(request.Name, request.SortOrder);
        await _db.SaveChangesAsync(cancellationToken);
    }
}
