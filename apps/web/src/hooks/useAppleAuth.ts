import { useCallback, useEffect, useState } from 'react';
import { useLoginWithAppleMutation } from '../store/api/authApi';

const APPLE_SCRIPT_URL =
  'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';

/**
 * Loads the Apple Sign In JS SDK and provides a `signIn` function that opens
 * Apple's OAuth popup. Returns the id_token directly — no redirect needed.
 */
export function useAppleAuth() {
  const [ready, setReady]           = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [loginWithApple, mutation]  = useLoginWithAppleMutation();

  useEffect(() => {
    const clientId   = import.meta.env.VITE_APPLE_CLIENT_ID as string | undefined;
    const redirectURI = import.meta.env.VITE_APPLE_REDIRECT_URI as string | undefined;

    if (!clientId || !redirectURI) {
      // Apple not configured — silently skip (button will stay hidden)
      return;
    }

    const init = () => {
      window.AppleID!.auth.init({
        clientId,
        scope: 'name email',
        redirectURI,
        usePopup: true,
      });
      setReady(true);
    };

    if (window.AppleID) { init(); return; }

    if (document.querySelector(`script[src="${APPLE_SCRIPT_URL}"]`)) {
      const interval = setInterval(() => {
        if (window.AppleID) { clearInterval(interval); init(); }
      }, 100);
      return () => clearInterval(interval);
    }

    const script   = document.createElement('script');
    script.src     = APPLE_SCRIPT_URL;
    script.async   = true;
    script.onload  = init;
    script.onerror = () => setError('Failed to load Apple Sign-In.');
    document.head.appendChild(script);
    return;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const signIn = useCallback(async () => {
    if (!window.AppleID) return;
    setError(null);
    try {
      const response = await window.AppleID.auth.signIn();
      await loginWithApple({ idToken: response.authorization.id_token });
    } catch (err) {
      // Apple popup closed by user returns a specific error — ignore it
      if ((err as { error?: string })?.error === 'popup_closed_by_user') return;
      setError('Apple login failed. Please try again.');
    }
  }, [loginWithApple]);

  return {
    signIn,
    isReady:   ready,
    isLoading: mutation.isLoading,
    isSuccess: mutation.isSuccess,
    error:     error ?? (mutation.isError ? 'Apple login failed. Please try again.' : null),
  };
}
