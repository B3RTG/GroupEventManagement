using GroupEvents.Application.Common.Interfaces;
using GroupEvents.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace GroupEvents.Infrastructure.Jobs;

/// <summary>
/// Runs every minute (configured in Program.cs). Queries all Pending notifications and
/// dispatches them via FCM (Push) or Resend (Email). Marks each as Sent or Failed.
/// When FCM reports UNREGISTERED, the user's push token is cleared immediately.
/// </summary>
public class NotificationDispatchJob
{
    private readonly IAppDbContext _db;
    private readonly IPushNotificationService _push;
    private readonly IEmailService _email;
    private readonly ILogger<NotificationDispatchJob> _logger;

    public NotificationDispatchJob(
        IAppDbContext db,
        IPushNotificationService push,
        IEmailService email,
        ILogger<NotificationDispatchJob> logger)
    {
        _db = db;
        _push = push;
        _email = email;
        _logger = logger;
    }

    public async Task ExecuteAsync(CancellationToken ct = default)
    {
        var pending = await _db.Notifications
            .Include(n => n.User)
            .Where(n => n.Status == NotificationStatus.Pending)
            .OrderBy(n => n.CreatedAt)
            .Take(100) // process at most 100 per run to bound execution time
            .ToListAsync(ct);

        if (pending.Count == 0) return;

        _logger.LogInformation("Dispatching {Count} pending notifications.", pending.Count);

        foreach (var notification in pending)
        {
            try
            {
                var sent = notification.Channel switch
                {
                    NotificationChannel.Push  => await DispatchPushAsync(notification, ct),
                    NotificationChannel.Email => await DispatchEmailAsync(notification, ct),
                    _                         => false
                };

                if (sent) notification.MarkSent();
                else      notification.MarkFailed();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unhandled error dispatching notification {Id}.", notification.Id);
                notification.MarkFailed();
            }
        }

        await _db.SaveChangesAsync(ct);
    }

    private async Task<bool> DispatchPushAsync(
        Domain.Entities.Notification notification, CancellationToken ct)
    {
        var pushToken = notification.User?.PushToken;
        if (string.IsNullOrWhiteSpace(pushToken))
        {
            _logger.LogDebug("User {UserId} has no push token, skipping push.", notification.UserId);
            return false;
        }

        var result = await _push.SendAsync(pushToken, notification.Title, notification.Body, ct: ct);

        if (result.TokenUnregistered)
        {
            _logger.LogInformation(
                "FCM token UNREGISTERED for user {UserId}. Clearing token.", notification.UserId);
            notification.User!.UpdatePushToken(null);
        }

        return result.Success;
    }

    private async Task<bool> DispatchEmailAsync(
        Domain.Entities.Notification notification, CancellationToken ct)
    {
        var email = notification.User?.Email;
        if (string.IsNullOrWhiteSpace(email))
        {
            _logger.LogDebug("User {UserId} has no email, skipping email.", notification.UserId);
            return false;
        }

        return await _email.SendAsync(email, notification.Title, $"<p>{notification.Body}</p>", ct);
    }
}
