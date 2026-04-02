using GroupEvents.Application.Common.Exceptions;
using GroupEvents.Application.Common.Interfaces;
using GroupEvents.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GroupEvents.Application.Events.Commands;

public record UpdateEventCommand(
    Guid      UserId,
    Guid      GroupId,
    Guid      EventId,
    string?   Title                 = null,
    string?   Location              = null,
    DateTime? ScheduledAt           = null,
    int?      DurationMinutes       = null,
    string?   Notes                 = null,
    DateTime? RegistrationOpensAt  = null,
    DateTime? RegistrationClosesAt = null,
    int?      TrackCount            = null,
    int?      CapacityPerTrack      = null
) : IRequest;

public class UpdateEventCommandHandler : IRequestHandler<UpdateEventCommand>
{
    private readonly IAppDbContext _db;

    public UpdateEventCommandHandler(IAppDbContext db) => _db = db;

    public async Task Handle(UpdateEventCommand request, CancellationToken cancellationToken)
    {
        await RequireAdminAsync(request.UserId, request.GroupId, cancellationToken);

        var ev = await _db.Events.FirstOrDefaultAsync(
            e => e.Id == request.EventId && e.GroupId == request.GroupId, cancellationToken)
            ?? throw new NotFoundException("Event", request.EventId);

        // Update non-capacity fields if any are provided
        if (request.Title is not null || request.ScheduledAt is not null ||
            request.DurationMinutes is not null || request.Location is not null ||
            request.Notes is not null || request.RegistrationOpensAt is not null ||
            request.RegistrationClosesAt is not null)
        {
            ev.Update(
                request.Title              ?? ev.Title,
                request.Location           ?? ev.Location,
                request.ScheduledAt        ?? ev.ScheduledAt,
                request.DurationMinutes    ?? ev.DurationMinutes,
                request.Notes              ?? ev.Notes,
                request.RegistrationOpensAt   ?? ev.RegistrationOpensAt,
                request.RegistrationClosesAt  ?? ev.RegistrationClosesAt);
        }

        // Update capacity if requested — validates against confirmed registrations
        if (request.TrackCount is not null || request.CapacityPerTrack is not null)
        {
            var confirmedCount = await _db.EventRegistrations.CountAsync(
                r => r.EventId == ev.Id && r.Status == RegistrationStatus.Confirmed, cancellationToken);

            ev.UpdateCapacity(
                request.TrackCount       ?? ev.TrackCount,
                request.CapacityPerTrack ?? ev.CapacityPerTrack,
                confirmedCount);
        }

        await _db.SaveChangesAsync(cancellationToken);
    }

    private async Task RequireAdminAsync(Guid userId, Guid groupId, CancellationToken ct)
    {
        var membership = await _db.GroupMemberships.FirstOrDefaultAsync(
            m => m.GroupId == groupId && m.UserId == userId && m.IsActive, ct)
            ?? throw new ForbiddenException("You are not a member of this group.");

        if (membership.Role == MemberRole.Member)
            throw new ForbiddenException("Only owners and co-admins can edit events.");
    }
}
