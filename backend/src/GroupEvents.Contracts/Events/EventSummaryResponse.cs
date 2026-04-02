namespace GroupEvents.Contracts.Events;

public record EventSummaryResponse(
    Guid     Id,
    string   Title,
    string   EventType,
    string?  Location,
    string   Status,
    DateTime ScheduledAt,
    int      TotalCapacity,
    int      ConfirmedCount
);
