import { NextResponse } from 'next/server';
import { createServerSupabase } from '../../_supabase-server';
import { requireAdmin } from '@/lib/adminAuth';

// Guest registrants (paid via a direct TiQR link, never signed into the
// site) have no `profiles` row to attach details to — TiQR's own booking
// form never collects college/city/gender either, so this data can only
// ever come from an admin manually filling it in from another source.
// Stored on the registration's `details` jsonb instead of a profile row.
const EDITABLE_FIELDS = ['name', 'phone', 'college', 'city', 'gender'];

export async function PATCH(req) {
  try {
    const supabase = createServerSupabase();
    const admin = await requireAdmin(req, supabase);
    if (!admin) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { email, fields } = body || {};
    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!normalizedEmail || !fields || typeof fields !== 'object') {
      return NextResponse.json(
        { success: false, message: 'email and fields are required.' },
        { status: 400 }
      );
    }

    const changes = {};
    for (const key of Object.keys(fields)) {
      if (!EDITABLE_FIELDS.includes(key)) continue;
      changes[key] = fields[key];
    }

    if (Object.keys(changes).length === 0) {
      return NextResponse.json(
        { success: false, message: 'No editable fields supplied.' },
        { status: 400 }
      );
    }

    const { data: existing, error: fetchError } = await supabase
      .from('registrations')
      .select('details')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (fetchError || !existing) {
      return NextResponse.json(
        { success: false, message: fetchError?.message || 'Registration not found.' },
        { status: 404 }
      );
    }

    const details = existing.details && typeof existing.details === 'object' ? existing.details : {};
    const before = { name: details.name, phone: details.phone, college: details.college, city: details.city, gender: details.gender };

    const { error } = await supabase
      .from('registrations')
      .update({ details: { ...details, ...changes }, updated_at: new Date().toISOString() })
      .eq('email', normalizedEmail);

    if (error) {
      console.error('[admin/guest-profile PATCH]', error);
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    await supabase.from('admin_logs').insert({
      admin_callsign: admin.callsign,
      admin_name: admin?.name || null,
      action: 'update_guest_profile',
      target_email: normalizedEmail,
      changes: { before, after: changes },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[admin/guest-profile PATCH]', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
