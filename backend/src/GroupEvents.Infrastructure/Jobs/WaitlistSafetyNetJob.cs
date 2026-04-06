using GroupEvents.Application.Common.Interfaces;
using GroupEvents.Application.Common.Notifications;
using GroupEvents.Domain.Entities;
using GroupEvents.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace GroupEvents.Infrastructure.Jobs;

/// <summary>
/// Runs every 5 minutes. Detects Published events that have available capacity AND
/// entries still in Waiting state (a gap that can occur if the in-request promotion
/// failed or was skipped). Promotes them in FIFO order using a serializable transaction.
/// </summary>
public class WaitlistSafetyNetJob
{
    private readonly IAppDbContext _db;
    private readonly INotificationService _notifications;
    private readonly ILogger<WaitlistSafetyNetJob> _logger;

    public WaitlistSafetyNetJob(
        IAppDbContext db,
        INotificationService notifications,
        ILogger<WaitlistSafetyNetJob> logger)
    {
        _db = db;
        _notifications = notifications;
        _logger = logger;
    }

    public async Task ExecuteAsync(CancellationToken ct = default)
    {
        // Events that are Published AND have at least one Waiting entry
        var eventIds = await _db.WaitlistEntries
            .Where(w => w.Status == WaitlistStatus.Waiting &&
                        w.Event.Status == EventStatus.Published)
            .Select(w => w.EventId)
            .Distinct()
            .ToListAsync(ct);

        if (eventIds.Count == 0) return;

        foreach (var eventId in eventIds)
        {
            await PromoteForEventAsync(eventId, ct);
        }
    }

    private async Task PromoteForEventAsync(Guid eventId, CancellationToken ct)
    {
        var tx = await _db.BeginSerializableTransactionAsync(ct);
        try
        {
            var ev = await _db.Events.FirstOrDefaultAsync(e => e.Id == eventId, ct);
            if (ev is null || ev.Status != EventStatus.Published) return;

            var confirmedCount = await _db.EventRegistrations.CountAsync(
                r => r.EventId == eventId && r.Status == RegistrationStatus.Confirmed, ct);

            var available = ev.TotalCapacity - confirmedCount;
            if (available <= 0) return;

            var waiting = await _db.WaitlistEntries
                .Where(w => w.EventId == eventId && w.Status == WaitlistStatus.Waiting)
                .OrderBy(w => w.JoinedAt)
                .Take(available)
                .ToListAsync(ct);

            foreach (var entry in waiting)
            {
                var registration = EventRegistration.FromWaitlist(
                    eventId, entry.UserId, entry.IsGuestRegistration, entry.GuestId);
                _db.EventRegistrations.Add(registration);
                await _db.SaveChangesAsync(ct);
                entry.Promote(registration.Id);

                _logger.LogInformation(
                    "WaitlistSafetyNet: promoted user {UserId} for event {EventId}.",
                    entry.UserId, eventId);
            }

            await _db.SaveChangesAsync(ct);
            if (tx != null) await tx.CommitAsync(ct);

            // Enqueue notifications outside the transaction
            foreach (var entry in waiting)
            {
                await _notifications.EnqueueAsync(
                    entry.UserId,
                    NotificationTypes.PromotedFromWaitlist,
                    "Plaza confirmada",
                    $"¡Tienes plaza! Has sido promovido desde la lista de espera.",
                    Domain.Enums.NotificationChannel.Push,
                    $"promoted:{ev.Id}:{entry.UserId}",
                    ct: ct);
            }
        }
        catch
        {
            if (tx != null) await tx.RollbackAsync(CancellationToken.None);
            throw;
        }
        finally
        {
            tx?.Dispose();
        }
    }
}
