using GroupEvents.Application.Common.Models;

namespace GroupEvents.Application.Common.Interfaces;

public interface IExternalTokenValidator
{
    Task<ExternalUserInfo?> ValidateAsync(string idToken, CancellationToken cancellationToken = default);
}
