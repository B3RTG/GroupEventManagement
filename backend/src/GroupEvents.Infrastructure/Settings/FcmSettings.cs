namespace GroupEvents.Infrastructure.Settings;

public class FcmSettings
{
    public const string SectionName = "Fcm";

    /// <summary>Firebase project ID (e.g. "my-app-12345").</summary>
    public string ProjectId { get; set; } = string.Empty;

    /// <summary>
    /// Full JSON content of the Firebase service account key, or a file path to it.
    /// Set via environment variable FCM__SERVICEACCOUNTJSON in production.
    /// </summary>
    public string ServiceAccountJson { get; set; } = string.Empty;
}
