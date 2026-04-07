import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import {
  useGetEventQuery,
  useGetTracksQuery,
  useCreateEventMutation,
  useUpdateEventMutation,
  usePublishEventMutation,
  useCreateTrackMutation,
  useUpdateTrackMutation,
  useDeleteTrackMutation,
} from '../store/api/eventsApi';

// ── Constants ─────────────────────────────────────────────────

const COMMON_TIMEZONES = [
  'Europe/Madrid', 'Europe/London', 'Europe/Paris', 'Europe/Berlin',
  'Europe/Lisbon', 'Europe/Amsterdam', 'Europe/Rome', 'Europe/Zurich',
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/Sao_Paulo', 'America/Mexico_City',
  'Asia/Tokyo', 'Asia/Seoul', 'Asia/Shanghai', 'Asia/Kolkata', 'Asia/Dubai',
  'Australia/Sydney', 'Pacific/Auckland', 'UTC',
];

// ── Helpers ──────────────────────────────────────────────────

function localDateFromISO(iso: string, tz: string) {
  const d = new Date(iso);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(d);
  const get = (t: string) => parts.find(p => p.type === t)?.value ?? '';
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    time: `${get('hour')}:${get('minute')}`,
  };
}

function toISOWithOffset(date: string, time: string, tz: string): string {
  const localStr  = `${date}T${time}:00`;
  const tempDate  = new Date(`${localStr}Z`);
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  });
  const tzParts   = formatter.formatToParts(tempDate);
  const get       = (t: string) => tzParts.find(p => p.type === t)?.value ?? '0';
  const tzDateStr = `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}:${get('second')}Z`;
  const diff      = tempDate.getTime() - new Date(tzDateStr).getTime();
  const actual    = new Date(new Date(localStr + 'Z').getTime() + diff);
  return actual.toISOString().replace('.000Z', 'Z');
}

// ── Form defaults ─────────────────────────────────────────────

const emptyForm = () => ({
  title:            '',
  description:      '',
  eventType:        'padel',
  location:         '',
  locationUrl:      '',
  date:             '',
  time:             '',
  durationMinutes:  120,
  timezone:         Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  trackCount:       2,
  capacityPerTrack: 4,
});

type FormState = ReturnType<typeof emptyForm>;

// ── Shared input classes ──────────────────────────────────────

const inputCls =
  'w-full bg-surface-container-low border-none rounded-lg p-4 ' +
  'focus:ring-2 focus:ring-secondary/20 transition-all font-semibold text-on-surface ' +
  'placeholder:text-on-surface-variant/50';

const inlineNameCls =
  'bg-transparent border-none p-0 focus:ring-0 w-full font-bold text-primary text-lg ' +
  'placeholder:text-on-surface-variant/40';

const inlineCapCls =
  'bg-transparent border-none p-0 focus:ring-0 w-20 font-bold text-secondary text-lg text-right tabular-nums';

// ── Main page ─────────────────────────────────────────────────

export function EventCreatePage() {
  const { groupId = '', eventId } = useParams<{ groupId: string; eventId?: string }>();
  const navigate  = useNavigate();
  const isEditing = !!eventId;

  // ── API ───────────────────────────────────────────────────

  const { data: existingEvent, isLoading: loadingEvent } = useGetEventQuery(
    { groupId, id: eventId! },
    { skip: !isEditing },
  );
  const { data: tracks = [], isLoading: loadingTracks } = useGetTracksQuery(
    { groupId, eventId: eventId! },
    { skip: !isEditing },
  );

  const [createEvent,  { isLoading: creating, error: createError }] = useCreateEventMutation();
  const [updateEvent,  { isLoading: updating, error: updateError }] = useUpdateEventMutation();
  const [publishEvent, { isLoading: publishing }]                   = usePublishEventMutation();
  const [createTrack, { isLoading: addingTrack  }]                 = useCreateTrackMutation();
  const [updateTrack]                                               = useUpdateTrackMutation();
  const [deleteTrack, { isLoading: deletingTrack }]                = useDeleteTrackMutation();

  // ── Form state ────────────────────────────────────────────

  const [form, setForm]           = useState<FormState>(emptyForm());
  const [formError, setFormError] = useState<string | null>(null);
  // Edit mode: track name changes (trackId → name)
  const [trackEdits, setTrackEdits] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!existingEvent) return;
    const { date, time } = localDateFromISO(existingEvent.scheduledAt, existingEvent.timezone);
    setForm({
      title:            existingEvent.title,
      description:      existingEvent.description ?? '',
      eventType:        existingEvent.eventType,
      location:         existingEvent.location ?? '',
      locationUrl:      existingEvent.locationUrl ?? '',
      date,
      time,
      durationMinutes:  existingEvent.durationMinutes,
      timezone:         existingEvent.timezone,
      trackCount:       existingEvent.trackCount,
      capacityPerTrack: existingEvent.capacityPerTrack,
    });
  }, [existingEvent]);

  useEffect(() => {
    if (!tracks.length) return;
    setTrackEdits(Object.fromEntries(tracks.map(t => [t.id, t.name])));
  }, [tracks]);

  function set<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm(f => ({ ...f, [key]: val }));
    setFormError(null);
  }

  // ── Validation ────────────────────────────────────────────

  function validate(): string | null {
    if (!form.title.trim())  return 'Title is required.';
    if (!form.date)          return 'Date is required.';
    if (!form.time)          return 'Time is required.';
    if (!form.timezone)      return 'Timezone is required.';
    if (form.durationMinutes < 15 || form.durationMinutes > 480)
      return 'Duration must be 15–480 minutes.';
    if (!isEditing) {
      if (form.trackCount < 1 || form.trackCount > 20)       return 'Track count must be 1–20.';
      if (form.capacityPerTrack < 1 || form.capacityPerTrack > 50) return 'Capacity per track must be 1–50.';
    }
    if (form.locationUrl && !/^https?:\/\//.test(form.locationUrl))
      return 'Location URL must start with http:// or https://';
    return null;
  }

  // ── Submit ────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent, status?: 'draft' | 'published') {
    e.preventDefault();
    const err = validate();
    if (err) { setFormError(err); return; }

    const scheduledAt = toISOWithOffset(form.date, form.time, form.timezone);
    const payload = {
      title:            form.title.trim(),
      description:      form.description.trim() || undefined,
      eventType:        form.eventType,
      location:         form.location.trim() || undefined,
      locationUrl:      form.locationUrl.trim() || undefined,
      timezone:         form.timezone,
      scheduledAt,
      durationMinutes:  form.durationMinutes,
      ...(isEditing ? {} : { trackCount: form.trackCount, capacityPerTrack: form.capacityPerTrack }),
    };

    try {
      if (isEditing) {
        // Save track name edits first
        const sorted = [...tracks].sort((a, b) => a.sortOrder - b.sortOrder);
        await Promise.all(
          sorted
            .filter(t => trackEdits[t.id] && trackEdits[t.id] !== t.name)
            .map(t => updateTrack({ groupId, eventId: eventId!, trackId: t.id, name: trackEdits[t.id], sortOrder: t.sortOrder }).unwrap()),
        );
        await updateEvent({ groupId, id: eventId!, ...payload }).unwrap();
        navigate(`/groups/${groupId}/events/${eventId}`);
      } else {
        const created = await createEvent({ groupId, ...payload, trackCount: form.trackCount, capacityPerTrack: form.capacityPerTrack }).unwrap();
        if (status === 'published') {
          await publishEvent({ groupId, eventId: created.id, id: created.id  }).unwrap();
        }
        navigate(`/groups/${groupId}/events/${created.id}`);
      }
    } catch { /* errors surface via createError/updateError */ }
  }

  async function handleSaveAsDraft(e: React.MouseEvent<HTMLButtonElement>) {
    await handleSubmit(e as unknown as React.FormEvent, 'draft');
  }

  async function handlePublish(e: React.MouseEvent<HTMLButtonElement>) {
    await handleSubmit(e as unknown as React.FormEvent, 'published');
  }

  // ── Track operations (edit mode) ──────────────────────────

  async function handleAddTrack() {
    if (!eventId) return;
    const nextOrder = tracks.length > 0 ? Math.max(...tracks.map(t => t.sortOrder)) + 1 : 0;
    await createTrack({
      groupId, eventId,
      name: `Track ${tracks.length + 1}`,
      capacity: existingEvent?.capacityPerTrack ?? 4,
      sortOrder: nextOrder,
    });
  }

  async function handleDeleteTrack(trackId: string) {
    if (!eventId) return;
    await deleteTrack({ groupId, eventId, trackId });
  }

  // ── Busy / errors ─────────────────────────────────────────

  const isBusy     = creating || updating || publishing;
  const apiError   = (createError || updateError) as { data?: { message?: string } } | undefined;
  const apiMessage = apiError?.data?.message;

  // ── Virtual tracks (create mode) ─────────────────────────

  const virtualTracks = Array.from({ length: form.trackCount }, (_, i) => ({
    id:       `v${i}`,
    name:     `Track ${i + 1}`,
    capacity: form.capacityPerTrack,
  }));

  // ── Capacity summary ──────────────────────────────────────

  const totalCapacity = isEditing
    ? tracks.reduce((s, t) => s + t.capacity, 0)
    : form.trackCount * form.capacityPerTrack;
  const capacityItems = isEditing
    ? [...tracks].sort((a, b) => a.sortOrder - b.sortOrder).map(t => ({ name: trackEdits[t.id] ?? t.name, capacity: t.capacity }))
    : virtualTracks.map(t => ({ name: t.name, capacity: t.capacity }));

  // ── Loading ───────────────────────────────────────────────

  if (isEditing && loadingEvent) {
    return (
      <div className="max-w-7xl mx-auto px-8 pt-8 pb-20 animate-pulse space-y-6">
        <div className="h-4 w-40 bg-surface-container rounded" />
        <div className="h-12 w-1/2 bg-surface-container rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
          <div className="lg:col-span-8 space-y-6">
            <div className="h-64 bg-surface-container-lowest rounded-xl" />
            <div className="h-40 bg-surface-container-lowest rounded-xl" />
          </div>
          <div className="lg:col-span-4 space-y-6">
            <div className="h-40 bg-surface-container-lowest rounded-xl" />
            <div className="h-48 bg-surface-container-lowest rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────

  return (
    <main className="pt-8 pb-20 px-4 md:px-8 max-w-7xl mx-auto">

      {/* ── Header ── */}
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-secondary font-semibold text-sm tracking-wide uppercase">
            <span className="material-symbols-outlined text-sm">edit</span>
            <span>{isEditing ? 'Admin View' : 'Create Event'}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-primary leading-tight font-headline">
            {isEditing ? 'Edit Group Event' : 'New Group Event'}
          </h1>
          <p className="text-on-surface-variant max-w-xl text-sm leading-relaxed">
            {isEditing
              ? 'Update the details of your upcoming event. Track names can be renamed inline below.'
              : 'Set up the details of your event. Tracks will be created automatically after publishing.'
            }
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <Link
            to={isEditing ? `/groups/${groupId}/events/${eventId}` : `/groups/${groupId}`}
            className="px-6 py-3 rounded-xl bg-surface-container-highest text-primary font-bold transition-all hover:bg-surface-container-high active:scale-95"
          >
            Cancel
          </Link>
          {isEditing ? (
            <button
              form="event-form"
              type="submit"
              disabled={isBusy}
              className="px-8 py-3 rounded-xl bg-primary text-on-primary font-bold shadow-lg shadow-primary/20 transition-all hover:bg-primary-container active:scale-95 disabled:opacity-50 flex items-center gap-2"
            >
              {isBusy
                ? <span className="material-symbols-outlined text-base animate-spin">refresh</span>
                : <span className="material-symbols-outlined text-base">save</span>
              }
              {isBusy ? 'Saving…' : 'Save Changes'}
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={handleSaveAsDraft}
                disabled={isBusy}
                className="px-6 py-3 rounded-xl bg-surface-container-high text-on-surface font-bold transition-all hover:bg-surface-container-highest active:scale-95 disabled:opacity-50 flex items-center gap-2"
              >
                {isBusy
                  ? <span className="material-symbols-outlined text-base animate-spin">refresh</span>
                  : <span className="material-symbols-outlined text-base">draft</span>
                }
                Save as Draft
              </button>
              <button
                type="button"
                onClick={handlePublish}
                disabled={isBusy}
                className="px-8 py-3 rounded-xl bg-primary text-on-primary font-bold shadow-lg shadow-primary/20 transition-all hover:bg-primary-container active:scale-95 disabled:opacity-50 flex items-center gap-2"
              >
                {isBusy
                  ? <span className="material-symbols-outlined text-base animate-spin">refresh</span>
                  : <span className="material-symbols-outlined text-base">publish</span>
                }
                Publish
              </button>
            </>
          )}
        </div>
      </header>

      {/* ── Error banner ── */}
      {(formError || apiMessage) && (
        <div className="mb-6 text-sm text-on-error-container font-semibold bg-error-container px-5 py-3 rounded-xl">
          {formError ?? apiMessage}
        </div>
      )}

      <form id="event-form" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* ── Left: 8 cols ── */}
          <div className="lg:col-span-8 space-y-8">

            {/* General Information */}
            <section className="p-8 rounded-xl bg-surface-container-lowest shadow-soft">
              <h2 className="text-xl font-bold text-primary mb-6 flex items-center gap-3 font-headline">
                <span className="material-symbols-outlined text-secondary">info</span>
                General Information
              </h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-on-surface-variant mb-2 ml-1">
                    Event Name <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={e => set('title', e.target.value)}
                    placeholder="e.g. Padel Tuesday Night"
                    maxLength={255}
                    className={inputCls}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-on-surface-variant mb-2 ml-1">
                      Date <span className="text-error">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={form.date}
                        onChange={e => set('date', e.target.value)}
                        className={inputCls}
                      />
                      <span className="material-symbols-outlined absolute right-4 top-4 text-outline pointer-events-none">
                        calendar_today
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-on-surface-variant mb-2 ml-1">
                      Start Time <span className="text-error">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="time"
                        value={form.time}
                        onChange={e => set('time', e.target.value)}
                        className={inputCls}
                      />
                      <span className="material-symbols-outlined absolute right-4 top-4 text-outline pointer-events-none">
                        schedule
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-on-surface-variant mb-2 ml-1">
                      Duration (minutes) <span className="text-error">*</span>
                    </label>
                    <input
                      type="number"
                      min={15}
                      max={480}
                      value={form.durationMinutes}
                      onChange={e => set('durationMinutes', Math.max(15, Math.min(480, +e.target.value)))}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-on-surface-variant mb-2 ml-1">
                      Timezone <span className="text-error">*</span>
                    </label>
                    <select
                      value={form.timezone}
                      onChange={e => set('timezone', e.target.value)}
                      className={inputCls}
                    >
                      {COMMON_TIMEZONES.map(tz => (
                        <option key={tz} value={tz}>{tz.replace(/_/g, ' ')}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-on-surface-variant mb-2 ml-1">
                    Description
                  </label>
                  <textarea
                    value={form.description}
                    onChange={e => set('description', e.target.value)}
                    placeholder="Describe the event, rules, what to bring…"
                    rows={4}
                    maxLength={2000}
                    className={inputCls + ' resize-none'}
                  />
                </div>
              </div>
            </section>

            {/* Track management */}
            <section className="p-8 rounded-xl bg-surface-container-lowest shadow-soft">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-primary flex items-center gap-3 font-headline">
                  <span className="material-symbols-outlined text-secondary">lan</span>
                  {isEditing ? 'Track Management' : 'Tracks Configuration'}
                </h2>
                {isEditing ? (
                  <button
                    type="button"
                    onClick={handleAddTrack}
                    disabled={addingTrack}
                    className="text-secondary font-bold text-sm flex items-center gap-1 hover:underline disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-base">add_circle</span>
                    Add Track
                  </button>
                ) : null}
              </div>

              {isEditing ? (
                /* ── Edit mode: real tracks ── */
                loadingTracks ? (
                  <div className="space-y-3">
                    {[...Array(2)].map((_, i) => (
                      <div key={i} className="h-16 bg-surface-container rounded-xl animate-pulse" />
                    ))}
                  </div>
                ) : tracks.length === 0 ? (
                  <p className="text-on-surface-variant text-sm text-center py-4">
                    No tracks yet. Use "Add Track" to create one.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {[...tracks]
                      .sort((a, b) => a.sortOrder - b.sortOrder)
                      .map(track => (
                        <div
                          key={track.id}
                          className="flex flex-col md:flex-row md:items-center gap-4 p-5 rounded-xl bg-surface-container-low group hover:bg-surface-container transition-all"
                        >
                          <div className="flex-grow">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1">
                              Track Name
                            </label>
                            <input
                              type="text"
                              value={trackEdits[track.id] ?? track.name}
                              onChange={e => setTrackEdits(te => ({ ...te, [track.id]: e.target.value }))}
                              maxLength={100}
                              className={inlineNameCls}
                              placeholder="Track name…"
                            />
                          </div>
                          <div className="w-full md:w-32">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1">
                              Capacity
                            </label>
                            <p className={inlineCapCls}>{track.capacity}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteTrack(track.id)}
                            disabled={deletingTrack}
                            className="p-2 rounded-lg text-outline-variant hover:text-error transition-colors disabled:opacity-50 flex-shrink-0"
                          >
                            <span className="material-symbols-outlined">delete</span>
                          </button>
                        </div>
                      ))}
                  </div>
                )
              ) : (
                /* ── Create mode: virtual tracks + numeric inputs ── */
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-on-surface-variant mb-2 ml-1">
                        Number of Tracks <span className="text-error">*</span>
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={20}
                        value={form.trackCount}
                        onChange={e => set('trackCount', Math.max(1, Math.min(20, +e.target.value)))}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-on-surface-variant mb-2 ml-1">
                        Spots per Track <span className="text-error">*</span>
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={form.capacityPerTrack}
                        onChange={e => set('capacityPerTrack', Math.max(1, Math.min(50, +e.target.value)))}
                        className={inputCls}
                      />
                    </div>
                  </div>
                  {/* Preview */}
                  <div className="space-y-3">
                    {virtualTracks.map(t => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between p-4 rounded-xl bg-surface-container-low"
                      >
                        <span className="font-bold text-primary">{t.name}</span>
                        <span className="text-secondary font-bold text-sm">{t.capacity} spots</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* ── Right: 4 cols ── */}
          <div className="lg:col-span-4 space-y-8">

            {/* Venue details */}
            <section className="p-6 rounded-xl bg-surface-container-lowest shadow-soft">
              <h2 className="text-xl font-bold text-primary mb-6 flex items-center gap-3 font-headline">
                <span className="material-symbols-outlined text-secondary">location_on</span>
                Venue Details
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-on-surface-variant mb-2">
                    Location Name
                  </label>
                  <input
                    type="text"
                    value={form.location}
                    onChange={e => set('location', e.target.value)}
                    placeholder="Club Padel Norte, Court 3"
                    maxLength={500}
                    className={inputCls.replace('p-4', 'p-3')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-on-surface-variant mb-2">
                    Maps Link
                  </label>
                  <input
                    type="url"
                    value={form.locationUrl}
                    onChange={e => set('locationUrl', e.target.value)}
                    placeholder="https://maps.google.com/…"
                    className={inputCls.replace('p-4', 'p-3')}
                  />
                </div>
              </div>
            </section>

            {/* Capacity overview — dark card */}
            <section className="p-6 rounded-xl bg-primary text-on-primary shadow-xl overflow-hidden relative">
              <div className="absolute -right-4 -top-4 w-32 h-32 bg-primary-container rounded-full blur-3xl opacity-50" />
              <h2 className="text-lg font-bold mb-6 relative z-10 opacity-80 font-headline">
                Capacity Overview
              </h2>
              <div className="space-y-6 relative z-10">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">
                    Total Event Capacity
                  </span>
                  <div className="flex items-end gap-2 mt-1">
                    <span className="text-5xl font-black tracking-tighter">{totalCapacity}</span>
                    <span className="text-lg font-bold text-primary-fixed mb-1">Spots</span>
                  </div>
                </div>
                {capacityItems.length > 0 && (
                  <div className="pt-6 border-t border-primary-container space-y-3">
                    {capacityItems.map((item, i) => (
                      <div key={i} className="flex justify-between items-center text-sm">
                        <span className="opacity-70 truncate mr-2">{item.name}</span>
                        <span className="font-bold flex-shrink-0">{item.capacity} Spots</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="bg-secondary-container/20 p-4 rounded-lg flex items-center gap-3">
                  <span className="material-symbols-outlined text-tertiary-fixed-dim flex-shrink-0">verified</span>
                  <p className="text-xs font-medium leading-relaxed">
                    {isEditing
                      ? 'Total is calculated from individual track allocations.'
                      : 'Tracks will be auto-created from tracks × capacity.'
                    }
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </form>
    </main>
  );
}
