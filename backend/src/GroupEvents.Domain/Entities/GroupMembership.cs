using GroupEvents.Domain.Common;
using GroupEvents.Domain.Enums;

namespace GroupEvents.Domain.Entities;

public class GroupMembership : BaseEntity
{
    public Guid GroupId { get; private set; }
    public Guid UserId { get; private set; }
    public MemberRole Role { get; private set; }
    public Guid? InvitedBy { get; private set; }
    public bool IsActive { get; private set; } = true;

    // Navigation
    public Group Group { get; private set; } = null!;
    public User User { get; private set; } = null!;

    private GroupMembership() { } // EF Core

    public GroupMembership(Guid groupId, Guid userId, MemberRole role, Guid? invitedBy = null)
    {
        GroupId = groupId;
        UserId = userId;
        Role = role;
        InvitedBy = invitedBy;
    }

    public void ChangeRole(MemberRole newRole) => Role = newRole;

    public void Leave() => IsActive = false;
}
