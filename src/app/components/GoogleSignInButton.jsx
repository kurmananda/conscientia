'use client';

import { useEffect, useId, useRef } from 'react';

/**
 * Renders Google's own "Sign in with Google" button via Google Identity
 * Services (a single client-side script, no Supabase OAuth provider
 * involved). On success it calls onCredential with the signed ID token —
 * the caller is responsible for sending that to the server to verify and
 * turn into a session.
 */
export default function GoogleSignInButton({ onCredential, disabled }) {
  const containerId = useId();
  const containerRef = useRef(null);
  const onCredentialRef = useRef(onCredential);
  onCredentialRef.current = onCredential;

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    let cancelled = false;

    function render() {
      if (cancelled || !window.google?.accounts?.id || !containerRef.current) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => onCredentialRef.current?.(response.credential),
      });
      window.google.accounts.id.renderButton(containerRef.current, {
        type: 'standard',
        theme: 'filled_black',
        size: 'large',
        shape: 'pill',
        width: containerRef.current.offsetWidth || 320,
      });
    }

    if (window.google?.accounts?.id) {
      render();
      return;
    }

    const existing = document.querySelector('script[data-google-identity]');
    if (existing) {
      existing.addEventListener('load', render);
      return () => existing.removeEventListener('load', render);
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.dataset.googleIdentity = 'true';
    script.onload = render;
    document.head.appendChild(script);

    return () => {
      cancelled = true;
    };
  }, []);

  if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) return null;

  return (
    <div
      id={containerId}
      ref={containerRef}
      className={disabled ? 'pointer-events-none opacity-50' : ''}
    />
  );
}
