namespace GroupEvents.Contracts.Events;

public record UpdateEventRequest(
    string?   Title                 = null,
    string?   Location              = null,
    DateTime? ScheduledAt           = null,
    int?      DurationMinutes       = null,
    string?   Description           = null,
    DateTime? RegistrationOpensAt  = null,
    DateTime? RegistrationClosesAt = null,
    int?      TrackCount            = null,
    int?      CapacityPerTrack      = null
);
