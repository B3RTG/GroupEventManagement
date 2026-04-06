using GroupEvents.Application.Common.Exceptions;
using GroupEvents.Application.Common.Interfaces;
using GroupEvents.Application.Common.Notifications;
using GroupEvents.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GroupEvents.Application.Events.Commands;

public record CancelEventCommand(Guid UserId, Guid GroupId, Guid EventId) : IRequest;

public class CancelEventCommandHandler : IRequestHandler<CancelEventCommand>
{
    private readonly IAppDbContext _db;
    private readonly INotificationService _notifications;

    public CancelEventCommandHandler(IAppDbContext db, INotificationService notifications)
    {
        _db = db;
        _notifications = notifications;
    }

    public async Task Handle(CancelEventCommand request, CancellationToken cancellationToken)
    {
        var membership = await _db.GroupMemberships.FirstOrDefaultAsync(
            m => m.GroupId == request.GroupId && m.UserId == request.UserId && m.IsActive,
            cancellationToken)
            ?? throw new ForbiddenException("You are not a member of this group.");

        if (membership.Role == MemberRole.Member)
            throw new ForbiddenException("Only owners and co-admins can cancel events.");

        var ev = await _db.Events.FirstOrDefaultAsync(
            e => e.Id == request.EventId && e.GroupId == request.GroupId, cancellationToken)
            ?? throw new NotFoundException("Event", request.EventId);

        var registrantIds = await _db.EventRegistrations
            .Where(r => r.EventId == request.EventId && r.Status == RegistrationStatus.Confirmed)
            .Select(r => r.UserId)
            .ToListAsync(cancellationToken);

        ev.Cancel();
        await _db.SaveChangesAsync(cancellationToken);

        // Notify all confirmed registrants after the state change is persisted
        foreach (var userId in registrantIds)
        {
            await _notifications.EnqueueAsync(
                userId,
                NotificationTypes.EventCancelled,
                "Evento cancelado",
                $"El evento \"{ev.Title}\" ha sido cancelado.",
                NotificationChannel.Push,
                idempotencyKey: $"event-cancelled:{ev.Id}:{userId}",
                ct: cancellationToken);
        }
    }
}
