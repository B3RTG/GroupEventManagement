using GroupEvents.Application.Common.Exceptions;
using GroupEvents.Application.Common.Interfaces;
using GroupEvents.Contracts.Registrations;
using GroupEvents.Domain.Entities;
using GroupEvents.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GroupEvents.Application.Events.Queries;

public record GetWaitlistPositionQuery(Guid UserId, Guid GroupId, Guid EventId)
    : IRequest<WaitlistPositionResponse>;

public class GetWaitlistPositionQueryHandler
    : IRequestHandler<GetWaitlistPositionQuery, WaitlistPositionResponse>
{
    private readonly IAppDbContext _db;
    public GetWaitlistPositionQueryHandler(IAppDbContext db) => _db = db;

    public async Task<WaitlistPositionResponse> Handle(
        GetWaitlistPositionQuery request, CancellationToken ct)
    {
        var isMember = await _db.GroupMemberships.AnyAsync(
            m => m.GroupId == request.GroupId && m.UserId == request.UserId, ct);
        if (!isMember) throw new ForbiddenException("Not a member of this group.");

        var entry = await _db.WaitlistEntries.FirstOrDefaultAsync(
            w => w.EventId == request.EventId && w.UserId == request.UserId
                 && w.Status == WaitlistStatus.Waiting, ct)
            ?? throw new NotFoundException(nameof(WaitlistEntry), request.UserId);

        var position = await _db.WaitlistEntries.CountAsync(
            w => w.EventId == request.EventId && w.Status == WaitlistStatus.Waiting
                 && w.JoinedAt <= entry.JoinedAt, ct);

        return new WaitlistPositionResponse(entry.Id, position, entry.JoinedAt);
    }
}
