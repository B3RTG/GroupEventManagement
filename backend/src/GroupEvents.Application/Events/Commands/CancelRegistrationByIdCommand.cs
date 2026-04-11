using GroupEvents.Application.Common.Exceptions;
using GroupEvents.Application.Common.Interfaces;
using GroupEvents.Application.Common.Notifications;
using GroupEvents.Domain.Entities;
using GroupEvents.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GroupEvents.Application.Events.Commands;

public record CancelRegistrationByIdCommand(
    Guid CallerId, Guid GroupId, Guid EventId, Guid RegistrationId) : IRequest;

public class CancelRegistrationByIdCommandHandler : IRequestHandler<CancelRegistrationByIdCommand>
{
    private readonly IAppDbContext _db;
    private readonly INotificationService _notifications;

    public CancelRegistrationByIdCommandHandler(IAppDbContext db, INotificationService notifications)
    {
        _db = db;
        _notifications = notifications;
    }

    public async Task Handle(CancelRegistrationByIdCommand request, CancellationToken ct)
    {
        var membership = await _db.GroupMemberships.FirstOrDefaultAsync(
            m => m.GroupId == request.GroupId && m.UserId == request.CallerId, ct);

        if (membership is null || membership.Role == MemberRole.Member)
            throw new ForbiddenException("Only owner or co-admin can cancel registrations on behalf of others.");

        var tx = await _db.BeginSerializableTransactionAsync(ct);

        try
        {
            var registration = await _db.EventRegistrations.FirstOrDefaultAsync(
                r => r.Id == request.RegistrationId
                     && r.EventId == request.EventId
                     && r.Status == RegistrationStatus.Confirmed, ct)
                ?? throw new NotFoundException(nameof(EventRegistration), request.RegistrationId);

            registration.Cancel(request.CallerId);

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
                await _db.SaveChangesAsync(ct);
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
                    data: System.Text.Json.JsonSerializer.Serialize(new Dictionary<string, string>
                    {
                        ["groupId"] = request.GroupId.ToString(),
                        ["eventId"] = request.EventId.ToString()
                    }),
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
