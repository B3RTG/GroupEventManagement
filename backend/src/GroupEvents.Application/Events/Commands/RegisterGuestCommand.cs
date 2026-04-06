using GroupEvents.Application.Common.Exceptions;
using GroupEvents.Application.Common.Interfaces;
using GroupEvents.Domain.Entities;
using GroupEvents.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;

namespace GroupEvents.Application.Events.Commands;

public record RegisterGuestCommand(
    Guid UserId, Guid GroupId, Guid EventId,
    string DisplayName, string? Email) : IRequest<RegisterForEventResult>;

public class RegisterGuestCommandHandler : IRequestHandler<RegisterGuestCommand, RegisterForEventResult>
{
    private readonly IAppDbContext _db;
    public RegisterGuestCommandHandler(IAppDbContext db) => _db = db;

    public async Task<RegisterForEventResult> Handle(RegisterGuestCommand request, CancellationToken ct)
    {
        var membership = await _db.GroupMemberships.FirstOrDefaultAsync(
            m => m.GroupId == request.GroupId && m.UserId == request.UserId, ct);
        if (membership is null || membership.Role == MemberRole.Member)
            throw new ForbiddenException("Only owner or co-admin can register guests.");

        var tx = await _db.BeginSerializableTransactionAsync(ct);

        try
        {
            var ev = await _db.Events.FirstOrDefaultAsync(
                e => e.Id == request.EventId && e.GroupId == request.GroupId, ct)
                ?? throw new NotFoundException(nameof(Event), request.EventId);

            if (ev.Status != EventStatus.Published)
                throw new InvalidOperationException("Event is not published.");

            var confirmedCount = await _db.EventRegistrations.CountAsync(
                r => r.EventId == request.EventId && r.Status == RegistrationStatus.Confirmed, ct);
            if (confirmedCount >= ev.TotalCapacity)
                throw new ConflictException("Event is full.");

            var guest = new Guest(request.UserId, request.GroupId, request.DisplayName, request.Email);
            _db.Guests.Add(guest);
            await _db.SaveChangesAsync(ct); // persist to get guest.Id

            var registration = new EventRegistration(
                request.EventId, request.UserId, isGuestRegistration: true, guestId: guest.Id);
            _db.EventRegistrations.Add(registration);
            await _db.SaveChangesAsync(ct);

            if (tx != null) await tx.CommitAsync(ct);

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
