using GroupEvents.Domain.Common;
using GroupEvents.Domain.Enums;

namespace GroupEvents.Domain.Entities;

public class WaitlistEntry : BaseEntity
{
    public Guid EventId { get; private set; }
    public Guid UserId { get; private set; }
    public DateTime JoinedAt { get; private set; } = DateTime.UtcNow;
    public WaitlistStatus Status { get; private set; } = WaitlistStatus.Waiting;
    public DateTime? PromotedAt { get; private set; }
    public Guid? RegistrationId { get; private set; }
    public bool IsGuestRegistration { get; private set; }
    public Guid? GuestId { get; private set; }

    // Navigation
    public Event Event { get; private set; } = null!;
    public User User { get; private set; } = null!;
    public EventRegistration? Registration { get; private set; }
    public Guest? Guest { get; private set; }

    private WaitlistEntry() { } // EF Core

    public WaitlistEntry(Guid eventId, Guid userId, bool isGuestRegistration = false, Guid? guestId = null)
    {
        EventId = eventId;
        UserId = userId;
        IsGuestRegistration = isGuestRegistration;
        GuestId = guestId;
    }

    public void Promote(Guid registrationId)
    {
        Status = WaitlistStatus.Promoted;
        PromotedAt = DateTime.UtcNow;
        RegistrationId = registrationId;
    }

    public void Cancel() => Status = WaitlistStatus.Cancelled;
}
