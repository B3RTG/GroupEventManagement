using System.Security.Claims;
using GroupEvents.Application.Events.Queries;
using GroupEvents.Contracts.Events;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GroupEvents.Api.Controllers;

[ApiController]
[Route("api/v1/events")]
[Authorize]
public class MyEventsController : ControllerBase
{
    private readonly IMediator _mediator;

    public MyEventsController(IMediator mediator) => _mediator = mediator;

    private Guid CurrentUserId =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    /// <summary>
    /// Returns the authenticated user's upcoming published events across all their groups,
    /// ordered by date. Useful for the dashboard summary.
    /// </summary>
    [HttpGet("upcoming")]
    public async Task<ActionResult<IReadOnlyList<UpcomingEventResponse>>> GetUpcoming(
        [FromQuery] int limit = 10, CancellationToken ct = default)
    {
        var clamped = Math.Clamp(limit, 1, 50);
        var result  = await _mediator.Send(new GetMyUpcomingEventsQuery(CurrentUserId, clamped), ct);
        return Ok(result);
    }
}
