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

    await supabase.from('admin_logs').insert({
      admin_callsign: data.callsign,
      admin_name: data.name || null,
      action: 'login',
      target_user_id: null,
      target_email: null,
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
