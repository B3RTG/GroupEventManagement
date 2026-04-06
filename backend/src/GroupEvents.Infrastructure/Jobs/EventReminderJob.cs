using GroupEvents.Application.Common.Interfaces;
using GroupEvents.Application.Common.Notifications;
using GroupEvents.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace GroupEvents.Infrastructure.Jobs;

/// <summary>
/// Runs every hour. Creates reminder notifications for events starting in the next 24 hours.
/// The idempotency key prevents duplicate reminders even if the job overlaps or the user
/// registers after the first run (inscripciones tardías).
/// </summary>
public class EventReminderJob
{
    private readonly IAppDbContext _db;
    private readonly INotificationService _notifications;
    private readonly ILogger<EventReminderJob> _logger;

    public EventReminderJob(
        IAppDbContext db,
        INotificationService notifications,
        ILogger<EventReminderJob> logger)
    {
        _db = db;
        _notifications = notifications;
        _logger = logger;
    }

    public async Task ExecuteAsync(CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        var window = now.AddHours(24);

        var upcomingEventIds = await _db.Events
            .Where(e => e.Status == EventStatus.Published
                        && e.ScheduledAt >= now
                        && e.ScheduledAt <= window)
            .Select(e => new { e.Id, e.Title, e.ScheduledAt })
            .ToListAsync(ct);

        if (upcomingEventIds.Count == 0) return;

        foreach (var ev in upcomingEventIds)
        {
            var registrantIds = await _db.EventRegistrations
                .Where(r => r.EventId == ev.Id && r.Status == RegistrationStatus.Confirmed)
                .Select(r => r.UserId)
                .ToListAsync(ct);

            foreach (var userId in registrantIds)
            {
                await _notifications.EnqueueAsync(
                    userId,
                    NotificationTypes.EventReminder,
                    "Recordatorio de evento",
                    $"Tu evento \"{ev.Title}\" comienza el {ev.ScheduledAt:dd/MM/yyyy} a las {ev.ScheduledAt:HH:mm} UTC.",
                    NotificationChannel.Push,
                    idempotencyKey: $"reminder:{ev.Id}:{userId}",
                    ct: ct);
            }

            _logger.LogDebug(
                "EventReminderJob: enqueued reminders for event {EventId} ({Count} registrants).",
                ev.Id, registrantIds.Count);
        }
    }
}
