using GroupEvents.Application.Common.Exceptions;
using GroupEvents.Application.Common.Interfaces;
using GroupEvents.Contracts.Events;
using GroupEvents.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GroupEvents.Application.Events.Queries;

public record GetEventsQuery(Guid UserId, Guid GroupId) : IRequest<IReadOnlyList<EventSummaryResponse>>;

public class GetEventsQueryHandler : IRequestHandler<GetEventsQuery, IReadOnlyList<EventSummaryResponse>>
{
    private readonly IAppDbContext _db;

    public GetEventsQueryHandler(IAppDbContext db) => _db = db;

    public async Task<IReadOnlyList<EventSummaryResponse>> Handle(GetEventsQuery request, CancellationToken cancellationToken)
    {
        var isMember = await _db.GroupMemberships.AnyAsync(
            m => m.GroupId == request.GroupId && m.UserId == request.UserId && m.IsActive,
            cancellationToken);

        if (!isMember)
            throw new ForbiddenException("You are not a member of this group.");

        var events = await _db.Events
            .Where(e => e.GroupId == request.GroupId)
            .OrderBy(e => e.ScheduledAt)
            .ToListAsync(cancellationToken);

        var eventIds = events.Select(e => e.Id).ToList();

        var confirmedCounts = await _db.EventRegistrations
            .Where(r => eventIds.Contains(r.EventId) && r.Status == RegistrationStatus.Confirmed)
            .GroupBy(r => r.EventId)
            .Select(g => new { EventId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.EventId, x => x.Count, cancellationToken);

        return events.Select(e => new EventSummaryResponse(
            e.Id, e.Title, e.EventType, e.Location, e.Status.ToString(),
            e.ScheduledAt, e.TotalCapacity,
            confirmedCounts.GetValueOrDefault(e.Id, 0))).ToList();
    }
}
