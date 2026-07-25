import { NextResponse } from 'next/server';
import { createServerSupabase } from '../../_supabase-server';
import { requireAdmin } from '@/lib/adminAuth';

const EDITABLE_FIELDS = [
  'accommodation_checkin',
  'accommodation_checkout',
  'accommodation_room',
];

// timestamptz columns — Postgres rejects '' ("invalid input syntax for
// type timestamp with time zone"), so an empty string must become null.
const TIMESTAMP_FIELDS = ['accommodation_checkin', 'accommodation_checkout'];

/**
 * Admin-only write path for accommodation/merch fields on a profile. Every
 * write appends a row to admin_logs with the diff, per the audit-trail
 * requirement. This must be the only place these columns are ever written
 * from — the user-facing useProfile().save() hook must not touch them.
 */
export async function PATCH(req) {
  try {
    const supabase = createServerSupabase();
    const admin = await requireAdmin(req, supabase);
    if (!admin) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const callsign = admin.callsign;

    const body = await req.json();
    const { user_id, fields } = body || {};

    if (!user_id || !fields || typeof fields !== 'object') {
      return NextResponse.json(
        { success: false, message: 'user_id and fields are required.' },
        { status: 400 }
      );
    }

    const changes = {};
    for (const key of Object.keys(fields)) {
      if (!EDITABLE_FIELDS.includes(key)) continue;
      let value = fields[key];
      if (TIMESTAMP_FIELDS.includes(key) && value === '') value = null;
      changes[key] = value;
    }

    if (Object.keys(changes).length === 0) {
      return NextResponse.json(
        { success: false, message: 'No editable fields supplied.' },
        { status: 400 }
      );
    }

    const { data: before } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user_id)
      .maybeSingle();

    const { data: updated, error } = await supabase
      .from('profiles')
      .update({ ...changes, updated_at: new Date().toISOString() })
      .eq('user_id', user_id)
      .select()
      .maybeSingle();

    if (error) {
      console.error('[admin/profile PATCH]', error);
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    await supabase.from('admin_logs').insert({
      admin_callsign: callsign,
      admin_name: admin?.name || null,
      action: 'update_profile',
      target_user_id: user_id,
      target_email: before?.email || null,
      changes: { before: before ? pick(before, Object.keys(changes)) : null, after: changes },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error('[admin/profile PATCH]', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

function pick(obj, keys) {
  const out = {};
  for (const k of keys) out[k] = obj[k];
  return out;
}
