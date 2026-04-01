using GroupEvents.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GroupEvents.Infrastructure.Persistence.Configurations;

public class NotificationConfiguration : IEntityTypeConfiguration<Notification>
{
    public void Configure(EntityTypeBuilder<Notification> builder)
    {
        builder.ToTable("notifications");

        builder.HasKey(n => n.Id);

        builder.Property(n => n.Type).IsRequired().HasMaxLength(64);
        builder.Property(n => n.Title).IsRequired().HasMaxLength(200);
        builder.Property(n => n.Body).IsRequired().HasMaxLength(1000);
        builder.Property(n => n.Data).HasColumnType("jsonb");
        builder.Property(n => n.Channel).HasConversion<string>().IsRequired().HasMaxLength(16);
        builder.Property(n => n.Status).HasConversion<string>().IsRequired().HasMaxLength(16);
        builder.Property(n => n.IdempotencyKey).IsRequired().HasMaxLength(256);

        // Hangfire dispatch job queries pending notifications
        builder.HasIndex(n => n.Status).HasFilter("status = 'Pending'");
        builder.HasIndex(n => n.IdempotencyKey).IsUnique();

        builder.HasOne(n => n.User)
            .WithMany(u => u.Notifications)
            .HasForeignKey(n => n.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
