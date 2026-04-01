using GroupEvents.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GroupEvents.Infrastructure.Persistence.Configurations;

public class AuditLogConfiguration : IEntityTypeConfiguration<AuditLog>
{
    public void Configure(EntityTypeBuilder<AuditLog> builder)
    {
        builder.ToTable("audit_logs");

        builder.HasKey(a => a.Id);

        builder.Property(a => a.TargetType).IsRequired().HasMaxLength(64);
        builder.Property(a => a.Action).IsRequired().HasMaxLength(64);
        builder.Property(a => a.Payload).HasColumnType("jsonb");

        builder.HasIndex(a => new { a.TargetType, a.TargetId });
        builder.HasIndex(a => a.ActorId);

        builder.HasOne(a => a.Actor)
            .WithMany()
            .HasForeignKey(a => a.ActorId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
