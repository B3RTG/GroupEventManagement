using GroupEvents.Application.Common.Exceptions;
using GroupEvents.Application.Common.Interfaces;
using GroupEvents.Contracts.Groups;
using GroupEvents.Domain.Entities;
using GroupEvents.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GroupEvents.Application.Groups.Queries;

public record GetGroupQuery(Guid UserId, Guid GroupId) : IRequest<GroupResponse>;

public class GetGroupQueryHandler : IRequestHandler<GetGroupQuery, GroupResponse>
{
    private readonly IAppDbContext _db;

    public GetGroupQueryHandler(IAppDbContext db) => _db = db;

    public async Task<GroupResponse> Handle(GetGroupQuery request, CancellationToken cancellationToken)
    {
        var membership = await _db.GroupMemberships
            .FirstOrDefaultAsync(
                m => m.GroupId == request.GroupId && m.UserId == request.UserId && m.IsActive,
                cancellationToken);

        if (membership is null)
            throw new ForbiddenException("You are not a member of this group.");

        var group = await _db.Groups
            .FirstOrDefaultAsync(g => g.Id == request.GroupId && g.IsActive, cancellationToken)
            ?? throw new NotFoundException(nameof(Group), request.GroupId);

        var memberCount = await _db.GroupMemberships
            .CountAsync(m => m.GroupId == group.Id && m.IsActive, cancellationToken);

        return new GroupResponse(
            group.Id, group.Name, group.Slug,
            group.InviteCode, group.InviteLinkEnabled, group.OwnerId,
            memberCount,
            ToRoleString(membership.Role),
            group.CreatedAt);
    }

    private static string ToRoleString(MemberRole role) => role switch
    {
        MemberRole.Owner   => "owner",
        MemberRole.CoAdmin => "co_admin",
        _                  => "member",
    };
}
