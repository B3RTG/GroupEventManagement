namespace GroupEvents.Application.Common.Models;

public record ExternalUserInfo(
    string ExternalId,
    string? Email,
    string DisplayName,
    string? AvatarUrl
);
