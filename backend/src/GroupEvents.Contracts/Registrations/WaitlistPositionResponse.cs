namespace GroupEvents.Contracts.Registrations;

public record WaitlistPositionResponse(Guid EntryId, int Position, DateTime JoinedAt);
