using GroupEvents.Application.Common.Exceptions;
using GroupEvents.Application.Common.Interfaces;
using GroupEvents.Contracts.Registrations;
using GroupEvents.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GroupEvents.Application.Events.Queries;

public record GetRegistrationsQuery(Guid UserId, Guid GroupId, Guid EventId)
    : IRequest<IReadOnlyList<RegistrationResponse>>;

public class GetRegistrationsQueryHandler
    : IRequestHandler<GetRegistrationsQuery, IReadOnlyList<RegistrationResponse>>
{
    private readonly IAppDbContext _db;
    public GetRegistrationsQueryHandler(IAppDbContext db) => _db = db;

    public async Task<IReadOnlyList<RegistrationResponse>> Handle(
        GetRegistrationsQuery request, CancellationToken ct)
    {
        var isMember = await _db.GroupMemberships.AnyAsync(
            m => m.GroupId == request.GroupId && m.UserId == request.UserId, ct);
        if (!isMember) throw new ForbiddenException("Not a member of this group.");

        var registrations = await _db.EventRegistrations
            .Include(r => r.User)
            .Include(r => r.Guest)
            .Where(r => r.EventId == request.EventId && r.Status == RegistrationStatus.Confirmed)
            .OrderBy(r => r.CreatedAt)
            .ToListAsync(ct);

        return registrations.Select(r => new RegistrationResponse(
            r.Id,
            r.EventId,
            r.UserId,
            r.IsGuestRegistration ? r.Guest?.DisplayName : r.User?.DisplayName,
            r.Status.ToString().ToLower(),
            r.PromotedFromWaitlist,
            r.PromotedAt,
            r.IsGuestRegistration,
            r.GuestId,
            r.CreatedAt
        )).ToList();
    }
}
