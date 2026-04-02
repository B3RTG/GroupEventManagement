using GroupEvents.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace GroupEvents.Tests.Integration.Helpers;

public static class TestDbContextFactory
{
    /// <summary>Creates an isolated in-memory DbContext. Each call gets a fresh DB.</summary>
    public static AppDbContext Create()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }
}
