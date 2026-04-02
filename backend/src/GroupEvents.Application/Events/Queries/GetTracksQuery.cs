using GroupEvents.Application.Common.Exceptions;
using GroupEvents.Application.Common.Interfaces;
using GroupEvents.Contracts.Events;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GroupEvents.Application.Events.Queries;

public record GetTracksQuery(Guid UserId, Guid GroupId, Guid EventId) : IRequest<IReadOnlyList<TrackResponse>>;

public class GetTracksQueryHandler : IRequestHandler<GetTracksQuery, IReadOnlyList<TrackResponse>>
{
    private readonly IAppDbContext _db;

    public GetTracksQueryHandler(IAppDbContext db) => _db = db;

    public async Task<IReadOnlyList<TrackResponse>> Handle(GetTracksQuery request, CancellationToken cancellationToken)
    {
        var isMember = await _db.GroupMemberships.AnyAsync(
            m => m.GroupId == request.GroupId && m.UserId == request.UserId && m.IsActive,
            cancellationToken);

        if (!isMember)
            throw new ForbiddenException("You are not a member of this group.");

        return await _db.Tracks
            .Where(t => t.EventId == request.EventId)
            .OrderBy(t => t.SortOrder)
            .Select(t => new TrackResponse(t.Id, t.EventId, t.Name, t.Capacity, t.SortOrder))
            .ToListAsync(cancellationToken);
    }
}
