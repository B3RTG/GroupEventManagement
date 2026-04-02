using System.Security.Claims;
using GroupEvents.Application.Auth.Commands;
using GroupEvents.Application.Auth.Queries;
using GroupEvents.Contracts.Auth;
using GroupEvents.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GroupEvents.Api.Controllers;

[ApiController]
[Route("api/v1/auth")]
public class AuthController : ControllerBase
{
    private readonly IMediator _mediator;

    public AuthController(IMediator mediator) => _mediator = mediator;

    /// <summary>Login with Google ID token.</summary>
    [HttpPost("google")]
    public async Task<ActionResult<AuthResponse>> LoginWithGoogle(
        [FromBody] LoginRequest request,
        CancellationToken ct)
    {
        var result = await _mediator.Send(new LoginCommand(request.IdToken, AuthProvider.Google, request.PushToken), ct);
        return Ok(result);
    }

    /// <summary>Login with Apple ID token.</summary>
    [HttpPost("apple")]
    public async Task<ActionResult<AuthResponse>> LoginWithApple(
        [FromBody] LoginRequest request,
        CancellationToken ct)
    {
        var result = await _mediator.Send(new LoginCommand(request.IdToken, AuthProvider.Apple, request.PushToken), ct);
        return Ok(result);
    }

    /// <summary>Exchange a refresh token for a new access + refresh token pair.</summary>
    [HttpPost("refresh")]
    public async Task<ActionResult<AuthResponse>> Refresh(
        [FromBody] RefreshTokenRequest request,
        CancellationToken ct)
    {
        var result = await _mediator.Send(new RefreshTokenCommand(request.RefreshToken), ct);
        return Ok(result);
    }

    /// <summary>Revoke a refresh token (logout).</summary>
    [Authorize]
    [HttpDelete("session")]
    public async Task<IActionResult> Logout(
        [FromBody] RefreshTokenRequest request,
        CancellationToken ct)
    {
        await _mediator.Send(new RevokeTokenCommand(request.RefreshToken), ct);
        return NoContent();
    }

    /// <summary>Get the current authenticated user.</summary>
    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<UserResponse>> GetMe(CancellationToken ct)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await _mediator.Send(new GetMeQuery(userId), ct);
        return Ok(result);
    }

    /// <summary>Update the push token for the current device.</summary>
    [Authorize]
    [HttpPut("me")]
    public async Task<IActionResult> UpdatePushToken(
        [FromBody] UpdatePushTokenRequest request,
        CancellationToken ct)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        await _mediator.Send(new UpdatePushTokenCommand(userId, request.PushToken), ct);
        return NoContent();
    }
}
