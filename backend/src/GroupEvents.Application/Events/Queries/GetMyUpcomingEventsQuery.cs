using GroupEvents.Application.Common.Interfaces;
using GroupEvents.Contracts.Events;
using GroupEvents.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GroupEvents.Application.Events.Queries;

public record GetMyUpcomingEventsQuery(Guid UserId, int Limit = 10) : IRequest<IReadOnlyList<UpcomingEventResponse>>;

public class GetMyUpcomingEventsQueryHandler
    : IRequestHandler<GetMyUpcomingEventsQuery, IReadOnlyList<UpcomingEventResponse>>
{
    private readonly IAppDbContext _db;

    public GetMyUpcomingEventsQueryHandler(IAppDbContext db) => _db = db;

    public async Task<IReadOnlyList<UpcomingEventResponse>> Handle(
        GetMyUpcomingEventsQuery request, CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;

        // One query: join memberships → groups → events, filter & limit
        var events = await _db.Events
            .Where(e =>
                e.Status == EventStatus.Published &&
                e.ScheduledAt > now &&
                _db.GroupMemberships.Any(m =>
                    m.GroupId == e.GroupId &&
                    m.UserId  == request.UserId &&
                    m.IsActive))
            .OrderBy(e => e.ScheduledAt)
            .Take(request.Limit)
            .Select(e => new
            {
                e.Id,
                e.GroupId,
                GroupName    = e.Group.Name,
                e.Title,
                e.EventType,
                e.Location,
                e.Status,
                e.ScheduledAt,
                e.TotalCapacity,
            })
            .ToListAsync(cancellationToken);

        if (events.Count == 0)
            return Array.Empty<UpcomingEventResponse>();

        var eventIds = events.Select(e => e.Id).ToList();

        // Confirmed counts
        var confirmedCounts = await _db.EventRegistrations
            .Where(r => eventIds.Contains(r.EventId) && r.Status == RegistrationStatus.Confirmed)
            .GroupBy(r => r.EventId)
            .Select(g => new { EventId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.EventId, x => x.Count, cancellationToken);

        // User's own registrations across these events
        var myRegistrations = await _db.EventRegistrations
            .Where(r => eventIds.Contains(r.EventId) && r.UserId == request.UserId && r.Status == RegistrationStatus.Confirmed)
            .Select(r => r.EventId)
            .ToListAsync(cancellationToken);

        var myWaitlisted = await _db.WaitlistEntries
            .Where(w => eventIds.Contains(w.EventId) && w.UserId == request.UserId && w.Status == WaitlistStatus.Waiting)
            .Select(w => w.EventId)
            .ToListAsync(cancellationToken);

        var myRegistrationSet  = myRegistrations.ToHashSet();
        var myWaitlistedSet    = myWaitlisted.ToHashSet();

        return events.Select(e =>
        {
            string? myReg = myRegistrationSet.Contains(e.Id) ? "confirmed"
                          : myWaitlistedSet.Contains(e.Id)   ? "waitlisted"
                          : null;

            return new UpcomingEventResponse(
                e.Id, e.GroupId, e.GroupName,
                e.Title, e.EventType, e.Location,
                e.Status.ToString().ToLower(),
                e.ScheduledAt,
                e.TotalCapacity,
                confirmedCounts.GetValueOrDefault(e.Id, 0),
                myReg);
        }).ToList();
    }
}
