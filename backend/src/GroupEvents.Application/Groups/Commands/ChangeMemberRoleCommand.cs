using GroupEvents.Application.Common.Exceptions;
using GroupEvents.Application.Common.Interfaces;
using GroupEvents.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GroupEvents.Application.Groups.Commands;

public record ChangeMemberRoleCommand(
    Guid      RequesterId,
    Guid      GroupId,
    Guid      TargetUserId,
    MemberRole NewRole
) : IRequest;

public class ChangeMemberRoleCommandHandler : IRequestHandler<ChangeMemberRoleCommand>
{
    private readonly IAppDbContext _db;

    public ChangeMemberRoleCommandHandler(IAppDbContext db) => _db = db;

    public async Task Handle(ChangeMemberRoleCommand request, CancellationToken cancellationToken)
    {
        var requesterMembership = await _db.GroupMemberships.FirstOrDefaultAsync(
            m => m.GroupId == request.GroupId && m.UserId == request.RequesterId && m.IsActive,
            cancellationToken)
            ?? throw new ForbiddenException("You are not a member of this group.");

        if (requesterMembership.Role != MemberRole.Owner)
            throw new ForbiddenException("Only the group owner can change member roles.");

        if (request.TargetUserId == request.RequesterId)
            throw new InvalidOperationException("You cannot change your own role.");

        if (request.NewRole == MemberRole.Owner)
            throw new InvalidOperationException("Cannot assign the Owner role. Transfer ownership is not supported.");

        var targetMembership = await _db.GroupMemberships.FirstOrDefaultAsync(
            m => m.GroupId == request.GroupId && m.UserId == request.TargetUserId && m.IsActive,
            cancellationToken)
            ?? throw new NotFoundException("GroupMembership", request.TargetUserId);

        targetMembership.ChangeRole(request.NewRole);

        await _db.SaveChangesAsync(cancellationToken);
    }
}
