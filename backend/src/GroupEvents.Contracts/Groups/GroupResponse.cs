namespace GroupEvents.Contracts.Groups;

public record GroupResponse(
    Guid   Id,
    string Name,
    string Slug,
    string InviteCode,
    bool   InviteLinkEnabled,
    Guid   OwnerId,
    int    MemberCount
);
