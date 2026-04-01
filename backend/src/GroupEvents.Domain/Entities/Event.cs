using GroupEvents.Domain.Common;
using GroupEvents.Domain.Enums;

namespace GroupEvents.Domain.Entities;

public class Event : BaseEntity
{
    public Guid GroupId { get; private set; }
    public Guid CreatedBy { get; private set; }
    public string Title { get; private set; } = null!;
    public string EventType { get; private set; } = null!;
    public string? Location { get; private set; }
    public string Timezone { get; private set; } = null!;
    public DateTime ScheduledAt { get; private set; }
    public int DurationMinutes { get; private set; }
    public DateTime? RegistrationOpensAt { get; private set; }
    public DateTime? RegistrationClosesAt { get; private set; }
    public EventStatus Status { get; private set; } = EventStatus.Draft;
    public int TrackCount { get; private set; }
    public int CapacityPerTrack { get; private set; }
    public string? Notes { get; private set; }

    public int TotalCapacity => TrackCount * CapacityPerTrack;

    // Navigation
    public Group Group { get; private set; } = null!;
    public ICollection<Track> Tracks { get; private set; } = new List<Track>();
    public ICollection<EventRegistration> Registrations { get; private set; } = new List<EventRegistration>();
    public ICollection<WaitlistEntry> WaitlistEntries { get; private set; } = new List<WaitlistEntry>();

    private Event() { } // EF Core

    public Event(
        Guid groupId, Guid createdBy, string title, string eventType,
        string? location, string timezone, DateTime scheduledAt, int durationMinutes,
        int trackCount, int capacityPerTrack, string? notes = null,
        DateTime? registrationOpensAt = null, DateTime? registrationClosesAt = null)
    {
        GroupId = groupId;
        CreatedBy = createdBy;
        Title = title;
        EventType = eventType;
        Location = location;
        Timezone = timezone;
        ScheduledAt = scheduledAt;
        DurationMinutes = durationMinutes;
        TrackCount = trackCount;
        CapacityPerTrack = capacityPerTrack;
        Notes = notes;
        RegistrationOpensAt = registrationOpensAt;
        RegistrationClosesAt = registrationClosesAt;
    }

    public void Publish()
    {
        if (Status != EventStatus.Draft)
            throw new InvalidOperationException("Only draft events can be published.");
        Status = EventStatus.Published;
    }

    public void Cancel()
    {
        if (Status == EventStatus.Completed)
            throw new InvalidOperationException("Completed events cannot be cancelled.");
        Status = EventStatus.Cancelled;
    }

    public void Complete()
    {
        if (Status != EventStatus.Published)
            throw new InvalidOperationException("Only published events can be completed.");
        Status = EventStatus.Completed;
    }

    public void Update(
        string title, string? location, DateTime scheduledAt, int durationMinutes,
        string? notes, DateTime? registrationOpensAt, DateTime? registrationClosesAt)
    {
        if (Status != EventStatus.Draft)
            throw new InvalidOperationException("Only draft events can be updated.");
        Title = title;
        Location = location;
        ScheduledAt = scheduledAt;
        DurationMinutes = durationMinutes;
        Notes = notes;
        RegistrationOpensAt = registrationOpensAt;
        RegistrationClosesAt = registrationClosesAt;
    }

    public void UpdateCapacity(int trackCount, int capacityPerTrack, int confirmedCount)
    {
        if (trackCount * capacityPerTrack < confirmedCount)
            throw new InvalidOperationException("Cannot reduce capacity below the number of confirmed registrations.");
        TrackCount = trackCount;
        CapacityPerTrack = capacityPerTrack;
    }
}
