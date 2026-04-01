using GroupEvents.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace GroupEvents.Application.Common.Interfaces;

public interface IAppDbContext
{
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
