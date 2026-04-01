using GroupEvents.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GroupEvents.Infrastructure.Persistence.Configurations;

public class WaitlistEntryConfiguration : IEntityTypeConfiguration<WaitlistEntry>
{
    public void Configure(EntityTypeBuilder<WaitlistEntry> builder)
    {
        builder.ToTable("waitlist_entries");

        builder.HasKey(w => w.Id);

        builder.Property(w => w.Status).HasConversion<string>().IsRequired().HasMaxLength(16);

        // Index for FIFO promotion queries
        builder.HasIndex(w => new { w.EventId, w.Status, w.JoinedAt });

        builder.HasOne(w => w.User)
            .WithMany()
            .HasForeignKey(w => w.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(w => w.Registration)
            .WithMany()
            .HasForeignKey(w => w.RegistrationId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(w => w.Guest)
            .WithMany()
            .HasForeignKey(w => w.GuestId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
