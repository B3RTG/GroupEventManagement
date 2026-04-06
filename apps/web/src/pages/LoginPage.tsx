import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { useAppleAuth }  from '../hooks/useAppleAuth';
import { useAppSelector } from '../store/hooks';
import { selectIsLoggedIn } from '../store/authSlice';

export function LoginPage() {
  const isLoggedIn = useAppSelector(selectIsLoggedIn);
  const navigate   = useNavigate();

  const google = useGoogleAuth();
  const apple  = useAppleAuth();

  // Redirect once authenticated
  useEffect(() => {
    if (isLoggedIn) navigate('/', { replace: true });
  }, [isLoggedIn, navigate]);

  const error = google.error ?? apple.error;

  return (
    <>
      {/* Main */}
      <main className="flex-grow flex items-center justify-center px-4 py-12 relative overflow-hidden">
        {/* Background decorative blobs */}
        <div
          className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-10 blur-3xl pointer-events-none"
          style={{ background: 'linear-gradient(135deg, #00101e 0%, #122636 100%)' }}
        />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-secondary-container rounded-full opacity-5 blur-3xl pointer-events-none" />

        {/* Card */}
        <div className="w-full max-w-5xl grid md:grid-cols-2 gap-0 overflow-hidden rounded-xl shadow-sm bg-surface-container-lowest">

          {/* ── Left: hero panel ──────────────────────────────── */}
          <div
            className="hidden md:flex flex-col justify-between p-12 text-on-primary"
            style={{ background: 'linear-gradient(135deg, #00101e 0%, #122636 100%)' }}
          >
            {/* Top: brand + headline */}
            <div>
              <h1 className="font-headline font-black text-3xl tracking-tighter mb-8">
                GEM
              </h1>
              <div className="space-y-6">
                <h2 className="font-headline font-extrabold text-4xl leading-tight tracking-tight">
                  The Precision <br />
                  Curator for Groups.
                </h2>
                <p className="text-on-primary-container text-lg max-w-md">
                  Seamlessly coordinate high-performance athletic events with
                  professional-grade scheduling and management tools.
                </p>
              </div>
            </div>

            {/* Bottom: feature bullets */}
            <div className="space-y-4">
              <div className="flex items-center gap-4 bg-primary-container/30 p-4 rounded-lg backdrop-blur-sm">
                <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-white text-xl">lock</span>
                </div>
                <div>
                  <p className="font-headline font-bold text-sm">Secure Logistics</p>
                  <p className="text-xs text-on-primary-container">Enterprise-grade data encryption.</p>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-primary-container/30 p-4 rounded-lg backdrop-blur-sm">
                <div className="w-10 h-10 rounded-full bg-tertiary-fixed-dim flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-on-tertiary-fixed text-xl">bolt</span>
                </div>
                <div>
                  <p className="font-headline font-bold text-sm">Instant Access</p>
                  <p className="text-xs text-on-primary-container">Join events with a single click or scan.</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Right: login form ─────────────────────────────── */}
          <div className="p-8 md:p-16 flex flex-col justify-center bg-surface-container-lowest">

            {/* Mobile-only brand */}
            <div className="md:hidden mb-6 text-center">
              <span className="font-headline font-black text-2xl tracking-tighter text-primary">GEM</span>
            </div>

            {/* Heading */}
            <div className="mb-10 text-center md:text-left">
              <h3 className="font-headline font-extrabold text-2xl text-primary mb-2">Welcome Back</h3>
              <p className="text-on-surface-variant">
                Sign in to manage your athletic community events.
              </p>
            </div>

            {/* Error banner */}
            {error && (
              <div className="mb-4 px-4 py-3 rounded-lg bg-error-container text-on-error-container text-sm">
                {error}
              </div>
            )}

            {/* OAuth buttons */}
            <div className="space-y-4">
              {/* Google — GIS renders its own button into this div */}
              <div ref={google.containerRef} className="w-full" />

              {/* Apple */}
              <button
                onClick={apple.signIn}
                disabled={!apple.isReady || apple.isLoading}
                className="w-full flex items-center justify-center gap-3 py-3.5 px-6 rounded-lg bg-primary hover:bg-primary-container transition-all duration-200 text-on-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontVariationSettings: '"FILL" 1' }}
                >
                  ios
                </span>
                <span className="font-label font-semibold">
                  {apple.isLoading ? 'Signing in…' : 'Continue with Apple'}
                </span>
              </button>
            </div>

            {/* OR divider */}
            <div className="my-8 flex items-center gap-4">
              <div className="flex-grow h-px bg-surface-container-high" />
              <span className="text-xs font-bold uppercase tracking-widest text-outline">or</span>
              <div className="flex-grow h-px bg-surface-container-high" />
            </div>

            {/* Footer copy */}
            <div className="text-center">
              <p className="text-sm text-on-surface-variant">
                Don&apos;t have an account?{' '}
                <span className="text-secondary-container font-bold">
                  Start your group
                </span>
              </p>
              <p className="text-xs text-outline mt-3">
                Registration is handled by your group administrator.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-surface-container w-full py-8">
        <div className="flex flex-col md:flex-row justify-between items-center px-8 max-w-7xl mx-auto space-y-3 md:space-y-0">
          <span className="font-headline font-bold text-on-surface text-sm">
            GEM — Group Event Management
          </span>
          <nav className="flex gap-6">
            {['Privacy Policy', 'Terms of Service', 'Support'].map((label) => (
              <a
                key={label}
                href="#"
                className="text-on-surface-variant text-xs hover:underline opacity-80 hover:opacity-100 transition-opacity"
              >
                {label}
              </a>
            ))}
          </nav>
        </div>
      </footer>
    </>
  );
}
