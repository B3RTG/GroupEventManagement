using GroupEvents.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GroupEvents.Infrastructure.Persistence.Configurations;

public class EventConfiguration : IEntityTypeConfiguration<Event>
{
    public void Configure(EntityTypeBuilder<Event> builder)
    {
        builder.ToTable("events");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.Title).IsRequired().HasMaxLength(200);
        builder.Property(e => e.EventType).IsRequired().HasMaxLength(50);
        builder.Property(e => e.Location).HasMaxLength(300);
        builder.Property(e => e.Timezone).IsRequired().HasMaxLength(64);
        builder.Property(e => e.Notes).HasMaxLength(2000);
        builder.Property(e => e.Status).HasConversion<string>().IsRequired().HasMaxLength(16);

        // TotalCapacity is computed — not mapped to a column
        builder.Ignore(e => e.TotalCapacity);

        builder.HasIndex(e => new { e.GroupId, e.Status, e.ScheduledAt });

        builder.HasMany(e => e.Tracks)
            .WithOne(t => t.Event)
            .HasForeignKey(t => t.EventId);

        builder.HasMany(e => e.Registrations)
            .WithOne(r => r.Event)
            .HasForeignKey(r => r.EventId);

        builder.HasMany(e => e.WaitlistEntries)
            .WithOne(w => w.Event)
            .HasForeignKey(w => w.EventId);
    }
}
