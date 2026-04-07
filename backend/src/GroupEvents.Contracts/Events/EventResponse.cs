namespace GroupEvents.Contracts.Events;

public record EventResponse(
    Guid      Id,
    Guid      GroupId,
    string    Title,
    string?   Description,
    string    EventType,
    string?   Location,
    string?   LocationUrl,
    string    Timezone,
    DateTime  ScheduledAt,
    int       DurationMinutes,
    string    Status,
    int       TrackCount,
    int       CapacityPerTrack,
    int       TotalCapacity,
    int       ConfirmedCount,
    int       WaitlistCount,
    string?   MyRegistration
);
