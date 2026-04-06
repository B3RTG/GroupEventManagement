import { useEffect, useRef, useState } from 'react';
import { useLoginWithGoogleMutation } from '../store/api/authApi';

const GIS_SCRIPT_URL = 'https://accounts.google.com/gsi/client';

type Status = 'idle' | 'loading' | 'ready' | 'error';

/**
 * Loads the Google Identity Services (GIS) script and provides a ref to mount
 * the Google-branded sign-in button into. Google's terms require using their
 * branded button — this approach is policy-compliant and gives us the id_token
 * directly in the callback without a redirect.
 */
export function useGoogleAuth() {
  const [status, setStatus]         = useState<Status>('idle');
  const [error, setError]           = useState<string | null>(null);
  const containerRef                = useRef<HTMLDivElement>(null);
  const initializedRef              = useRef(false);
  const [loginWithGoogle, mutation] = useLoginWithGoogleMutation();

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
    if (!clientId) {
      setError('VITE_GOOGLE_CLIENT_ID is not configured.');
      setStatus('error');
      return;
    }

    const init = () => {
      if (initializedRef.current) return;
      initializedRef.current = true;

      window.google!.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          loginWithGoogle({ idToken: response.credential });
        },
        error_callback: () => {
          setError('Google authentication failed.');
        },
        use_fedcm_for_prompt: true,
      });

      if (containerRef.current) {
        window.google!.accounts.id.renderButton(containerRef.current, {
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          // Match the container width so the button fills its parent
          width: containerRef.current.offsetWidth || 320,
        });
      }

      setStatus('ready');
    };

    if (window.google) {
      init();
      return;
    }

    setStatus('loading');

    // Avoid duplicating the script tag on HMR
    if (document.querySelector(`script[src="${GIS_SCRIPT_URL}"]`)) {
      const interval = setInterval(() => {
        if (window.google) { clearInterval(interval); init(); }
      }, 100);
      return () => clearInterval(interval);
    }

    const script = document.createElement('script');
    script.src   = GIS_SCRIPT_URL;
    script.async = true;
    script.defer = true;
    script.onload = init;
    script.onerror = () => {
      setError('Failed to load Google Sign-In.');
      setStatus('error');
    };
    document.head.appendChild(script);
    return;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    /** Attach this ref to the div where the Google button should render */
    containerRef,
    isLoading: status === 'loading' || mutation.isLoading,
    isSuccess: mutation.isSuccess,
    error: error ?? (mutation.isError ? 'Google login failed. Please try again.' : null),
  };
}
