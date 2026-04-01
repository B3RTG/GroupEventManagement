using GroupEvents.Domain.Enums;

namespace GroupEvents.Application.Common.Interfaces;

public interface IExternalTokenValidatorFactory
{
    IExternalTokenValidator GetValidator(AuthProvider provider);
}
