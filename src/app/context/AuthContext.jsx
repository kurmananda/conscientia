'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { CHECKOUT_STORAGE_KEYS } from '@/lib/checkout';

const AuthContext = createContext({
  user: null,
  loading: true,
  authenticate: async () => ({ error: 'not_ready' }),
  authenticateWithGoogle: async () => ({ error: 'not_ready' }),
  signOut: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      if (data?.session) {
        setUser(data.session.user);
        setLoading(false);
        return;
      }
      // getSession() came back empty — could be a real "no session", or it
      // could be gotrue-js's auth-token lock timing out under the
      // concurrent load of every page's own getSession()/data calls and
      // resolving empty as a fallback rather than throwing. Confirm with
      // getUser(), which re-checks the stored token directly, before
      // treating this as an actual logged-out state.
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!active) return;
        setUser(userData?.user ?? null);
      } finally {
        if (active) setLoading(false);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (session) {
        setUser(session.user);
        setLoading(false);
        return;
      }
      // A null session on any event other than an explicit SIGNED_OUT is
      // more likely a transient lock/refresh hiccup than a real logout —
      // e.g. gotrue's own re-checks on tab focus, or lock contention from
      // the several pages/contexts that call getSession() independently.
      // Only SIGNED_OUT is trusted to actually clear the signed-in user.
      if (event === 'SIGNED_OUT') setUser(null);
      setLoading(false);
    });

    return () => {
      active = false;
      sub?.subscription?.unsubscribe();
    };
  }, []);

  // Single "log in, or create an account if none exists" call — no
  // confirmation email is ever sent, so there's no mailer rate limit to hit.
  const authenticate = useCallback(async (email, password) => {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok || data.error) {
      return { error: data.error || 'Authentication failed.' };
    }

    const { error: setError } = await supabase.auth.setSession({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    });
    if (setError) return { error: setError.message };

    return { user: data.session.user, created: data.created };
  }, []);

  // Google sign-in — no Supabase OAuth provider setup at all. A "Sign in
  // with Google" button (Google Identity Services, loaded client-side)
  // hands us a signed ID token; the server verifies it directly with
  // Google and creates/logs into the exact same auth.users/profiles row an
  // email/password signup would use, keyed by the verified email — so a
  // Google sign-in with an email that already has an account just signs
  // into that account, same table as everyone else.
  const authenticateWithGoogle = useCallback(async (idToken) => {
    const res = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential: idToken }),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok || data.error) {
      return { error: data.error || 'Google sign-in failed.' };
    }

    const { error: setError } = await supabase.auth.setSession({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    });
    if (setError) return { error: setError.message };

    return { user: data.session.user, created: data.created };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    // Safety net: wipe any leftover single-use checkout data and the guest
    // cart so a different person signing in on this browser never inherits
    // another user's in-flight ticket/booking state.
    if (typeof window !== 'undefined') {
      CHECKOUT_STORAGE_KEYS.forEach((key) => window.localStorage.removeItem(key));
      window.localStorage.removeItem('conscientia_cart');
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, authenticate, authenticateWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
