namespace GroupEvents.Infrastructure.Settings;

public class ResendSettings
{
    public const string SectionName = "Resend";

    public string ApiKey { get; set; } = string.Empty;

    /// <summary>Verified sender address (e.g. "no-reply@yourdomain.com").</summary>
    public string From { get; set; } = string.Empty;
}
