import { createClient } from '@supabase/supabase-js';
import { processLock } from '@supabase/auth-js';

// Single shared browser Supabase client — auth session persists in
// localStorage so refreshing the page keeps the user signed in.
//
// `lock: processLock` swaps out gotrue-js's default `navigatorLock`, which
// serializes auth calls across browser tabs via the Web Locks API. Several
// contexts (CartContext, ProfileContext) each read the session the moment a
// user is available, and under navigatorLock those concurrent reads were
// occasionally not releasing within its 5s timeout ("orphaned lock ...
// forcefully acquiring") — and that forced recovery could race a token
// refresh, actually invalidating the session and signing the user out.
// processLock serializes the same calls in-memory within this tab instead,
// which is all this app needs (no requirement to coordinate across tabs).
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      lock: processLock,
    },
  }
);
