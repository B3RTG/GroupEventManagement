using GroupEvents.Application.Common.Exceptions;
using GroupEvents.Application.Common.Interfaces;
using GroupEvents.Application.Common.Notifications;
using GroupEvents.Domain.Entities;
using GroupEvents.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;

namespace GroupEvents.Application.Events.Commands;

public record RegisterForEventCommand(Guid UserId, Guid GroupId, Guid EventId) : IRequest<RegisterForEventResult>;

public record RegisterForEventResult(Guid RegistrationId, DateTime RegisteredAt);

public class RegisterForEventCommandHandler : IRequestHandler<RegisterForEventCommand, RegisterForEventResult>
{
    private readonly IAppDbContext _db;
    private readonly INotificationService _notifications;

    public RegisterForEventCommandHandler(IAppDbContext db, INotificationService notifications)
    {
        _db = db;
        _notifications = notifications;
    }

    public async Task<RegisterForEventResult> Handle(RegisterForEventCommand request, CancellationToken ct)
    {
        var isMember = await _db.GroupMemberships.AnyAsync(
            m => m.GroupId == request.GroupId && m.UserId == request.UserId, ct);
        if (!isMember) throw new ForbiddenException("Not a member of this group.");

        // Serializable transaction prevents phantom reads (race condition on capacity).
        var tx = await _db.BeginSerializableTransactionAsync(ct);

        try
        {
            var ev = await _db.Events.FirstOrDefaultAsync(
                e => e.Id == request.EventId && e.GroupId == request.GroupId, ct)
                ?? throw new NotFoundException(nameof(Event), request.EventId);

            if (ev.Status != EventStatus.Published)
                throw new InvalidOperationException("Event is not published.");

            var alreadyRegistered = await _db.EventRegistrations.AnyAsync(
                r => r.EventId == request.EventId && r.UserId == request.UserId
                     && r.Status == RegistrationStatus.Confirmed, ct);
            if (alreadyRegistered) throw new ConflictException("Already registered for this event.");

            var confirmedCount = await _db.EventRegistrations.CountAsync(
                r => r.EventId == request.EventId && r.Status == RegistrationStatus.Confirmed, ct);
            if (confirmedCount >= ev.TotalCapacity)
                throw new ConflictException("Event is full.");

            var registration = new EventRegistration(request.EventId, request.UserId);
            _db.EventRegistrations.Add(registration);
            await _db.SaveChangesAsync(ct);

            if (tx != null) await tx.CommitAsync(ct);

            await _notifications.EnqueueAsync(
                request.UserId,
                NotificationTypes.RegistrationConfirmed,
                "Inscripción confirmada",
                $"Tu inscripción al evento ha sido confirmada.",
                NotificationChannel.Push,
                idempotencyKey: $"registration-confirmed:{registration.Id}",
                ct: ct);

            return new RegisterForEventResult(registration.Id, registration.CreatedAt);
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
