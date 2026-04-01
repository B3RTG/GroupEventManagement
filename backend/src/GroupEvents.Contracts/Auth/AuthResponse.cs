namespace GroupEvents.Contracts.Auth;

public record AuthResponse(
    string AccessToken,
    string RefreshToken,
    DateTime RefreshTokenExpiresAt,
    UserResponse User
);
