using GroupEvents.Contracts.Events;
using GroupEvents.Domain.Entities;

namespace GroupEvents.Application.Events;

internal static class EventMappingExtensions
{
    internal static EventResponse ToResponse(this Event ev, int confirmedCount) =>
        new(
            ev.Id,
            ev.GroupId,
            ev.CreatedBy,
            ev.Title,
            ev.EventType,
            ev.Location,
            ev.Timezone,
            ev.ScheduledAt,
            ev.DurationMinutes,
            ev.RegistrationOpensAt,
            ev.RegistrationClosesAt,
            ev.Status.ToString(),
            ev.TrackCount,
            ev.CapacityPerTrack,
            ev.TotalCapacity,
            confirmedCount,
            AvailableSpots: Math.Max(0, ev.TotalCapacity - confirmedCount),
            ev.Notes);
}
