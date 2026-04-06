using GroupEvents.Application.Common.Exceptions;
using GroupEvents.Application.Common.Interfaces;
using GroupEvents.Contracts.Groups;
using GroupEvents.Domain.Entities;
using GroupEvents.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GroupEvents.Application.Groups.Commands;

public record JoinGroupCommand(Guid UserId, string InviteCode) : IRequest<GroupResponse>;

public class JoinGroupCommandHandler : IRequestHandler<JoinGroupCommand, GroupResponse>
{
    private readonly IAppDbContext _db;

    public JoinGroupCommandHandler(IAppDbContext db) => _db = db;

    public async Task<GroupResponse> Handle(JoinGroupCommand request, CancellationToken cancellationToken)
    {
        var group = await _db.Groups
            .FirstOrDefaultAsync(g => g.InviteCode == request.InviteCode && g.IsActive, cancellationToken)
            ?? throw new NotFoundException(nameof(Group), request.InviteCode);

        if (!group.InviteLinkEnabled)
            throw new ForbiddenException("Invite link is disabled for this group.");

        var alreadyMember = await _db.GroupMemberships.AnyAsync(
            m => m.GroupId == group.Id && m.UserId == request.UserId && m.IsActive, cancellationToken);

        if (alreadyMember)
            throw new ConflictException("You are already a member of this group.");

        _db.GroupMemberships.Add(new GroupMembership(group.Id, request.UserId, MemberRole.Member));

        await _db.SaveChangesAsync(cancellationToken);

        var memberCount = await _db.GroupMemberships
            .CountAsync(m => m.GroupId == group.Id && m.IsActive, cancellationToken);

        return new GroupResponse(group.Id, group.Name, group.Slug,
            group.InviteCode, group.InviteLinkEnabled, group.OwnerId, memberCount,
            "member", group.CreatedAt);
    }
}
