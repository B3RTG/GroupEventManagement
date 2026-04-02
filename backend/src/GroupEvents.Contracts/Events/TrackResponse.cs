namespace GroupEvents.Contracts.Events;

public record TrackResponse(
    Guid   Id,
    Guid   EventId,
    string Name,
    int    Capacity,
    int    SortOrder
);
