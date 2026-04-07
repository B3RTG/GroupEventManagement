namespace GroupEvents.Contracts.Groups;

public record MemberResponse(
    Guid     UserId,
    string   DisplayName,
    string?  Email,
    string?  AvatarUrl,
    string   Role,
    DateTime JoinedAt
);
