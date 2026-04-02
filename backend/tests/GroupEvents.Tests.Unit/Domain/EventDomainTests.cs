using GroupEvents.Domain.Entities;
using GroupEvents.Domain.Enums;

namespace GroupEvents.Tests.Unit.Domain;

public class EventDomainTests
{
    private static Event CreateDraftEvent() => new(
        groupId: Guid.NewGuid(),
        createdBy: Guid.NewGuid(),
        title: "Test Event",
        eventType: "race",
        location: "Track A",
        timezone: "UTC",
        scheduledAt: DateTime.UtcNow.AddDays(7),
        durationMinutes: 60,
        trackCount: 2,
        capacityPerTrack: 10);

    // --- Publish ---

    [Fact]
    public void Publish_FromDraft_SetsStatusToPublished()
    {
        var ev = CreateDraftEvent();
        ev.Publish();
        Assert.Equal(EventStatus.Published, ev.Status);
    }

    [Fact]
    public void Publish_FromPublished_ThrowsInvalidOperation()
    {
        var ev = CreateDraftEvent();
        ev.Publish();
        Assert.Throws<InvalidOperationException>(() => ev.Publish());
    }

    [Fact]
    public void Publish_FromCancelled_ThrowsInvalidOperation()
    {
        var ev = CreateDraftEvent();
        ev.Publish();
        ev.Cancel();
        Assert.Throws<InvalidOperationException>(() => ev.Publish());
    }

    // --- Cancel ---

    [Fact]
    public void Cancel_FromPublished_SetsStatusToCancelled()
    {
        var ev = CreateDraftEvent();
        ev.Publish();
        ev.Cancel();
        Assert.Equal(EventStatus.Cancelled, ev.Status);
    }

    [Fact]
    public void Cancel_FromDraft_SetsStatusToCancelled()
    {
        var ev = CreateDraftEvent();
        ev.Cancel();
        Assert.Equal(EventStatus.Cancelled, ev.Status);
    }

    [Fact]
    public void Cancel_FromCompleted_ThrowsInvalidOperation()
    {
        var ev = CreateDraftEvent();
        ev.Publish();
        ev.Complete();
        Assert.Throws<InvalidOperationException>(() => ev.Cancel());
    }

    // --- Complete ---

    [Fact]
    public void Complete_FromPublished_SetsStatusToCompleted()
    {
        var ev = CreateDraftEvent();
        ev.Publish();
        ev.Complete();
        Assert.Equal(EventStatus.Completed, ev.Status);
    }

    [Fact]
    public void Complete_FromDraft_ThrowsInvalidOperation()
    {
        var ev = CreateDraftEvent();
        Assert.Throws<InvalidOperationException>(() => ev.Complete());
    }

    [Fact]
    public void Complete_FromCancelled_ThrowsInvalidOperation()
    {
        var ev = CreateDraftEvent();
        ev.Cancel();
        Assert.Throws<InvalidOperationException>(() => ev.Complete());
    }

    // --- UpdateCapacity ---

    [Fact]
    public void UpdateCapacity_AboveConfirmedCount_UpdatesValues()
    {
        var ev = CreateDraftEvent(); // trackCount=2, capacityPerTrack=10
        ev.UpdateCapacity(trackCount: 3, capacityPerTrack: 5, confirmedCount: 10);
        Assert.Equal(3, ev.TrackCount);
        Assert.Equal(5, ev.CapacityPerTrack);
        Assert.Equal(15, ev.TotalCapacity);
    }

    [Fact]
    public void UpdateCapacity_BelowConfirmedCount_ThrowsInvalidOperation()
    {
        var ev = CreateDraftEvent(); // TotalCapacity = 20
        Assert.Throws<InvalidOperationException>(
            () => ev.UpdateCapacity(trackCount: 1, capacityPerTrack: 5, confirmedCount: 10));
    }

    [Fact]
    public void UpdateCapacity_ExactlyAtConfirmedCount_Succeeds()
    {
        var ev = CreateDraftEvent();
        ev.UpdateCapacity(trackCount: 2, capacityPerTrack: 5, confirmedCount: 10);
        Assert.Equal(10, ev.TotalCapacity);
    }

    // --- TotalCapacity ---

    [Fact]
    public void TotalCapacity_IsTrackCountTimesCapacityPerTrack()
    {
        var ev = CreateDraftEvent(); // 2 tracks * 10 capacity
        Assert.Equal(20, ev.TotalCapacity);
    }
}
