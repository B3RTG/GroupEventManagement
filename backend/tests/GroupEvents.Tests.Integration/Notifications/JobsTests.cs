using GroupEvents.Application.Common.Interfaces;
using GroupEvents.Domain.Entities;
using GroupEvents.Domain.Enums;
using GroupEvents.Infrastructure.Jobs;
using GroupEvents.Infrastructure.Notifications;
using GroupEvents.Infrastructure.Persistence;
using GroupEvents.Tests.Integration.Helpers;
using Microsoft.Extensions.Logging.Abstractions;
using NSubstitute;

namespace GroupEvents.Tests.Integration.Notifications;

public class JobsTests
{
    // ── Helpers ────────────────────────────────────────────────────────────────

    private static (User owner, User member, Group group, Event ev) Seed(
        AppDbContext db, int trackCount = 2, int capacityPerTrack = 10)
    {
        var owner  = new User("ext-1", AuthProvider.Google, "owner@test.com", "Owner", null);
        var member = new User("ext-2", AuthProvider.Google, "member@test.com", "Member", null);
        db.Users.AddRange(owner, member);
        var group = new Group("Group", "g", owner.Id);
        db.Groups.Add(group);
        db.GroupMemberships.Add(new GroupMembership(group.Id, owner.Id,  MemberRole.Owner));
        db.GroupMemberships.Add(new GroupMembership(group.Id, member.Id, MemberRole.Member));
        var ev = new Event(group.Id, owner.Id, "Race", "race", null, "UTC",
            DateTime.UtcNow.AddDays(7), 60, trackCount, capacityPerTrack);
        ev.Publish();
        db.Events.Add(ev);
        db.SaveChanges();
        return (owner, member, group, ev);
    }

    // ── CompletedEventsJob ─────────────────────────────────────────────────────

    [Fact]
    public async Task CompletedEventsJob_MarksExpiredPublishedEvents()
    {
        using var db = TestDbContextFactory.Create();
        var owner = new User("ext-1", AuthProvider.Google, "o@test.com", "Owner", null);
        db.Users.Add(owner);
        var group = new Group("G", "g", owner.Id);
        db.Groups.Add(group);
        // Event that ended 1 hour ago
        var past = new Event(group.Id, owner.Id, "Past", "race", null, "UTC",
            DateTime.UtcNow.AddHours(-2), 60, 1, 1);
        past.Publish();
        // Event in the future — should NOT be completed
        var future = new Event(group.Id, owner.Id, "Future", "race", null, "UTC",
            DateTime.UtcNow.AddDays(1), 60, 1, 1);
        future.Publish();
        db.Events.AddRange(past, future);
        db.SaveChanges();

        var job = new CompletedEventsJob(db, NullLogger<CompletedEventsJob>.Instance);
        await job.ExecuteAsync();

        Assert.Equal(EventStatus.Completed, db.Events.First(e => e.Id == past.Id).Status);
        Assert.Equal(EventStatus.Published,  db.Events.First(e => e.Id == future.Id).Status);
    }

    [Fact]
    public async Task CompletedEventsJob_DoesNotTouchNonPublishedEvents()
    {
        using var db = TestDbContextFactory.Create();
        var owner = new User("ext-1", AuthProvider.Google, "o@test.com", "Owner", null);
        db.Users.Add(owner);
        var group = new Group("G", "g", owner.Id);
        db.Groups.Add(group);
        var draft = new Event(group.Id, owner.Id, "Draft", "race", null, "UTC",
            DateTime.UtcNow.AddHours(-2), 60, 1, 1);
        // Status is Draft — should remain Draft
        db.Events.Add(draft);
        db.SaveChanges();

        var job = new CompletedEventsJob(db, NullLogger<CompletedEventsJob>.Instance);
        await job.ExecuteAsync();

        Assert.Equal(EventStatus.Draft, db.Events.Single().Status);
    }

    // ── PushTokenCleanupJob ────────────────────────────────────────────────────

    [Fact]
    public async Task PushTokenCleanupJob_ClearsToken_WhenAllPushNotificationsFailed()
    {
        using var db = TestDbContextFactory.Create();
        var user = new User("ext-1", AuthProvider.Google, "u@test.com", "User", null);
        user.UpdatePushToken("stale-token");
        db.Users.Add(user);
        db.Notifications.Add(new Notification(user.Id, "T", "Title", "Body",
            NotificationChannel.Push, "k1"));
        db.SaveChanges();
        db.Notifications.Single().MarkFailed();
        db.SaveChanges();

        var job = new PushTokenCleanupJob(db, NullLogger<PushTokenCleanupJob>.Instance);
        await job.ExecuteAsync();

        Assert.Null(db.Users.Single().PushToken);
    }

    [Fact]
    public async Task PushTokenCleanupJob_KeepsToken_WhenSomePushSucceeded()
    {
        using var db = TestDbContextFactory.Create();
        var user = new User("ext-1", AuthProvider.Google, "u@test.com", "User", null);
        user.UpdatePushToken("valid-token");
        db.Users.Add(user);
        var ok   = new Notification(user.Id, "T", "T", "B", NotificationChannel.Push, "k1");
        var fail = new Notification(user.Id, "T", "T", "B", NotificationChannel.Push, "k2");
        db.Notifications.AddRange(ok, fail);
        db.SaveChanges();
        ok.MarkSent();
        fail.MarkFailed();
        db.SaveChanges();

        var job = new PushTokenCleanupJob(db, NullLogger<PushTokenCleanupJob>.Instance);
        await job.ExecuteAsync();

        Assert.Equal("valid-token", db.Users.Single().PushToken);
    }

    // ── EventReminderJob ───────────────────────────────────────────────────────

    [Fact]
    public async Task EventReminderJob_EnqueuesNotifications_ForUpcomingEvents()
    {
        using var db = TestDbContextFactory.Create();
        var (_, member, _, ev) = Seed(db);
        db.EventRegistrations.Add(new EventRegistration(ev.Id, member.Id));
        db.SaveChanges();

        // Reschedule the event to be within the next 24h
        // (the seeded event is 7 days out — override for this test using reflection bypass
        // or just seed a new one within the window)
        var user2 = new User("ext-3", AuthProvider.Google, "u2@test.com", "U2", null);
        db.Users.Add(user2);
        var group2 = new Group("G2", "g2", user2.Id);
        db.Groups.Add(group2);
        var upcoming = new Event(group2.Id, user2.Id, "Upcoming", "race", null, "UTC",
            DateTime.UtcNow.AddHours(3), 60, 1, 10);
        upcoming.Publish();
        db.Events.Add(upcoming);
        db.EventRegistrations.Add(new EventRegistration(upcoming.Id, user2.Id));
        db.SaveChanges();

        var notifSvc = new NotificationService(db);
        var job = new EventReminderJob(db, notifSvc, NullLogger<EventReminderJob>.Instance);
        await job.ExecuteAsync();

        // At least one reminder created for the upcoming event
        Assert.True(db.Notifications.Any(n =>
            n.Type == "EventReminder" && n.UserId == user2.Id));
    }

    [Fact]
    public async Task EventReminderJob_IdempotencyKey_PreventsDoubleReminders()
    {
        using var db = TestDbContextFactory.Create();
        var user = new User("ext-1", AuthProvider.Google, "u@test.com", "U", null);
        db.Users.Add(user);
        var group = new Group("G", "g", user.Id);
        db.Groups.Add(group);
        var upcoming = new Event(group.Id, user.Id, "Event", "race", null, "UTC",
            DateTime.UtcNow.AddHours(2), 60, 1, 10);
        upcoming.Publish();
        db.Events.Add(upcoming);
        db.EventRegistrations.Add(new EventRegistration(upcoming.Id, user.Id));
        db.SaveChanges();

        var notifSvc = new NotificationService(db);
        var job = new EventReminderJob(db, notifSvc, NullLogger<EventReminderJob>.Instance);

        await job.ExecuteAsync();
        await job.ExecuteAsync(); // second run — must not duplicate

        Assert.Single(db.Notifications.Where(n => n.Type == "EventReminder").ToList());
    }
}
