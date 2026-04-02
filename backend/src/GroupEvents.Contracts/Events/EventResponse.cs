namespace GroupEvents.Contracts.Events;

public record EventResponse(
    Guid      Id,
    Guid      GroupId,
    Guid      CreatedBy,
    string    Title,
    string    EventType,
    string?   Location,
    string    Timezone,
    DateTime  ScheduledAt,
    int       DurationMinutes,
    DateTime? RegistrationOpensAt,
    DateTime? RegistrationClosesAt,
    string    Status,
    int       TrackCount,
    int       CapacityPerTrack,
    int       TotalCapacity,
    int       ConfirmedCount,
    int       AvailableSpots,
    string?   Notes
);
