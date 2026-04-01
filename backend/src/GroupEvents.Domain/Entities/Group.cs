using GroupEvents.Domain.Common;

namespace GroupEvents.Domain.Entities;

public class Group : BaseEntity
{
    public string Name { get; private set; } = null!;
    public string Slug { get; private set; } = null!;
    public string InviteCode { get; private set; } = null!;
    public bool InviteLinkEnabled { get; private set; } = true;
    public Guid OwnerId { get; private set; }
    public bool IsActive { get; private set; } = true;

    // Navigation
    public User Owner { get; private set; } = null!;
    public ICollection<GroupMembership> Memberships { get; private set; } = new List<GroupMembership>();
    public ICollection<Event> Events { get; private set; } = new List<Event>();

    private Group() { } // EF Core

    public Group(string name, string slug, Guid ownerId)
    {
        Name = name;
        Slug = slug;
        OwnerId = ownerId;
        InviteCode = GenerateInviteCode();
    }

    public string RegenerateInviteCode()
    {
        InviteCode = GenerateInviteCode();
        return InviteCode;
    }

    public void Update(string name) => Name = name;

    public void SetInviteLinkEnabled(bool enabled) => InviteLinkEnabled = enabled;

    public void Deactivate() => IsActive = false;

    private static string GenerateInviteCode() =>
        Guid.NewGuid().ToString("N")[..8].ToUpperInvariant();
}
