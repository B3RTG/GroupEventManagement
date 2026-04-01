using Google.Apis.Auth;
using GroupEvents.Application.Common.Interfaces;
using GroupEvents.Application.Common.Models;
using GroupEvents.Infrastructure.Auth.Settings;
using Microsoft.Extensions.Options;

namespace GroupEvents.Infrastructure.Auth;

public class GoogleTokenValidator : IExternalTokenValidator
{
    private readonly GoogleAuthSettings _settings;

    public GoogleTokenValidator(IOptions<GoogleAuthSettings> options)
        => _settings = options.Value;

    public async Task<ExternalUserInfo?> ValidateAsync(string idToken, CancellationToken cancellationToken = default)
    {
        try
        {
            var payload = await GoogleJsonWebSignature.ValidateAsync(idToken,
                new GoogleJsonWebSignature.ValidationSettings
                {
                    Audience = [_settings.ClientId]
                });

            return new ExternalUserInfo(
                ExternalId: payload.Subject,
                Email: payload.Email,
                DisplayName: payload.Name ?? payload.Email ?? payload.Subject,
                AvatarUrl: payload.Picture);
        }
        catch (InvalidJwtException)
        {
            return null;
        }
    }
}
