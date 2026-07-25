import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function adminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Checks whether a Supabase auth user already exists for the given email.
 * Used by the login page to auto-switch between "Login" and "Create Profile".
 */
export async function POST(req) {
  try {
    const { email } = await req.json();
    const trimmedEmail = String(email || '').trim().toLowerCase();

    if (!trimmedEmail) {
      return NextResponse.json({ exists: false });
    }

    const admin = adminClient();
    // supabase-js v2 doesn't expose a direct filter-by-email admin call, so
    // page through listUsers and match client-side.
    let exists = false;
    let page = 1;
    const perPage = 200;
    for (let i = 0; i < 10; i += 1) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
      if (error || !data?.users?.length) break;
      if (data.users.some((u) => (u.email || '').toLowerCase() === trimmedEmail)) {
        exists = true;
        break;
      }
      if (data.users.length < perPage) break;
      page += 1;
    }

    return NextResponse.json({ exists });
  } catch (err) {
    return NextResponse.json({ exists: false, error: err.message || 'Server error' }, { status: 500 });
  }
}
