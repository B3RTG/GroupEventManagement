using GroupEvents.Application.Common.Interfaces;
using GroupEvents.Domain.Entities;
using GroupEvents.Domain.Enums;
using GroupEvents.Infrastructure.Jobs;
using GroupEvents.Infrastructure.Persistence;
using GroupEvents.Tests.Integration.Helpers;
using Microsoft.Extensions.Logging.Abstractions;
using NSubstitute;

namespace GroupEvents.Tests.Integration.Notifications;

public class NotificationDispatchJobTests
{
    private static NotificationDispatchJob MakeJob(
        AppDbContext db,
        IPushNotificationService? push = null,
        IEmailService? email = null)
    {
        push ??= Substitute.For<IPushNotificationService>();
        email ??= Substitute.For<IEmailService>();
        return new NotificationDispatchJob(db, push, email, NullLogger<NotificationDispatchJob>.Instance);
    }

    private static (User user, Notification notification) Seed(
        AppDbContext db,
        NotificationChannel channel = NotificationChannel.Push,
        string pushToken = "tok-123")
    {
        var user = new User("ext-1", AuthProvider.Google, "u@test.com", "User", null);
        user.UpdatePushToken(pushToken);
        db.Users.Add(user);
        var notification = new Notification(user.Id, "T", "Title", "Body",
            channel, idempotencyKey: "k1");
        db.Notifications.Add(notification);
        db.SaveChanges();
        return (user, notification);
    }

    [Fact]
    public async Task ExecuteAsync_SuccessfulPush_MarksNotificationSent()
    {
        using var db = TestDbContextFactory.Create();
        var (_, notif) = Seed(db);

        var push = Substitute.For<IPushNotificationService>();
        push.SendAsync(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<string>(),
                Arg.Any<Dictionary<string, string>>(), Arg.Any<CancellationToken>())
            .Returns(new PushSendResult(true, false));

        await MakeJob(db, push).ExecuteAsync();

        Assert.Equal(NotificationStatus.Sent, db.Notifications.Single().Status);
    }

    [Fact]
    public async Task ExecuteAsync_FailedPush_MarksNotificationFailed()
    {
        using var db = TestDbContextFactory.Create();
        var (_, notif) = Seed(db);

        var push = Substitute.For<IPushNotificationService>();
        push.SendAsync(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<string>(),
                Arg.Any<Dictionary<string, string>>(), Arg.Any<CancellationToken>())
            .Returns(new PushSendResult(false, false));

        await MakeJob(db, push).ExecuteAsync();

        Assert.Equal(NotificationStatus.Failed, db.Notifications.Single().Status);
    }

    [Fact]
    public async Task ExecuteAsync_TokenUnregistered_ClearsPushTokenAndMarksFailed()
    {
        using var db = TestDbContextFactory.Create();
        var (user, _) = Seed(db);

        var push = Substitute.For<IPushNotificationService>();
        push.SendAsync(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<string>(),
                Arg.Any<Dictionary<string, string>>(), Arg.Any<CancellationToken>())
            .Returns(new PushSendResult(false, true));

        await MakeJob(db, push).ExecuteAsync();

        Assert.Equal(NotificationStatus.Failed, db.Notifications.Single().Status);
        Assert.Null(db.Users.Single().PushToken);
    }

    [Fact]
    public async Task ExecuteAsync_NoPushToken_MarksNotificationFailed()
    {
        using var db = TestDbContextFactory.Create();
        var user = new User("ext-1", AuthProvider.Google, "u@test.com", "User", null);
        // no push token set
        db.Users.Add(user);
        db.Notifications.Add(new Notification(user.Id, "T", "Title", "Body",
            NotificationChannel.Push, "k1"));
        db.SaveChanges();

        await MakeJob(db).ExecuteAsync();

        Assert.Equal(NotificationStatus.Failed, db.Notifications.Single().Status);
    }

    [Fact]
    public async Task ExecuteAsync_SkipsAlreadySentNotifications()
    {
        using var db = TestDbContextFactory.Create();
        var (_, notif) = Seed(db);
        notif.MarkSent();
        db.SaveChanges();

        var push = Substitute.For<IPushNotificationService>();

        await MakeJob(db, push).ExecuteAsync();

        // push should never be called
        await push.DidNotReceive().SendAsync(
            Arg.Any<string>(), Arg.Any<string>(), Arg.Any<string>(),
            Arg.Any<Dictionary<string, string>>(), Arg.Any<CancellationToken>());
    }
}
