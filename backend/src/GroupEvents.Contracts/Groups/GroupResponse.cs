namespace GroupEvents.Contracts.Groups;

public record GroupResponse(
    Guid     Id,
    string   Name,
    string   Slug,
    string   InviteCode,
    bool     InviteLinkEnabled,
    Guid     OwnerId,
    int      MemberCount,
    /// <summary>The calling user's role: "owner" | "co_admin" | "member"</summary>
    string   Role,
    DateTime CreatedAt
);
