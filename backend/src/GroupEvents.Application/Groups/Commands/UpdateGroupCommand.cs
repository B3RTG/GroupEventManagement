using GroupEvents.Application.Common.Exceptions;
using GroupEvents.Application.Common.Interfaces;
using GroupEvents.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GroupEvents.Application.Groups.Commands;

public record UpdateGroupCommand(Guid UserId, Guid GroupId, string Name) : IRequest;

public class UpdateGroupCommandHandler : IRequestHandler<UpdateGroupCommand>
{
    private readonly IAppDbContext _db;

    public UpdateGroupCommandHandler(IAppDbContext db) => _db = db;

    public async Task Handle(UpdateGroupCommand request, CancellationToken cancellationToken)
    {
        var membership = await _db.GroupMemberships.FirstOrDefaultAsync(
            m => m.GroupId == request.GroupId && m.UserId == request.UserId && m.IsActive,
            cancellationToken)
            ?? throw new ForbiddenException("You are not a member of this group.");

        if (membership.Role == MemberRole.Member)
            throw new ForbiddenException("Only owners and co-admins can update group settings.");

        var group = await _db.Groups.FirstOrDefaultAsync(
            g => g.Id == request.GroupId, cancellationToken)
            ?? throw new NotFoundException("Group", request.GroupId);

        group.Update(request.Name);
        await _db.SaveChangesAsync(cancellationToken);
    }
}
