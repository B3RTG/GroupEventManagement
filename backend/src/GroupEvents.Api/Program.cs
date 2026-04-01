using GroupEvents.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        npgsql => npgsql.MigrationsAssembly("GroupEvents.Infrastructure")
    ).UseSnakeCaseNamingConvention());

var app = builder.Build();

app.UseHttpsRedirection();

app.Run();
