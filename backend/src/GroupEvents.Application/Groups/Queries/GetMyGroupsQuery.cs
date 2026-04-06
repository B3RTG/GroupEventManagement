using GroupEvents.Application.Common.Interfaces;
using GroupEvents.Contracts.Groups;
using GroupEvents.Domain.Enums;
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
            .ToListAsync(cancellationToken);

        var groupIds = memberships.Select(m => m.GroupId).ToList();

        var groups = await _db.Groups
            .Where(g => groupIds.Contains(g.Id) && g.IsActive)
            .ToListAsync(cancellationToken);

        var memberCounts = await _db.GroupMemberships
            .Where(m => groupIds.Contains(m.GroupId) && m.IsActive)
            .GroupBy(m => m.GroupId)
            .Select(g => new { GroupId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.GroupId, x => x.Count, cancellationToken);

        var roleByGroup = memberships.ToDictionary(m => m.GroupId, m => m.Role);

        return groups.Select(g => new GroupResponse(
            g.Id, g.Name, g.Slug, g.InviteCode, g.InviteLinkEnabled,
            g.OwnerId, memberCounts.GetValueOrDefault(g.Id, 0),
            ToRoleString(roleByGroup.GetValueOrDefault(g.Id, MemberRole.Member)),
            g.CreatedAt)).ToList();
    }

    private static string ToRoleString(MemberRole role) => role switch
    {
        MemberRole.Owner   => "owner",
        MemberRole.CoAdmin => "co_admin",
        _                  => "member",
    };
}
