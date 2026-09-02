import { NextResponse } from 'next/server';
import { createServerSupabase } from '../../_supabase-server';
import { requireAdmin } from '@/lib/adminAuth';
import { lookupByUniqueCode } from '@/lib/scanLookup';

/**
 * Admin Check In tab: scans a QR (CNS-id), stamps profiles.checked_in_at the
 * first time only, and returns the full attendee record for the popup.
 * Re-scanning an already-checked-in attendee never overwrites the timestamp.
 *
 * Eligibility is simply "has an account" (a profiles row with this
 * unique_code) — no event/workshop registration and no accommodation
 * booking is required to check in.
 */
export async function POST(req) {
  try {
    const supabase = createServerSupabase();
    const admin = await requireAdmin(req, supabase);
    if (!admin) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const code = String(body?.code || '').trim().toUpperCase();
    if (!code) {
      return NextResponse.json({ success: false, message: 'code is required.' }, { status: 400 });
    }

    // profiles has no email column — email lives on `registrations`, looked
    // up separately below only when we actually need it for the audit log.
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_id, checked_in_at')
      .eq('unique_code', code)
      .maybeSingle();

    // Surface the real DB error instead of a misleading "not found" — e.g.
    // if the checked_in_at column migration hasn't been applied yet, this
    // query errors and profile comes back undefined even for a real code.
    if (profileError) {
      console.error('[admin/checkin POST] profile lookup', profileError);
      return NextResponse.json({ success: false, message: profileError.message }, { status: 500 });
    }

    if (!profile) {
      return NextResponse.json({ success: false, message: 'No attendee found for that code.' }, { status: 404 });
    }

    let alreadyCheckedIn = !!profile.checked_in_at;

    if (!alreadyCheckedIn) {
      const now = new Date().toISOString();
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ checked_in_at: now })
        .eq('user_id', profile.user_id);

      if (updateError) {
        return NextResponse.json({ success: false, message: updateError.message }, { status: 500 });
      }

      const { data: registration } = await supabase
        .from('registrations')
        .select('email')
        .eq('user_id', profile.user_id)
        .maybeSingle();

      await supabase.from('admin_logs').insert({
        admin_callsign: admin.callsign,
        admin_name: admin?.name || null,
        action: 'check_in',
        target_user_id: profile.user_id,
        target_email: registration?.email || null,
        changes: { after: { checked_in_at: now } },
      });
    }

    const data = await lookupByUniqueCode(supabase, code);
    if (!data) {
      return NextResponse.json({ success: false, message: 'No attendee found for that code.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, already_checked_in: alreadyCheckedIn, data });
  } catch (err) {
    console.error('[admin/checkin POST]', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
