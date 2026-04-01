using GroupEvents.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GroupEvents.Infrastructure.Persistence.Configurations;

public class GuestConfiguration : IEntityTypeConfiguration<Guest>
{
    public void Configure(EntityTypeBuilder<Guest> builder)
    {
        builder.ToTable("guests");

        builder.HasKey(g => g.Id);

        builder.Property(g => g.DisplayName).IsRequired().HasMaxLength(100);
        builder.Property(g => g.Email).HasMaxLength(256);

        builder.HasOne(g => g.InvitedByUser)
            .WithMany()
            .HasForeignKey(g => g.InvitedBy)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(g => g.Group)
            .WithMany()
            .HasForeignKey(g => g.GroupId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
