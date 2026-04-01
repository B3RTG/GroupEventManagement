using GroupEvents.Application.Common.Interfaces;
using GroupEvents.Infrastructure.Auth;
using GroupEvents.Infrastructure.Auth.Settings;
using GroupEvents.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace GroupEvents.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // Database
        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(
                configuration.GetConnectionString("DefaultConnection"),
                npgsql => npgsql.MigrationsAssembly("GroupEvents.Infrastructure")
            ).UseSnakeCaseNamingConvention());

        services.AddScoped<IAppDbContext>(sp => sp.GetRequiredService<AppDbContext>());

        // Settings
        services.Configure<JwtSettings>(options =>
            configuration.GetSection(JwtSettings.SectionName).Bind(options));
        services.Configure<GoogleAuthSettings>(options =>
            configuration.GetSection(GoogleAuthSettings.SectionName).Bind(options));

        // Auth services
        services.AddKeyedScoped<IExternalTokenValidator, GoogleTokenValidator>("Google");
        services.AddKeyedScoped<IExternalTokenValidator, AppleTokenValidator>("Apple");
        services.AddScoped<IExternalTokenValidatorFactory, ExternalTokenValidatorFactory>();
        services.AddScoped<IJwtTokenService, JwtTokenService>();

        return services;
    }
}
