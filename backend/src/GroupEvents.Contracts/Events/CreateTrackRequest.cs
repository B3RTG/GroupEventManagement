namespace GroupEvents.Contracts.Events;

public record CreateTrackRequest(string Name, int SortOrder, int? Capacity = null);
