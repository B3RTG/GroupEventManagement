using GroupEvents.Domain.Entities;
using GroupEvents.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace GroupEvents.Infrastructure.Persistence;

/// <summary>
/// Populates the database with stable development data.
/// Idempotent: safe to call on every startup.
/// Only called when ASPNETCORE_ENVIRONMENT=Development.
/// </summary>
public static class DevDataSeeder
{
    public static async Task SeedAsync(AppDbContext db)
    {
        // --- Users ---
        var owner = await db.Users.FirstOrDefaultAsync(u => u.ExternalId == "dev-google-owner");
        if (owner is null)
        {
            owner = new User("dev-google-owner", AuthProvider.Google, "owner@dev.local", "Dev Owner", null);
            db.Users.Add(owner);
        }

        var member = await db.Users.FirstOrDefaultAsync(u => u.ExternalId == "dev-google-member");
        if (member is null)
        {
            member = new User("dev-google-member", AuthProvider.Google, "member@dev.local", "Dev Member", null);
            db.Users.Add(member);
        }

        await db.SaveChangesAsync();

        // --- Group ---
        var group = await db.Groups.FirstOrDefaultAsync(g => g.Slug == "dev-group");
        if (group is null)
        {
            group = new Group("Dev Group", "dev-group", owner.Id);
            db.Groups.Add(group);

            db.GroupMemberships.Add(new GroupMembership(group.Id, owner.Id, MemberRole.Owner));
            db.GroupMemberships.Add(new GroupMembership(group.Id, member.Id, MemberRole.Member));

            await db.SaveChangesAsync();
        }

        // --- Events ---
        if (!await db.Events.AnyAsync(e => e.GroupId == group.Id))
        {
            var now = DateTime.UtcNow;

            // Draft event — editable, not visible to members yet
            var draftEvent = new Event(
                group.Id, owner.Id,
                "Sesión de entrenamiento (borrador)",
                "training",
                "Pista principal", "Europe/Madrid",
                now.AddDays(14), 90,
                trackCount: 2, capacityPerTrack: 10);
            db.Events.Add(draftEvent);

            // Published event — open for registration
            var publishedEvent = new Event(
                group.Id, owner.Id,
                "Carrera de clasificación",
                "race",
                "Circuito Norte", "Europe/Madrid",
                now.AddDays(7), 120,
                trackCount: 3, capacityPerTrack: 8,
                registrationOpensAt: now.AddDays(-1),
                registrationClosesAt: now.AddDays(6));
            publishedEvent.Publish();
            db.Events.Add(publishedEvent);

            await db.SaveChangesAsync();
        }
    }
}
