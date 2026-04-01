using GroupEvents.Application.Common.Interfaces;
using GroupEvents.Domain.Enums;
using Microsoft.Extensions.DependencyInjection;

namespace GroupEvents.Infrastructure.Auth;

public class ExternalTokenValidatorFactory : IExternalTokenValidatorFactory
{
    private readonly IServiceProvider _serviceProvider;

    public ExternalTokenValidatorFactory(IServiceProvider serviceProvider)
        => _serviceProvider = serviceProvider;

    public IExternalTokenValidator GetValidator(AuthProvider provider) =>
        provider switch
        {
            AuthProvider.Google => _serviceProvider.GetRequiredKeyedService<IExternalTokenValidator>("Google"),
            AuthProvider.Apple  => _serviceProvider.GetRequiredKeyedService<IExternalTokenValidator>("Apple"),
            _ => throw new ArgumentOutOfRangeException(nameof(provider), $"No validator registered for {provider}.")
        };
}
