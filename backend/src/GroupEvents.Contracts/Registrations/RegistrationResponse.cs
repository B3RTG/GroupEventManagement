namespace GroupEvents.Contracts.Registrations;

public record RegistrationResponse(
    Guid Id,
    Guid EventId,
    Guid UserId,
    string? DisplayName,
    string Status,
    bool PromotedFromWaitlist,
    DateTime? PromotedAt,
    bool IsGuestRegistration,
    Guid? GuestId,
    DateTime RegisteredAt
);
