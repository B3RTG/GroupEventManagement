using GroupEvents.Domain.Common;
using GroupEvents.Domain.Enums;

namespace GroupEvents.Domain.Entities;

public class EventRegistration : BaseEntity
{
    public Guid EventId { get; private set; }
    public Guid UserId { get; private set; }
    public RegistrationStatus Status { get; private set; } = RegistrationStatus.Confirmed;
    public DateTime? CancelledAt { get; private set; }
    public Guid? CancelledBy { get; private set; }
    public bool IsGuestRegistration { get; private set; }
    public Guid? GuestId { get; private set; }
    public bool PromotedFromWaitlist { get; private set; }
    public DateTime? PromotedAt { get; private set; }

    // Navigation
    public Event Event { get; private set; } = null!;
    public User User { get; private set; } = null!;
    public Guest? Guest { get; private set; }

    private EventRegistration() { } // EF Core

    public EventRegistration(Guid eventId, Guid userId, bool isGuestRegistration = false, Guid? guestId = null)
    {
        EventId = eventId;
        UserId = userId;
        IsGuestRegistration = isGuestRegistration;
        GuestId = guestId;
    }

    public static EventRegistration FromWaitlist(Guid eventId, Guid userId, bool isGuestRegistration = false, Guid? guestId = null) =>
        new(eventId, userId, isGuestRegistration, guestId)
        {
            PromotedFromWaitlist = true,
            PromotedAt = DateTime.UtcNow
        };

    public void Cancel(Guid cancelledBy)
    {
        Status = RegistrationStatus.Cancelled;
        CancelledAt = DateTime.UtcNow;
        CancelledBy = cancelledBy;
    }
}
