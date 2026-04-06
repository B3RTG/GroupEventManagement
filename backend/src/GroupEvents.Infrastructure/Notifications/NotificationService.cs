using GroupEvents.Application.Common.Interfaces;
using GroupEvents.Domain.Entities;
using GroupEvents.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace GroupEvents.Infrastructure.Notifications;

/// <summary>
/// Writes a Notification record in Pending state. Actual delivery is handled by
/// NotificationDispatchJob — this keeps HTTP handlers free of outbound HTTP calls.
/// The unique index on IdempotencyKey silently discards duplicates.
/// </summary>
public class NotificationService : INotificationService
{
    private readonly IAppDbContext _db;

    public NotificationService(IAppDbContext db) => _db = db;

    public async Task EnqueueAsync(
        Guid userId,
        string type,
        string title,
        string body,
        NotificationChannel channel,
        string idempotencyKey,
        string? data = null,
        CancellationToken ct = default)
    {
        var alreadyQueued = await _db.Notifications.AnyAsync(
            n => n.IdempotencyKey == idempotencyKey, ct);

        if (alreadyQueued) return;

        _db.Notifications.Add(new Notification(userId, type, title, body, channel, idempotencyKey, data));
        await _db.SaveChangesAsync(ct);
    }
}
