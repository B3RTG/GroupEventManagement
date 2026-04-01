namespace GroupEvents.Infrastructure.Auth.Settings;

public class GoogleAuthSettings
{
    public const string SectionName = "Auth:Google";

    public string ClientId { get; init; } = null!;
}
