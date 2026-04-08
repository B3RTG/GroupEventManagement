namespace GroupEvents.Contracts.Events;

public record UpcomingEventResponse(
    Guid     Id,
    Guid     GroupId,
    string   GroupName,
    string   Title,
    string   EventType,
    string?  Location,
    string   Status,
    DateTime ScheduledAt,
    int      TotalCapacity,
    int      ConfirmedCount,
    string?  MyRegistration
);
