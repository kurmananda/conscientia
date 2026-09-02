import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createServerSupabase } from '../../_supabase-server';

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * Admin login: verifies callsign + password against the `admins` table.
 * Password is stored as a sha256 hex hash (no salt/secret — see migration
 * 0002). Returns { name, role, callsign } on success.
 */
export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const callsign = (body.callsign || '').trim();
    const password = body.password || '';

    if (!callsign || !password) {
      return NextResponse.json(
        { success: false, message: 'Callsign and password are required.' },
        { status: 401 }
      );
    }

    const supabase = createServerSupabase();

    const { data, error } = await supabase
      .from('admins')
      .select('callsign, name, role, password')
      .eq('callsign', callsign)
      .maybeSingle();

    if (error) {
      // Most likely cause: migration 0002 (adds admins.password) hasn't
      // been run yet, so the column doesn't exist.
      console.error('[admin/login] query error', error.message);
      return NextResponse.json(
        { success: false, message: 'Login is not set up yet (server error) — check that migration 0002 has been run.' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { success: false, message: 'Invalid callsign or password.' },
        { status: 401 }
      );
    }

    if (!data.password) {
      return NextResponse.json(
        { success: false, message: `No password set for "${callsign}" yet — set one via SQL: update admins set password = encode(sha256('yourpassword'::bytea), 'hex') where callsign = '${callsign}';` },
        { status: 401 }
      );
    }

    if (hashPassword(password) !== data.password) {
      return NextResponse.json(
        { success: false, message: 'Invalid callsign or password.' },
        { status: 401 }
      );
    }

    // Callsign + password matched — now check that the signed-in account
    // making this request is actually flagged as an admin. This means the
    // shared callsign/password alone isn't enough: the browser also has to
    // be signed into an account marked is_admin, so the codeword can't be
    // reused on another device/account to get in.
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'You must be signed in with an admin account to access this.' },
        { status: 403 }
      );
    }

    const { data: authData, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !authData?.user) {
      return NextResponse.json(
        { success: false, message: 'Your session has expired — sign in again.' },
        { status: 401 }
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('user_id', authData.user.id)
      .maybeSingle();

    if (profileError) {
      console.error('[admin/login] profile query error', profileError.message);
      return NextResponse.json(
        { success: false, message: 'Login is not set up yet (server error) — check that migration 0032 has been run.' },
        { status: 500 }
      );
    }

    if (!profile?.is_admin) {
      return NextResponse.json(
        { success: false, message: 'That callsign/password is correct, but your account is not marked as admin.' },
        { status: 403 }
      );
    }

    await supabase.from('admin_logs').insert({
      admin_callsign: data.callsign,
      admin_name: data.name || null,
      action: 'login',
      target_user_id: authData.user.id,
      target_email: authData.user.email || null,
      changes: null,
    });

    return NextResponse.json({
      success: true,
      callsign: data.callsign,
      name: data.name,
      role: data.role,
    });
  } catch (err) {
    console.error('[admin/login]', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
