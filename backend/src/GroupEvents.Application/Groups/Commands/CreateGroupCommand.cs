using GroupEvents.Application.Common.Interfaces;
using GroupEvents.Contracts.Groups;
using GroupEvents.Domain.Entities;
using GroupEvents.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using RegexLib = System.Text.RegularExpressions.Regex;

namespace GroupEvents.Application.Groups.Commands;

public record CreateGroupCommand(Guid UserId, string Name) : IRequest<GroupResponse>;

public class CreateGroupCommandHandler : IRequestHandler<CreateGroupCommand, GroupResponse>
{
    private readonly IAppDbContext _db;

    public CreateGroupCommandHandler(IAppDbContext db) => _db = db;

    public async Task<GroupResponse> Handle(CreateGroupCommand request, CancellationToken cancellationToken)
    {
        var slug = await BuildUniqueSlugAsync(request.Name, cancellationToken);

        var group = new Group(request.Name, slug, request.UserId);
        _db.Groups.Add(group);

        _db.GroupMemberships.Add(new GroupMembership(group.Id, request.UserId, MemberRole.Owner));

        await _db.SaveChangesAsync(cancellationToken);

        return new GroupResponse(group.Id, group.Name, group.Slug,
            group.InviteCode, group.InviteLinkEnabled, group.OwnerId, MemberCount: 1);
    }

    private async Task<string> BuildUniqueSlugAsync(string name, CancellationToken ct)
    {
        var base64 = RegexLib.Replace(name.ToLowerInvariant().Trim(), @"\s+", "-");
        var slug   = RegexLib.Replace(base64, @"[^a-z0-9\-]", "");

        if (!await _db.Groups.AnyAsync(g => g.Slug == slug, ct))
            return slug;

        // Append short suffix to avoid collisions
        var suffix = Guid.NewGuid().ToString("N")[..6];
        return $"{slug}-{suffix}";
    }
}
