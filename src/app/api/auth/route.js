import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateUniqueCode } from '@/lib/uniqueCode';

// Public client for password sign-in (no admin privileges needed here).
const anonClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_KEY
);

function adminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Single-step "log in or create an account" endpoint.
 * 1. Try signing in with the given email/password.
 * 2. If that fails, create a pre-confirmed account via the Admin API
 *    (no confirmation email is sent, so this never hits the mailer rate limit)
 *    and sign in immediately.
 * 3. If account creation fails because the email is already registered,
 *    the original sign-in failure means the password was wrong.
 */
export async function POST(req) {
  try {
    const { email, password } = await req.json();
    const trimmedEmail = String(email || '').trim().toLowerCase();

    if (!trimmedEmail || !password || password.length < 6) {
      return NextResponse.json(
        { error: 'Email and a password of at least 6 characters are required.' },
        { status: 400 }
      );
    }

    const { data: signInData, error: signInError } = await anonClient.auth.signInWithPassword({
      email: trimmedEmail,
      password,
    });

    if (!signInError && signInData?.session) {
      return NextResponse.json({ session: signInData.session, created: false });
    }

    const admin = adminClient();
    const { data: createData, error: createError } = await admin.auth.admin.createUser({
      email: trimmedEmail,
      password,
      email_confirm: true,
    });

    if (createError) {
      const alreadyExists = /already registered|already exists|already been registered/i.test(
        createError.message || ''
      );
      if (alreadyExists) {
        return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 });
      }
      return NextResponse.json({ error: createError.message }, { status: 400 });
    }

    // Seed an empty profile row (unique code assigned once, immutable from here on).
    const newUserId = createData?.user?.id;
    if (newUserId) {
      let attemptsLeft = 3;
      let inserted = false;
      while (attemptsLeft > 0 && !inserted) {
        const { error: profileError } = await admin.from('profiles').insert({
          user_id: newUserId,
          unique_code: generateUniqueCode(),
        });
        if (!profileError) {
          inserted = true;
        } else if (!/duplicate key/i.test(profileError.message || '')) {
          console.error('[api/auth] profile insert failed', profileError);
          break;
        }
        attemptsLeft -= 1;
      }
    }

    const { data: freshSignIn, error: freshError } = await anonClient.auth.signInWithPassword({
      email: trimmedEmail,
      password,
    });

    if (freshError || !freshSignIn?.session) {
      return NextResponse.json(
        { error: freshError?.message || 'Account created but sign-in failed. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ session: freshSignIn.session, created: true });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
