namespace GroupEvents.Infrastructure.Auth.Settings;

public class JwtSettings
{
    public const string SectionName = "Jwt";

    public string Secret { get; init; } = null!;
    public string Issuer { get; init; } = null!;
    public string Audience { get; init; } = null!;
    public int AccessTokenExpiryMinutes { get; init; } = 15;
    public int RefreshTokenExpiryDays { get; init; } = 7;
}
