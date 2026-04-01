namespace GroupEvents.Contracts.Auth;

public record UserResponse(
    Guid Id,
    string DisplayName,
    string? Email,
    string? AvatarUrl
);
