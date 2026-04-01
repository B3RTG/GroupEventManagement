using GroupEvents.Domain.Common;
using GroupEvents.Domain.Enums;

namespace GroupEvents.Domain.Entities;

public class User : BaseEntity
{
    public string ExternalId { get; private set; } = null!;
    public AuthProvider AuthProvider { get; private set; }
    public string? Email { get; private set; }
    public string DisplayName { get; private set; } = null!;
    public string? AvatarUrl { get; private set; }
    public string? PushToken { get; private set; }
    public bool IsActive { get; private set; } = true;

    // Navigation
    public ICollection<GroupMembership> Memberships { get; private set; } = new List<GroupMembership>();
    public ICollection<Notification> Notifications { get; private set; } = new List<Notification>();

    private User() { } // EF Core

    public User(string externalId, AuthProvider authProvider, string? email, string displayName, string? avatarUrl)
    {
        ExternalId = externalId;
        AuthProvider = authProvider;
        Email = email;
        DisplayName = displayName;
        AvatarUrl = avatarUrl;
    }

    public void UpdateProfile(string displayName, string? avatarUrl)
    {
        DisplayName = displayName;
        AvatarUrl = avatarUrl;
    }

    public void UpdatePushToken(string? pushToken) => PushToken = pushToken;

    public void Deactivate() => IsActive = false;
}
