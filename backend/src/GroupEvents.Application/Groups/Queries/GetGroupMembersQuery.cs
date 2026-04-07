using GroupEvents.Application.Common.Exceptions;
using GroupEvents.Application.Common.Interfaces;
using GroupEvents.Contracts.Groups;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GroupEvents.Application.Groups.Queries;

public record GetGroupMembersQuery(Guid UserId, Guid GroupId) : IRequest<IReadOnlyList<MemberResponse>>;

public class GetGroupMembersQueryHandler : IRequestHandler<GetGroupMembersQuery, IReadOnlyList<MemberResponse>>
{
    private readonly IAppDbContext _db;

    public GetGroupMembersQueryHandler(IAppDbContext db) => _db = db;

    public async Task<IReadOnlyList<MemberResponse>> Handle(GetGroupMembersQuery request, CancellationToken cancellationToken)
    {
        var isMember = await _db.GroupMemberships.AnyAsync(
            m => m.GroupId == request.GroupId && m.UserId == request.UserId && m.IsActive,
            cancellationToken);

        if (!isMember)
            throw new ForbiddenException("You are not a member of this group.");

        return await _db.GroupMemberships
            .Where(m => m.GroupId == request.GroupId && m.IsActive)
            .Join(_db.Users,
                m => m.UserId,
                u => u.Id,
                (m, u) => new MemberResponse(u.Id, u.DisplayName, u.Email, u.AvatarUrl, m.Role.ToString(), m.CreatedAt))
            .ToListAsync(cancellationToken);
    }
}
