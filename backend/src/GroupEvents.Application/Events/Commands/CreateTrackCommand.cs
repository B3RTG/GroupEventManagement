using GroupEvents.Application.Common.Exceptions;
using GroupEvents.Application.Common.Interfaces;
using GroupEvents.Contracts.Events;
using GroupEvents.Domain.Entities;
using GroupEvents.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GroupEvents.Application.Events.Commands;

public record CreateTrackCommand(
    Guid   UserId,
    Guid   GroupId,
    Guid   EventId,
    string Name,
    int    SortOrder,
    int?   Capacity = null
) : IRequest<TrackResponse>;

public class CreateTrackCommandHandler : IRequestHandler<CreateTrackCommand, TrackResponse>
{
    private readonly IAppDbContext _db;

    public CreateTrackCommandHandler(IAppDbContext db) => _db = db;

    public async Task<TrackResponse> Handle(CreateTrackCommand request, CancellationToken cancellationToken)
    {
        var membership = await _db.GroupMemberships.FirstOrDefaultAsync(
            m => m.GroupId == request.GroupId && m.UserId == request.UserId && m.IsActive,
            cancellationToken)
            ?? throw new ForbiddenException("You are not a member of this group.");

        if (membership.Role == MemberRole.Member)
            throw new ForbiddenException("Only owners and co-admins can manage tracks.");

        var ev = await _db.Events.FirstOrDefaultAsync(
            e => e.Id == request.EventId && e.GroupId == request.GroupId, cancellationToken)
            ?? throw new NotFoundException("Event", request.EventId);

        var capacity = request.Capacity ?? ev.CapacityPerTrack;
        var track = new Track(ev.Id, request.Name, capacity, request.SortOrder);
        _db.Tracks.Add(track);

        var confirmedCount = await _db.EventRegistrations.CountAsync(
            r => r.EventId == ev.Id && r.Status == RegistrationStatus.Confirmed, cancellationToken);
        ev.UpdateCapacity(ev.TrackCount + 1, ev.CapacityPerTrack, confirmedCount);

        await _db.SaveChangesAsync(cancellationToken);

        return new TrackResponse(track.Id, track.EventId, track.Name, track.Capacity, track.SortOrder);
    }
}
