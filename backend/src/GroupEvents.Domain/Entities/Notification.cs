using GroupEvents.Domain.Common;
using GroupEvents.Domain.Enums;

namespace GroupEvents.Domain.Entities;

public class Notification : BaseEntity
{
    public Guid UserId { get; private set; }
    public string Type { get; private set; } = null!;
    public string Title { get; private set; } = null!;
    public string Body { get; private set; } = null!;
    public string? Data { get; private set; } // JSON payload
    public NotificationChannel Channel { get; private set; }
    public NotificationStatus Status { get; private set; } = NotificationStatus.Pending;
    public string IdempotencyKey { get; private set; } = null!;

    // Navigation
    public User User { get; private set; } = null!;

    private Notification() { } // EF Core

    public Notification(
        Guid userId, string type, string title, string body,
        NotificationChannel channel, string idempotencyKey, string? data = null)
    {
        UserId = userId;
        Type = type;
        Title = title;
        Body = body;
        Channel = channel;
        IdempotencyKey = idempotencyKey;
        Data = data;
    }

    public void MarkSent() => Status = NotificationStatus.Sent;
    public void MarkFailed() => Status = NotificationStatus.Failed;
    public void MarkRead() => Status = NotificationStatus.Read;
}
