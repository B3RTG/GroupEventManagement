using GroupEvents.Contracts.Events;
using GroupEvents.Domain.Entities;

namespace GroupEvents.Application.Events;

internal static class EventMappingExtensions
{
    internal static EventResponse ToResponse(
        this Event ev,
        int confirmedCount,
        int waitlistCount = 0,
        string? myRegistration = null) =>
        new(
            ev.Id,
            ev.GroupId,
            ev.Title,
            Description:    ev.Notes,
            ev.EventType,
            ev.Location,
            LocationUrl:    null,          // field not yet in domain entity
            ev.Timezone,
            ev.ScheduledAt,
            ev.DurationMinutes,
            Status:         ev.Status.ToString().ToLower(),
            ev.TrackCount,
            ev.CapacityPerTrack,
            ev.TotalCapacity,
            confirmedCount,
            waitlistCount,
            myRegistration);
}
