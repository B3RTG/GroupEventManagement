using GroupEvents.Application.Common.Exceptions;
using GroupEvents.Application.Common.Interfaces;
using GroupEvents.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GroupEvents.Application.Groups.Commands;

public record RemoveMemberCommand(
    Guid RequesterId,
    Guid GroupId,
    Guid TargetUserId
) : IRequest;

public class RemoveMemberCommandHandler : IRequestHandler<RemoveMemberCommand>
{
    private readonly IAppDbContext _db;

    public RemoveMemberCommandHandler(IAppDbContext db) => _db = db;

    public async Task Handle(RemoveMemberCommand request, CancellationToken cancellationToken)
    {
        var requesterMembership = await _db.GroupMemberships.FirstOrDefaultAsync(
            m => m.GroupId == request.GroupId && m.UserId == request.RequesterId && m.IsActive,
            cancellationToken)
            ?? throw new ForbiddenException("You are not a member of this group.");

        if (requesterMembership.Role == MemberRole.Member)
            throw new ForbiddenException("Only the owner or a co-admin can remove members.");

        if (request.TargetUserId == request.RequesterId)
            throw new InvalidOperationException("You cannot remove yourself from the group.");

        var targetMembership = await _db.GroupMemberships.FirstOrDefaultAsync(
            m => m.GroupId == request.GroupId && m.UserId == request.TargetUserId && m.IsActive,
            cancellationToken)
            ?? throw new NotFoundException("GroupMembership", request.TargetUserId);

        if (targetMembership.Role == MemberRole.Owner)
            throw new ForbiddenException("The group owner cannot be removed.");

        if (requesterMembership.Role == MemberRole.CoAdmin && targetMembership.Role == MemberRole.CoAdmin)
            throw new ForbiddenException("Co-admins cannot remove other co-admins.");

        targetMembership.Leave();

        await _db.SaveChangesAsync(cancellationToken);
    }
}
