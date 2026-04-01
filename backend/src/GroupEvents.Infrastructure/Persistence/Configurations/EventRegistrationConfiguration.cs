using GroupEvents.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GroupEvents.Infrastructure.Persistence.Configurations;

public class EventRegistrationConfiguration : IEntityTypeConfiguration<EventRegistration>
{
    public void Configure(EntityTypeBuilder<EventRegistration> builder)
    {
        builder.ToTable("event_registrations");

        builder.HasKey(r => r.Id);

        builder.Property(r => r.Status).HasConversion<string>().IsRequired().HasMaxLength(16);

        // A user can only have one confirmed registration per event (excluding guest registrations)
        builder.HasIndex(r => new { r.EventId, r.UserId })
            .IsUnique()
            .HasFilter("status = 'Confirmed' AND guest_id IS NULL");

        builder.HasOne(r => r.User)
            .WithMany()
            .HasForeignKey(r => r.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(r => r.Guest)
            .WithMany()
            .HasForeignKey(r => r.GuestId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
