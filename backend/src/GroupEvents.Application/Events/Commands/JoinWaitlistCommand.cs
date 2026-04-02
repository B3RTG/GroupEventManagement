using GroupEvents.Application.Common.Exceptions;
using GroupEvents.Application.Common.Interfaces;
using GroupEvents.Domain.Entities;
using GroupEvents.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GroupEvents.Application.Events.Commands;

public record JoinWaitlistCommand(Guid UserId, Guid GroupId, Guid EventId) : IRequest<JoinWaitlistResult>;

public record JoinWaitlistResult(Guid EntryId, int Position, DateTime JoinedAt);

public class JoinWaitlistCommandHandler : IRequestHandler<JoinWaitlistCommand, JoinWaitlistResult>
{
    private readonly IAppDbContext _db;
    public JoinWaitlistCommandHandler(IAppDbContext db) => _db = db;

    public async Task<JoinWaitlistResult> Handle(JoinWaitlistCommand request, CancellationToken ct)
    {
        var isMember = await _db.GroupMemberships.AnyAsync(
            m => m.GroupId == request.GroupId && m.UserId == request.UserId, ct);
        if (!isMember) throw new ForbiddenException("Not a member of this group.");

        var ev = await _db.Events.FirstOrDefaultAsync(
            e => e.Id == request.EventId && e.GroupId == request.GroupId, ct)
            ?? throw new NotFoundException(nameof(Event), request.EventId);

        if (ev.Status != EventStatus.Published)
            throw new InvalidOperationException("Event is not published.");

        var alreadyRegistered = await _db.EventRegistrations.AnyAsync(
            r => r.EventId == request.EventId && r.UserId == request.UserId
                 && r.Status == RegistrationStatus.Confirmed, ct);
        if (alreadyRegistered) throw new ConflictException("Already registered for this event.");

        var alreadyWaiting = await _db.WaitlistEntries.AnyAsync(
            w => w.EventId == request.EventId && w.UserId == request.UserId
                 && w.Status == WaitlistStatus.Waiting, ct);
        if (alreadyWaiting) throw new ConflictException("Already on the waitlist.");

        var entry = new WaitlistEntry(request.EventId, request.UserId);
        _db.WaitlistEntries.Add(entry);
        await _db.SaveChangesAsync(ct);

        var position = await _db.WaitlistEntries.CountAsync(
            w => w.EventId == request.EventId && w.Status == WaitlistStatus.Waiting
                 && w.JoinedAt <= entry.JoinedAt, ct);

        return new JoinWaitlistResult(entry.Id, position, entry.JoinedAt);
    }
}
