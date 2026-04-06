using System.Data;
using GroupEvents.Application.Common.Interfaces;
using GroupEvents.Domain.Common;
using GroupEvents.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;

namespace GroupEvents.Infrastructure.Persistence;

public class AppDbContext : DbContext, IAppDbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Group> Groups => Set<Group>();
    public DbSet<GroupMembership> GroupMemberships => Set<GroupMembership>();
    public DbSet<Event> Events => Set<Event>();
    public DbSet<Track> Tracks => Set<Track>();
    public DbSet<EventRegistration> EventRegistrations => Set<EventRegistration>();
    public DbSet<WaitlistEntry> WaitlistEntries => Set<WaitlistEntry>();
    public DbSet<Guest> Guests => Set<Guest>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }

    public async Task<IDbContextTransaction?> BeginSerializableTransactionAsync(CancellationToken ct = default)
    {
        try { return await Database.BeginTransactionAsync(IsolationLevel.Serializable, ct); }
        catch (InvalidOperationException) { return null; } // InMemory: no transaction support
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        UpdateTimestamps();
        return base.SaveChangesAsync(cancellationToken);
    }

    public override int SaveChanges()
    {
        UpdateTimestamps();
        return base.SaveChanges();
    }

    private void UpdateTimestamps()
    {
        var now = DateTime.UtcNow;
        foreach (var entry in ChangeTracker.Entries())
        {
            if (entry.Entity is not BaseEntity) continue;

            if (entry.State == EntityState.Added)
                entry.Property(nameof(BaseEntity.CreatedAt)).CurrentValue = now;

            if (entry.State is EntityState.Added or EntityState.Modified)
                entry.Property(nameof(BaseEntity.UpdatedAt)).CurrentValue = now;
        }
    }
}
