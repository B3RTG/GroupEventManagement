using GroupEvents.Application.Common.Exceptions;
using GroupEvents.Application.Common.Interfaces;
using GroupEvents.Domain.Entities;
using GroupEvents.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GroupEvents.Application.Events.Commands;

public record LeaveWaitlistCommand(Guid UserId, Guid GroupId, Guid EventId) : IRequest;

public class LeaveWaitlistCommandHandler : IRequestHandler<LeaveWaitlistCommand>
{
    private readonly IAppDbContext _db;
    public LeaveWaitlistCommandHandler(IAppDbContext db) => _db = db;

    public async Task Handle(LeaveWaitlistCommand request, CancellationToken ct)
    {
        var isMember = await _db.GroupMemberships.AnyAsync(
            m => m.GroupId == request.GroupId && m.UserId == request.UserId, ct);
        if (!isMember) throw new ForbiddenException("Not a member of this group.");

        var entry = await _db.WaitlistEntries.FirstOrDefaultAsync(
            w => w.EventId == request.EventId && w.UserId == request.UserId
                 && w.Status == WaitlistStatus.Waiting, ct)
            ?? throw new NotFoundException(nameof(WaitlistEntry), request.UserId);

        entry.Cancel();
        await _db.SaveChangesAsync(ct);
    }
}
