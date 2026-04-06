using GroupEvents.Application.Common.Interfaces;
using GroupEvents.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace GroupEvents.Infrastructure.Jobs;

/// <summary>
/// Runs daily at 03:00 UTC. Clears push tokens from users who have had ALL
/// their push notifications fail in the last 30 days (belt-and-suspenders
/// complement to the inline UNREGISTERED handling in NotificationDispatchJob).
/// </summary>
public class PushTokenCleanupJob
{
    private readonly IAppDbContext _db;
    private readonly ILogger<PushTokenCleanupJob> _logger;

    public PushTokenCleanupJob(IAppDbContext db, ILogger<PushTokenCleanupJob> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task ExecuteAsync(CancellationToken ct = default)
    {
        var cutoff = DateTime.UtcNow.AddDays(-30);

        // Users who still have a push token set
        var usersWithToken = await _db.Users
            .Where(u => u.PushToken != null)
            .ToListAsync(ct);

        var cleaned = 0;
        foreach (var user in usersWithToken)
        {
            // Count push notifications in the last 30 days
            var total = await _db.Notifications.CountAsync(
                n => n.UserId == user.Id
                     && n.Channel == NotificationChannel.Push
                     && n.CreatedAt >= cutoff, ct);

            if (total == 0) continue;

            var failed = await _db.Notifications.CountAsync(
                n => n.UserId == user.Id
                     && n.Channel == NotificationChannel.Push
                     && n.Status == NotificationStatus.Failed
                     && n.CreatedAt >= cutoff, ct);

            // If every push in the last 30 days failed, the token is stale
            if (total == failed)
            {
                user.UpdatePushToken(null);
                cleaned++;
            }
        }

        if (cleaned > 0)
        {
            await _db.SaveChangesAsync(ct);
            _logger.LogInformation(
                "PushTokenCleanupJob: cleared stale push tokens for {Count} users.", cleaned);
        }
    }
}
