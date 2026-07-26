import { NextResponse } from 'next/server';
import { createServerSupabase } from '../../_supabase-server';
import { requireAdmin } from '@/lib/adminAuth';

const EDITABLE_FIELDS = [
  'badge_label',
  'heading',
  'description',
  'price',
  'link',
  'image_front',
  'image_back',
  'accent_color',
  'secondary_color',
];

/**
 * Config for one promo slot — 'limited_drop' (homepage strip) or
 * 'exclusive' (floating notification). They're independent rows so each
 * can carry different copy/colors/links.
 */
export async function PATCH(req) {
  try {
    const supabase = createServerSupabase();
    const admin = await requireAdmin(req, supabase);
    if (!admin) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, fields } = body || {};
    if (!['limited_drop', 'exclusive'].includes(id)) {
      return NextResponse.json(
        { success: false, message: 'id ("limited_drop"|"exclusive") is required.' },
        { status: 400 }
      );
    }
    if (!fields || typeof fields !== 'object') {
      return NextResponse.json({ success: false, message: 'fields is required.' }, { status: 400 });
    }

    const changes = {};
    for (const key of Object.keys(fields)) {
      if (!EDITABLE_FIELDS.includes(key)) continue;
      changes[key] = fields[key];
    }

    if (Object.keys(changes).length === 0) {
      return NextResponse.json({ success: false, message: 'No editable fields supplied.' }, { status: 400 });
    }

    const { data: updated, error } = await supabase
      .from('promo_settings')
      .upsert(
        { id, ...changes, updated_at: new Date().toISOString(), updated_by: admin.callsign },
        { onConflict: 'id' }
      )
      .select()
      .maybeSingle();

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    await supabase.from('admin_logs').insert({
      admin_callsign: admin.callsign,
      admin_name: admin?.name || null,
      action: 'update_promo_settings',
      target_user_id: null,
      target_email: id,
      changes: { after: changes },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error('[admin/promo PATCH]', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
