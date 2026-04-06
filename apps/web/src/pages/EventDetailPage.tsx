import { useParams } from 'react-router';

/** Sprint 7.4 + 7.5 — Detalle de evento + inscripción */
export function EventDetailPage() {
  const { groupId, eventId } = useParams<{ groupId: string; eventId: string }>();
  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-black tracking-tight font-headline text-on-surface mb-6">
        Evento
      </h1>
      <div className="bg-surface-container-lowest rounded-2xl p-8 shadow-soft text-center">
        <p className="text-on-surface-variant text-sm">
          Sprint 7.4 — groupId: <code className="font-mono text-xs">{groupId}</code> / eventId:{' '}
          <code className="font-mono text-xs">{eventId}</code>
        </p>
      </div>
    </div>
  );
}
