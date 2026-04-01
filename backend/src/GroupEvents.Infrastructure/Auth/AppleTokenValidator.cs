using GroupEvents.Application.Common.Interfaces;
using GroupEvents.Application.Common.Models;

namespace GroupEvents.Infrastructure.Auth;

/// <summary>
/// TODO: Implement Apple Sign In token validation.
/// Requires fetching Apple's JWKS from https://appleid.apple.com/auth/keys
/// and validating the JWT signature + claims (iss, aud, exp, sub).
/// </summary>
public class AppleTokenValidator : IExternalTokenValidator
{
    public Task<ExternalUserInfo?> ValidateAsync(string idToken, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException(
            "Apple Sign In is not yet configured. Set up TeamId, KeyId and BundleId in appsettings.");
    }
}
