using GroupEvents.Application.Common.Exceptions;
using GroupEvents.Application.Common.Interfaces;
using GroupEvents.Application.Common.Notifications;
using GroupEvents.Domain.Entities;
using GroupEvents.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;

namespace GroupEvents.Application.Events.Commands;

public record CancelRegistrationCommand(Guid UserId, Guid GroupId, Guid EventId) : IRequest;

public class CancelRegistrationCommandHandler : IRequestHandler<CancelRegistrationCommand>
{
    private readonly IAppDbContext _db;
    private readonly INotificationService _notifications;

    public CancelRegistrationCommandHandler(IAppDbContext db, INotificationService notifications)
    {
        _db = db;
        _notifications = notifications;
    }

    public async Task Handle(CancelRegistrationCommand request, CancellationToken ct)
    {
        var isMember = await _db.GroupMemberships.AnyAsync(
            m => m.GroupId == request.GroupId && m.UserId == request.UserId, ct);
        if (!isMember) throw new ForbiddenException("Not a member of this group.");

        var tx = await _db.BeginSerializableTransactionAsync(ct);

        try
        {
            var registration = await _db.EventRegistrations.FirstOrDefaultAsync(
                r => r.EventId == request.EventId && r.UserId == request.UserId
                     && r.Status == RegistrationStatus.Confirmed, ct)
                ?? throw new NotFoundException(nameof(EventRegistration), request.UserId);

            registration.Cancel(request.UserId);

            // Promote oldest waiting entry (FIFO)
            var nextInLine = await _db.WaitlistEntries
                .Where(w => w.EventId == request.EventId && w.Status == WaitlistStatus.Waiting)
                .OrderBy(w => w.JoinedAt)
                .FirstOrDefaultAsync(ct);

            if (nextInLine != null)
            {
                var promoted = EventRegistration.FromWaitlist(request.EventId, nextInLine.UserId,
                    nextInLine.IsGuestRegistration, nextInLine.GuestId);
                _db.EventRegistrations.Add(promoted);
                await _db.SaveChangesAsync(ct); // persist to get promoted.Id
                nextInLine.Promote(promoted.Id);
            }

            await _db.SaveChangesAsync(ct);
            if (tx != null) await tx.CommitAsync(ct);

            if (nextInLine != null)
            {
                await _notifications.EnqueueAsync(
                    nextInLine.UserId,
                    NotificationTypes.PromotedFromWaitlist,
                    "Plaza confirmada",
                    "¡Tienes plaza! Has sido promovido desde la lista de espera.",
                    NotificationChannel.Push,
                    idempotencyKey: $"promoted:{request.EventId}:{nextInLine.UserId}",
                    ct: ct);
            }
        }
        catch
        {
            if (tx != null) await tx.RollbackAsync(CancellationToken.None);
            throw;
        }
        finally
        {
            tx?.Dispose();
        }
    }
}
