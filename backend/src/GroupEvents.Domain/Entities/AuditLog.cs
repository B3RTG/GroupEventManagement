namespace GroupEvents.Domain.Entities;

// Append-only — no UpdatedAt, no BaseEntity inheritance
public class AuditLog
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public Guid? ActorId { get; private set; }
    public string TargetType { get; private set; } = null!;
    public Guid TargetId { get; private set; }
    public string Action { get; private set; } = null!;
    public string? Payload { get; private set; } // JSON
    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;

    // Navigation
    public User? Actor { get; private set; }

    private AuditLog() { } // EF Core

    public AuditLog(Guid? actorId, string targetType, Guid targetId, string action, string? payload = null)
    {
        ActorId = actorId;
        TargetType = targetType;
        TargetId = targetId;
        Action = action;
        Payload = payload;
    }
}
