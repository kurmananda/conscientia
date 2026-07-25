import { createClient } from '@supabase/supabase-js';

// Single shared browser Supabase client — auth session persists in
// localStorage so refreshing the page keeps the user signed in.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);
