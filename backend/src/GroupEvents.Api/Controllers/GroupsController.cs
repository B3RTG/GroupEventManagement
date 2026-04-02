using System.Security.Claims;
using GroupEvents.Application.Groups.Commands;
using GroupEvents.Application.Groups.Queries;
using GroupEvents.Contracts.Groups;
using GroupEvents.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;


namespace GroupEvents.Api.Controllers;

[ApiController]
[Route("api/v1/groups")]
[Authorize]
public class GroupsController : ControllerBase
{
    private readonly IMediator _mediator;

    public GroupsController(IMediator mediator) => _mediator = mediator;

    private Guid CurrentUserId =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    /// <summary>List all groups the authenticated user belongs to.</summary>
    [HttpGet("me")]
    public async Task<ActionResult<IReadOnlyList<GroupResponse>>> GetMyGroups(CancellationToken ct)
    {
        var result = await _mediator.Send(new GetMyGroupsQuery(CurrentUserId), ct);
        return Ok(result);
    }

    /// <summary>Create a new group. The authenticated user becomes the owner.</summary>
    [HttpPost]
    public async Task<ActionResult<GroupResponse>> Create(
        [FromBody] CreateGroupRequest request,
        CancellationToken ct)
    {
        var result = await _mediator.Send(new CreateGroupCommand(CurrentUserId, request.Name), ct);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    /// <summary>Get group details. Requires membership.</summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<GroupResponse>> GetById(Guid id, CancellationToken ct)
    {
        var result = await _mediator.Send(new GetGroupQuery(CurrentUserId, id), ct);
        return Ok(result);
    }

    /// <summary>Join a group using an invite code.</summary>
    [HttpPost("join")]
    public async Task<ActionResult<GroupResponse>> Join(
        [FromBody] JoinGroupRequest request,
        CancellationToken ct)
    {
        var result = await _mediator.Send(new JoinGroupCommand(CurrentUserId, request.InviteCode), ct);
        return Ok(result);
    }

    /// <summary>List all active members of a group. Requires membership.</summary>
    [HttpGet("{id:guid}/members")]
    public async Task<ActionResult<IReadOnlyList<MemberResponse>>> GetMembers(Guid id, CancellationToken ct)
    {
        var result = await _mediator.Send(new GetGroupMembersQuery(CurrentUserId, id), ct);
        return Ok(result);
    }

    /// <summary>Change a member's role. Only the owner can do this.</summary>
    [HttpPatch("{id:guid}/members/{userId:guid}/role")]
    public async Task<IActionResult> ChangeMemberRole(
        Guid id, Guid userId,
        [FromBody] ChangeMemberRoleRequest request,
        CancellationToken ct)
    {
        if (!Enum.TryParse<MemberRole>(request.Role, ignoreCase: true, out var role))
            return BadRequest($"Invalid role '{request.Role}'. Valid values: Member, CoAdmin.");

        await _mediator.Send(new ChangeMemberRoleCommand(CurrentUserId, id, userId, role), ct);
        return NoContent();
    }

    /// <summary>Remove a member from the group. Owner can remove anyone; co-admin can remove members only.</summary>
    [HttpDelete("{id:guid}/members/{userId:guid}")]
    public async Task<IActionResult> RemoveMember(Guid id, Guid userId, CancellationToken ct)
    {
        await _mediator.Send(new RemoveMemberCommand(CurrentUserId, id, userId), ct);
        return NoContent();
    }

    /// <summary>Regenerate the group invite code. Owner or co-admin only.</summary>
    [HttpPost("{id:guid}/invite-code/regenerate")]
    public async Task<ActionResult<string>> RegenerateInviteCode(Guid id, CancellationToken ct)
    {
        var newCode = await _mediator.Send(new RegenerateInviteCodeCommand(CurrentUserId, id), ct);
        return Ok(new { inviteCode = newCode });
    }
}
