using GroupEvents.Application.Common.Exceptions;
using GroupEvents.Application.Common.Interfaces;
using GroupEvents.Contracts.Events;
using GroupEvents.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GroupEvents.Application.Events.Queries;

public record GetEventQuery(Guid UserId, Guid GroupId, Guid EventId) : IRequest<EventResponse>;

public class GetEventQueryHandler : IRequestHandler<GetEventQuery, EventResponse>
{
    private readonly IAppDbContext _db;

    public GetEventQueryHandler(IAppDbContext db) => _db = db;

    public async Task<EventResponse> Handle(GetEventQuery request, CancellationToken cancellationToken)
    {
        var isMember = await _db.GroupMemberships.AnyAsync(
            m => m.GroupId == request.GroupId && m.UserId == request.UserId && m.IsActive,
            cancellationToken);

        if (!isMember)
            throw new ForbiddenException("You are not a member of this group.");

        var ev = await _db.Events.FirstOrDefaultAsync(
            e => e.Id == request.EventId && e.GroupId == request.GroupId, cancellationToken)
            ?? throw new NotFoundException("Event", request.EventId);

        var confirmedCount = await _db.EventRegistrations.CountAsync(
            r => r.EventId == ev.Id && r.Status == RegistrationStatus.Confirmed, cancellationToken);

        return ev.ToResponse(confirmedCount);
    }
}
