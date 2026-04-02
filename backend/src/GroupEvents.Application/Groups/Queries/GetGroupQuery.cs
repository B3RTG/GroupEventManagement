using GroupEvents.Application.Common.Exceptions;
using GroupEvents.Application.Common.Interfaces;
using GroupEvents.Contracts.Groups;
using GroupEvents.Domain.Entities;
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
        var isMember = await _db.GroupMemberships.AnyAsync(
            m => m.GroupId == request.GroupId && m.UserId == request.UserId && m.IsActive,
            cancellationToken);

        if (!isMember)
            throw new ForbiddenException("You are not a member of this group.");

        var group = await _db.Groups
            .FirstOrDefaultAsync(g => g.Id == request.GroupId && g.IsActive, cancellationToken)
            ?? throw new NotFoundException(nameof(Group), request.GroupId);

        var memberCount = await _db.GroupMemberships
            .CountAsync(m => m.GroupId == group.Id && m.IsActive, cancellationToken);

        return new GroupResponse(group.Id, group.Name, group.Slug,
            group.InviteCode, group.InviteLinkEnabled, group.OwnerId, memberCount);
    }
}
