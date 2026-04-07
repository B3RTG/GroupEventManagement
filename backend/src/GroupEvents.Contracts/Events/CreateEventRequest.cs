namespace GroupEvents.Contracts.Events;

public record CreateEventRequest(
    string   Title,
    string   EventType,
    string?  Location,
    string   Timezone,
    DateTime ScheduledAt,
    int      DurationMinutes,
    int      TrackCount,
    int      CapacityPerTrack,
    string?  Description             = null,
    DateTime? RegistrationOpensAt  = null,
    DateTime? RegistrationClosesAt = null
);
