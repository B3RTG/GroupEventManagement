namespace GroupEvents.Contracts.Auth;

public record LoginRequest(string IdToken, string? PushToken);
