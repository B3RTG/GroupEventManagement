using GroupEvents.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GroupEvents.Infrastructure.Persistence.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("users");

        builder.HasKey(u => u.Id);

        builder.Property(u => u.ExternalId).IsRequired().HasMaxLength(256);
        builder.Property(u => u.AuthProvider).HasConversion<string>().IsRequired().HasMaxLength(16);
        builder.Property(u => u.Email).HasMaxLength(256);
        builder.Property(u => u.DisplayName).IsRequired().HasMaxLength(100);
        builder.Property(u => u.AvatarUrl).HasMaxLength(1024);
        builder.Property(u => u.PushToken).HasMaxLength(512);

        builder.HasIndex(u => new { u.ExternalId, u.AuthProvider }).IsUnique();
    }
}
