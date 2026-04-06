namespace GroupEvents.Contracts.Auth;

public record AuthResponse(
    string AccessToken,
    string RefreshToken,
    /// <summary>Seconds until the access token expires.</summary>
    int ExpiresIn,
    UserResponse User
);
