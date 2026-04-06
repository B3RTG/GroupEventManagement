namespace GroupEvents.Application.Common.Interfaces;

public record PushSendResult(bool Success, bool TokenUnregistered);

public interface IPushNotificationService
{
    /// <summary>
    /// Sends a push notification via FCM. Returns Success=false and TokenUnregistered=true
    /// when FCM reports the device token as no longer valid.
    /// </summary>
    Task<PushSendResult> SendAsync(
        string pushToken,
        string title,
        string body,
        Dictionary<string, string>? data = null,
        CancellationToken ct = default);
}
