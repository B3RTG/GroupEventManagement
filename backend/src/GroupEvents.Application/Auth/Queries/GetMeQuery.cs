using GroupEvents.Application.Common.Exceptions;
using GroupEvents.Application.Common.Interfaces;
using GroupEvents.Contracts.Auth;
using GroupEvents.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GroupEvents.Application.Auth.Queries;

public record GetMeQuery(Guid UserId) : IRequest<UserResponse>;

public class GetMeQueryHandler : IRequestHandler<GetMeQuery, UserResponse>
{
    private readonly IAppDbContext _db;

    public GetMeQueryHandler(IAppDbContext db) => _db = db;

    public async Task<UserResponse> Handle(GetMeQuery request, CancellationToken cancellationToken)
    {
        var user = await _db.Users
            .FirstOrDefaultAsync(u => u.Id == request.UserId && u.IsActive, cancellationToken)
            ?? throw new NotFoundException(nameof(User), request.UserId);

        return new UserResponse(user.Id, user.DisplayName, user.Email, user.AvatarUrl);
    }
}
