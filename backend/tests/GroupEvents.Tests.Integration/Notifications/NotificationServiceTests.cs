using GroupEvents.Application.Common.Notifications;
using GroupEvents.Domain.Entities;
using GroupEvents.Domain.Enums;
using GroupEvents.Infrastructure.Notifications;
using GroupEvents.Infrastructure.Persistence;
using GroupEvents.Tests.Integration.Helpers;

namespace GroupEvents.Tests.Integration.Notifications;

public class NotificationServiceTests
{
    private static NotificationService Service(AppDbContext db) => new(db);

    private static User SeedUser(AppDbContext db)
    {
        var user = new User("ext-1", AuthProvider.Google, "u@test.com", "User", null);
        db.Users.Add(user);
        db.SaveChanges();
        return user;
    }

    [Fact]
    public async Task EnqueueAsync_CreatesNotification_InPendingState()
    {
        using var db = TestDbContextFactory.Create();
        var user = SeedUser(db);

        await Service(db).EnqueueAsync(
            user.Id,
            NotificationTypes.RegistrationConfirmed,
            "Confirmed",
            "Your spot is confirmed.",
            NotificationChannel.Push,
            idempotencyKey: "key-1");

        var notification = db.Notifications.Single();
        Assert.Equal(NotificationStatus.Pending, notification.Status);
        Assert.Equal(NotificationTypes.RegistrationConfirmed, notification.Type);
        Assert.Equal("key-1", notification.IdempotencyKey);
    }

    [Fact]
    public async Task EnqueueAsync_DuplicateKey_DoesNotInsertSecond()
    {
        using var db = TestDbContextFactory.Create();
        var user = SeedUser(db);
        var svc = Service(db);

        await svc.EnqueueAsync(user.Id, "T", "Title", "Body",
            NotificationChannel.Push, idempotencyKey: "same-key");
        await svc.EnqueueAsync(user.Id, "T", "Title", "Body",
            NotificationChannel.Push, idempotencyKey: "same-key");

        Assert.Single(db.Notifications);
    }
}
