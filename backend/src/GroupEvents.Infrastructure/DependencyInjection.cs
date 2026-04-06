using GroupEvents.Application.Common.Interfaces;
using GroupEvents.Infrastructure.Auth;
using GroupEvents.Infrastructure.Auth.Settings;
using GroupEvents.Infrastructure.Jobs;
using GroupEvents.Infrastructure.Notifications;
using GroupEvents.Infrastructure.Persistence;
using GroupEvents.Infrastructure.Settings;
using Hangfire;
using Hangfire.PostgreSql;
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
        var connectionString = configuration.GetConnectionString("DefaultConnection");

        // Database
        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(
                connectionString,
                npgsql => npgsql.MigrationsAssembly("GroupEvents.Infrastructure")
            ).UseSnakeCaseNamingConvention());

        services.AddScoped<IAppDbContext>(sp => sp.GetRequiredService<AppDbContext>());

        // Settings
        services.Configure<JwtSettings>(options =>
            configuration.GetSection(JwtSettings.SectionName).Bind(options));
        services.Configure<GoogleAuthSettings>(options =>
            configuration.GetSection(GoogleAuthSettings.SectionName).Bind(options));
        services.Configure<FcmSettings>(options =>
            configuration.GetSection(FcmSettings.SectionName).Bind(options));
        services.Configure<ResendSettings>(options =>
            configuration.GetSection(ResendSettings.SectionName).Bind(options));

        // Auth services
        services.AddKeyedScoped<IExternalTokenValidator, GoogleTokenValidator>("Google");
        services.AddKeyedScoped<IExternalTokenValidator, AppleTokenValidator>("Apple");
        services.AddScoped<IExternalTokenValidatorFactory, ExternalTokenValidatorFactory>();
        services.AddScoped<IJwtTokenService, JwtTokenService>();

        // Notification services
        services.AddScoped<INotificationService, NotificationService>();
        services.AddHttpClient<IPushNotificationService, FcmPushNotificationService>();
        services.AddHttpClient<IEmailService, ResendEmailService>();

        // Hangfire jobs (transient — Hangfire resolves them per execution)
        services.AddTransient<NotificationDispatchJob>();
        services.AddTransient<WaitlistSafetyNetJob>();
        services.AddTransient<CompletedEventsJob>();
        services.AddTransient<PushTokenCleanupJob>();
        services.AddTransient<EventReminderJob>();

        // Hangfire with PostgreSQL storage
        services.AddHangfire(config => config
            .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
            .UseSimpleAssemblyNameTypeSerializer()
            .UseRecommendedSerializerSettings()
            .UsePostgreSqlStorage(opts => opts.UseNpgsqlConnection(connectionString)));

        services.AddHangfireServer(opts =>
        {
            opts.WorkerCount = 2;
            opts.Queues = ["default"];
        });

        return services;
    }
}
