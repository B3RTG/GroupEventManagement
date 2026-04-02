using GroupEvents.Application.Common.Exceptions;
using GroupEvents.Application.Common.Interfaces;
using GroupEvents.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GroupEvents.Application.Groups.Commands;

public record RegenerateInviteCodeCommand(Guid UserId, Guid GroupId) : IRequest<string>;

public class RegenerateInviteCodeCommandHandler : IRequestHandler<RegenerateInviteCodeCommand, string>
{
    private readonly IAppDbContext _db;

    public RegenerateInviteCodeCommandHandler(IAppDbContext db) => _db = db;

    public async Task<string> Handle(RegenerateInviteCodeCommand request, CancellationToken cancellationToken)
    {
        var membership = await _db.GroupMemberships.FirstOrDefaultAsync(
            m => m.GroupId == request.GroupId && m.UserId == request.UserId && m.IsActive,
            cancellationToken)
            ?? throw new ForbiddenException("You are not a member of this group.");

        if (membership.Role == MemberRole.Member)
            throw new ForbiddenException("Only the owner or a co-admin can regenerate the invite code.");

        var group = await _db.Groups.FirstOrDefaultAsync(
            g => g.Id == request.GroupId && g.IsActive, cancellationToken)
            ?? throw new NotFoundException("Group", request.GroupId);

        var newCode = group.RegenerateInviteCode();

        await _db.SaveChangesAsync(cancellationToken);

        return newCode;
    }
}
