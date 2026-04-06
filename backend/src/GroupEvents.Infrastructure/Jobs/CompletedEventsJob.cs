using GroupEvents.Application.Common.Interfaces;
using GroupEvents.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace GroupEvents.Infrastructure.Jobs;

/// <summary>
/// Runs daily at 02:00 UTC. Marks as Completed all Published events whose
/// end time (ScheduledAt + DurationMinutes) has already passed.
/// </summary>
public class CompletedEventsJob
{
    private readonly IAppDbContext _db;
    private readonly ILogger<CompletedEventsJob> _logger;

    public CompletedEventsJob(IAppDbContext db, ILogger<CompletedEventsJob> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task ExecuteAsync(CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;

        var events = await _db.Events
            .Where(e => e.Status == EventStatus.Published)
            .ToListAsync(ct);

        var completed = events
            .Where(e => e.ScheduledAt.AddMinutes(e.DurationMinutes) < now)
            .ToList();

        if (completed.Count == 0) return;

        foreach (var ev in completed)
            ev.Complete();

        await _db.SaveChangesAsync(ct);

        _logger.LogInformation(
            "CompletedEventsJob: marked {Count} events as Completed.", completed.Count);
    }
}
