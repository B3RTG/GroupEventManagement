using System.Security.Claims;
using GroupEvents.Application.Events.Commands;
using GroupEvents.Application.Events.Queries;
using GroupEvents.Contracts.Events;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GroupEvents.Api.Controllers;

[ApiController]
[Route("api/v1/groups/{groupId:guid}/events")]
[Authorize]
public class EventsController : ControllerBase
{
    private readonly IMediator _mediator;

    public EventsController(IMediator mediator) => _mediator = mediator;

    private Guid CurrentUserId =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // --- Events ---

    /// <summary>List all events for a group. Requires membership.</summary>
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<EventSummaryResponse>>> GetAll(
        Guid groupId, CancellationToken ct)
    {
        var result = await _mediator.Send(new GetEventsQuery(CurrentUserId, groupId), ct);
        return Ok(result);
    }

    /// <summary>Get event detail with real-time capacity. Requires membership.</summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<EventResponse>> GetById(
        Guid groupId, Guid id, CancellationToken ct)
    {
        var result = await _mediator.Send(new GetEventQuery(CurrentUserId, groupId, id), ct);
        return Ok(result);
    }

    /// <summary>Create a new event in Draft status. Owner/co-admin only.</summary>
    [HttpPost]
    public async Task<ActionResult<EventResponse>> Create(
        Guid groupId, [FromBody] CreateEventRequest request, CancellationToken ct)
    {
        var result = await _mediator.Send(new CreateEventCommand(
            CurrentUserId, groupId,
            request.Title, request.EventType, request.Location, request.Timezone,
            request.ScheduledAt, request.DurationMinutes,
            request.TrackCount, request.CapacityPerTrack,
            request.Notes, request.RegistrationOpensAt, request.RegistrationClosesAt), ct);

        return CreatedAtAction(nameof(GetById), new { groupId, id = result.Id }, result);
    }

    /// <summary>Edit a Draft event. Owner/co-admin only.</summary>
    [HttpPatch("{id:guid}")]
    public async Task<IActionResult> Update(
        Guid groupId, Guid id, [FromBody] UpdateEventRequest request, CancellationToken ct)
    {
        await _mediator.Send(new UpdateEventCommand(
            CurrentUserId, groupId, id,
            request.Title, request.Location, request.ScheduledAt, request.DurationMinutes,
            request.Notes, request.RegistrationOpensAt, request.RegistrationClosesAt,
            request.TrackCount, request.CapacityPerTrack), ct);

        return NoContent();
    }

    /// <summary>Publish a Draft event. Owner/co-admin only.</summary>
    [HttpPost("{id:guid}/publish")]
    public async Task<IActionResult> Publish(Guid groupId, Guid id, CancellationToken ct)
    {
        await _mediator.Send(new PublishEventCommand(CurrentUserId, groupId, id), ct);
        return NoContent();
    }

    /// <summary>Cancel an event. Owner/co-admin only.</summary>
    [HttpPost("{id:guid}/cancel")]
    public async Task<IActionResult> Cancel(Guid groupId, Guid id, CancellationToken ct)
    {
        await _mediator.Send(new CancelEventCommand(CurrentUserId, groupId, id), ct);
        return NoContent();
    }

    // --- Tracks ---

    /// <summary>List tracks for an event. Requires membership.</summary>
    [HttpGet("{id:guid}/tracks")]
    public async Task<ActionResult<IReadOnlyList<TrackResponse>>> GetTracks(
        Guid groupId, Guid id, CancellationToken ct)
    {
        var result = await _mediator.Send(new GetTracksQuery(CurrentUserId, groupId, id), ct);
        return Ok(result);
    }

    /// <summary>Add a named track to an event. Owner/co-admin only.</summary>
    [HttpPost("{id:guid}/tracks")]
    public async Task<ActionResult<TrackResponse>> CreateTrack(
        Guid groupId, Guid id, [FromBody] CreateTrackRequest request, CancellationToken ct)
    {
        var result = await _mediator.Send(
            new CreateTrackCommand(CurrentUserId, groupId, id, request.Name, request.SortOrder, request.Capacity), ct);

        return CreatedAtAction(nameof(GetTracks), new { groupId, id }, result);
    }

    /// <summary>Update a track's name and sort order. Owner/co-admin only.</summary>
    [HttpPut("{id:guid}/tracks/{trackId:guid}")]
    public async Task<IActionResult> UpdateTrack(
        Guid groupId, Guid id, Guid trackId, [FromBody] UpdateTrackRequest request, CancellationToken ct)
    {
        await _mediator.Send(
            new UpdateTrackCommand(CurrentUserId, groupId, id, trackId, request.Name, request.SortOrder), ct);

        return NoContent();
    }

    /// <summary>Remove a track from an event. Owner/co-admin only.</summary>
    [HttpDelete("{id:guid}/tracks/{trackId:guid}")]
    public async Task<IActionResult> DeleteTrack(
        Guid groupId, Guid id, Guid trackId, CancellationToken ct)
    {
        await _mediator.Send(new DeleteTrackCommand(CurrentUserId, groupId, id, trackId), ct);
        return NoContent();
    }
}
