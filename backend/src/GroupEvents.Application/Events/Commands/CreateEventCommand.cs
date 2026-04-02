using GroupEvents.Application.Common.Exceptions;
using GroupEvents.Application.Common.Interfaces;
using GroupEvents.Contracts.Events;
using GroupEvents.Domain.Entities;
using GroupEvents.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GroupEvents.Application.Events.Commands;

public record CreateEventCommand(
    Guid      UserId,
    Guid      GroupId,
    string    Title,
    string    EventType,
    string?   Location,
    string    Timezone,
    DateTime  ScheduledAt,
    int       DurationMinutes,
    int       TrackCount,
    int       CapacityPerTrack,
    string?   Notes                  = null,
    DateTime? RegistrationOpensAt  = null,
    DateTime? RegistrationClosesAt = null
) : IRequest<EventResponse>;

public class CreateEventCommandHandler : IRequestHandler<CreateEventCommand, EventResponse>
{
    private readonly IAppDbContext _db;

    public CreateEventCommandHandler(IAppDbContext db) => _db = db;

    public async Task<EventResponse> Handle(CreateEventCommand request, CancellationToken cancellationToken)
    {
        var membership = await _db.GroupMemberships.FirstOrDefaultAsync(
            m => m.GroupId == request.GroupId && m.UserId == request.UserId && m.IsActive,
            cancellationToken)
            ?? throw new ForbiddenException("You are not a member of this group.");

        if (membership.Role == MemberRole.Member)
            throw new ForbiddenException("Only owners and co-admins can create events.");

        var ev = new Event(
            request.GroupId, request.UserId, request.Title, request.EventType,
            request.Location, request.Timezone, request.ScheduledAt, request.DurationMinutes,
            request.TrackCount, request.CapacityPerTrack, request.Notes,
            request.RegistrationOpensAt, request.RegistrationClosesAt);

        _db.Events.Add(ev);
        await _db.SaveChangesAsync(cancellationToken);

        return ev.ToResponse(confirmedCount: 0);
    }
}
