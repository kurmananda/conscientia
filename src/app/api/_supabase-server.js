import { createClient } from '@supabase/supabase-js';

/**
 * Server-side Supabase client. Prefer SUPABASE_SERVICE_ROLE_KEY in production
 * so API routes can upsert regardless of RLS (anon key often blocks inserts).
 */
export function createServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_KEY;
  const key = serviceKey || anonKey;

  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or Supabase key');
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
