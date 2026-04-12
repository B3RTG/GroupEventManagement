using System.Text;
using GroupEvents.Api.Middleware;
using GroupEvents.Application.Auth.Commands;
using GroupEvents.Contracts.Auth;
using GroupEvents.Infrastructure;
using GroupEvents.Infrastructure.Jobs;
using GroupEvents.Infrastructure.Persistence;
using Hangfire;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// CORS — allowed origins come from config so they can differ per environment
var allowedOrigins = builder.Configuration
    .GetSection("Cors:AllowedOrigins")
    .Get<string[]>() ?? [];

builder.Services.AddCors(options =>
    options.AddDefaultPolicy(policy =>
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials()));

// Infrastructure (DB, auth services, JWT, Hangfire)
builder.Services.AddInfrastructure(builder.Configuration);

// MediatR — scans Application assembly for handlers
builder.Services.AddMediatR(cfg =>
    cfg.RegisterServicesFromAssembly(typeof(LoginCommand).Assembly));

// JWT authentication middleware
var jwtSecret = builder.Configuration["Jwt:Secret"]!;
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer           = true,
            ValidateAudience         = true,
            ValidateLifetime         = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer              = builder.Configuration["Jwt:Issuer"],
            ValidAudience            = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey         = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ClockSkew                = TimeSpan.Zero
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Name         = "Authorization",
        Type         = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
        Scheme       = "bearer",
        BearerFormat = "JWT",
        In           = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Description  = "Introduce el access token. Ejemplo: eyJhbGci..."
    });
    options.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id   = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseCors();

if (app.Environment.IsDevelopment())
{
    using (var scope = app.Services.CreateScope())
    {
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Database.MigrateAsync();
        await DevDataSeeder.SeedAsync(db);
    }

    app.UseSwagger();
    app.UseSwaggerUI();

    // Hangfire dashboard — dev only, no auth required
    app.UseHangfireDashboard("/hangfire");

    // Dev-only: issues a real JWT for a seed user without going through Google/Apple OAuth.
    // This route does not exist in any other environment.
    app.MapPost("/api/v1/dev/login", async (DevLoginRequest req, IMediator mediator, CancellationToken ct) =>
    {
        var result = await mediator.Send(new DevLoginCommand(req.Email), ct);
        return Results.Ok(result);
    });
}

// Register recurring Hangfire jobs via DI (avoid static API which requires JobStorage.Current)
using (var scope = app.Services.CreateScope())
{
    var jobs = scope.ServiceProvider.GetRequiredService<IRecurringJobManager>();

    jobs.AddOrUpdate<NotificationDispatchJob>(
        "notification-dispatch",
        job => job.ExecuteAsync(CancellationToken.None),
        "* * * * *"); // every minute

    jobs.AddOrUpdate<WaitlistSafetyNetJob>(
        "waitlist-safety-net",
        job => job.ExecuteAsync(CancellationToken.None),
        "*/5 * * * *"); // every 5 minutes

    jobs.AddOrUpdate<CompletedEventsJob>(
        "completed-events",
        job => job.ExecuteAsync(CancellationToken.None),
        "0 2 * * *"); // daily at 02:00 UTC

    jobs.AddOrUpdate<PushTokenCleanupJob>(
        "push-token-cleanup",
        job => job.ExecuteAsync(CancellationToken.None),
        "0 3 * * *"); // daily at 03:00 UTC

    jobs.AddOrUpdate<EventReminderJob>(
        "event-reminder",
        job => job.ExecuteAsync(CancellationToken.None),
        "0 * * * *"); // every hour
}

app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
