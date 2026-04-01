using GroupEvents.Domain.Common;

namespace GroupEvents.Domain.Entities;

public class Track : BaseEntity
{
    public Guid EventId { get; private set; }
    public string Name { get; private set; } = null!;
    public int Capacity { get; private set; }
    public int SortOrder { get; private set; }

    // Navigation
    public Event Event { get; private set; } = null!;

    private Track() { } // EF Core

    public Track(Guid eventId, string name, int capacity, int sortOrder)
    {
        EventId = eventId;
        Name = name;
        Capacity = capacity;
        SortOrder = sortOrder;
    }

    public void Update(string name, int sortOrder)
    {
        Name = name;
        SortOrder = sortOrder;
    }
}
