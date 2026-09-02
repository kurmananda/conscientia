import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateUniqueCode } from '@/lib/uniqueCode';

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
 * Google sign-in without Supabase's OAuth provider. The browser gets a
 * signed ID token straight from Google (Google Identity Services button —
 * no redirect flow), and this route verifies it directly with Google, then
 * creates-or-signs-into the same auth.users/profiles row an email/password
 * signup would use, keyed by the verified email. Same table as everyone
 * else — no separate Google-only user store.
 */
export async function POST(req) {
  try {
    const { credential } = await req.json();
    if (!credential) {
      return NextResponse.json({ error: 'Missing Google credential.' }, { status: 400 });
    }

    // Verifying with Google's tokeninfo endpoint needs no client secret and
    // no extra dependency — it checks the token's signature, expiry, and
    // issuer for us; we only need to additionally confirm it was issued for
    // *our* client id (`aud`), or any site's Google token would be accepted.
    const verifyRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
    );
    const payload = await verifyRes.json().catch(() => ({}));

    if (!verifyRes.ok || !payload.email) {
      return NextResponse.json({ error: 'Could not verify Google account.' }, { status: 401 });
    }
    if (payload.email_verified !== 'true' && payload.email_verified !== true) {
      return NextResponse.json({ error: 'Google email is not verified.' }, { status: 401 });
    }
    if (process.env.GOOGLE_CLIENT_ID && payload.aud !== process.env.GOOGLE_CLIENT_ID) {
      return NextResponse.json({ error: 'Invalid Google client.' }, { status: 401 });
    }

    const email = payload.email.toLowerCase();
    const admin = adminClient();

    // generateLink with type 'magiclink' works for both a brand-new email
    // (it creates the user) and an existing one (it just targets that
    // user) — one call handles both "create" and "log into existing
    // account" the same way the password flow needs two separate calls for.
    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email,
    });

    if (linkError || !linkData?.properties?.hashed_token) {
      return NextResponse.json(
        { error: linkError?.message || 'Could not create a session.' },
        { status: 500 }
      );
    }

    const userId = linkData.user?.id;

    // Seed an empty profile row if this account has none yet — same
    // retry-on-collision pattern as the password signup path (unique_code
    // assigned once, immutable from here on).
    if (userId) {
      const { data: existingProfile } = await admin
        .from('profiles')
        .select('user_id')
        .eq('user_id', userId)
        .maybeSingle();

      if (!existingProfile) {
        let attemptsLeft = 3;
        while (attemptsLeft > 0) {
          const { error: profileError } = await admin.from('profiles').insert({
            user_id: userId,
            unique_code: generateUniqueCode(),
          });
          if (!profileError) break;
          if (!/duplicate key/i.test(profileError.message || '')) {
            console.error('[api/auth/google] profile insert failed', profileError);
            break;
          }
          attemptsLeft -= 1;
        }
      }
    }

    // Exchange the magic-link token for an actual session, without ever
    // sending an email — we already know the account is legitimate because
    // Google just verified it.
    const { data: verifyData, error: verifyError } = await anonClient.auth.verifyOtp({
      token_hash: linkData.properties.hashed_token,
      type: 'email',
    });

    if (verifyError || !verifyData?.session) {
      return NextResponse.json(
        { error: verifyError?.message || 'Could not sign in.' },
        { status: 500 }
      );
    }

    const created = !!linkData.user && new Date(linkData.user.created_at).getTime() > Date.now() - 15000;

    return NextResponse.json({ session: verifyData.session, created });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
