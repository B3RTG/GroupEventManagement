using GroupEvents.Domain.Enums;

namespace GroupEvents.Application.Common.Interfaces;

public interface INotificationService
{
    /// <summary>
    /// Writes a Notification record in Pending state. The NotificationDispatchJob picks it up
    /// and delivers it asynchronously — decoupled from the HTTP request.
    /// </summary>
    Task EnqueueAsync(
        Guid userId,
        string type,
        string title,
        string body,
        NotificationChannel channel,
        string idempotencyKey,
        string? data = null,
        CancellationToken ct = default);
}
