using GroupEvents.Application.Common.Interfaces;
using GroupEvents.Contracts.Groups;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GroupEvents.Application.Groups.Queries;

public record GetMyGroupsQuery(Guid UserId) : IRequest<IReadOnlyList<GroupResponse>>;

public class GetMyGroupsQueryHandler : IRequestHandler<GetMyGroupsQuery, IReadOnlyList<GroupResponse>>
{
    private readonly IAppDbContext _db;

    public GetMyGroupsQueryHandler(IAppDbContext db) => _db = db;

    public async Task<IReadOnlyList<GroupResponse>> Handle(GetMyGroupsQuery request, CancellationToken cancellationToken)
    {
        var memberships = await _db.GroupMemberships
            .Where(m => m.UserId == request.UserId && m.IsActive)
            .Select(m => m.GroupId)
            .ToListAsync(cancellationToken);

        var groups = await _db.Groups
            .Where(g => memberships.Contains(g.Id) && g.IsActive)
            .ToListAsync(cancellationToken);

        var memberCounts = await _db.GroupMemberships
            .Where(m => memberships.Contains(m.GroupId) && m.IsActive)
            .GroupBy(m => m.GroupId)
            .Select(g => new { GroupId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.GroupId, x => x.Count, cancellationToken);

        return groups.Select(g => new GroupResponse(
            g.Id, g.Name, g.Slug, g.InviteCode, g.InviteLinkEnabled,
            g.OwnerId, memberCounts.GetValueOrDefault(g.Id, 0))).ToList();
    }
}
