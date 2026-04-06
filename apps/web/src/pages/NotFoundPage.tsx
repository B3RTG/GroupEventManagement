import { Link } from 'react-router';

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center space-y-4">
        <p className="text-6xl font-black font-headline text-on-surface opacity-20">404</p>
        <p className="text-on-surface-variant">Página no encontrada</p>
        <Link
          to="/dashboard"
          className="inline-block mt-4 px-5 py-2.5 bg-primary text-on-primary text-sm font-bold rounded-xl hover:opacity-90 transition-opacity"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
