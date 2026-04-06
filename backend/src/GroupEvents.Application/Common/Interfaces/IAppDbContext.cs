using GroupEvents.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Storage;

namespace GroupEvents.Application.Common.Interfaces;

public interface IAppDbContext
{
    DatabaseFacade Database { get; }

    /// <summary>
    /// Begins a serializable transaction. Returns null for providers that do not support
    /// transactions (e.g., InMemory used in tests).
    /// </summary>
    Task<IDbContextTransaction?> BeginSerializableTransactionAsync(CancellationToken ct = default);
    DbSet<User> Users { get; }
    DbSet<Group> Groups { get; }
    DbSet<GroupMembership> GroupMemberships { get; }
    DbSet<Event> Events { get; }
    DbSet<Track> Tracks { get; }
    DbSet<EventRegistration> EventRegistrations { get; }
    DbSet<WaitlistEntry> WaitlistEntries { get; }
    DbSet<Guest> Guests { get; }
    DbSet<Notification> Notifications { get; }
    DbSet<AuditLog> AuditLogs { get; }
    DbSet<RefreshToken> RefreshTokens { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
