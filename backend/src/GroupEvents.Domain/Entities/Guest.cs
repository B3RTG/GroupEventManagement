using GroupEvents.Domain.Common;

namespace GroupEvents.Domain.Entities;

public class Guest : BaseEntity
{
    public Guid InvitedBy { get; private set; }
    public Guid GroupId { get; private set; }
    public string DisplayName { get; private set; } = null!;
    public string? Email { get; private set; }

    // Navigation
    public User InvitedByUser { get; private set; } = null!;
    public Group Group { get; private set; } = null!;

    private Guest() { } // EF Core

    public Guest(Guid invitedBy, Guid groupId, string displayName, string? email = null)
    {
        InvitedBy = invitedBy;
        GroupId = groupId;
        DisplayName = displayName;
        Email = email;
    }
}
