import { NextResponse } from 'next/server';
import { createServerSupabase } from '../../_supabase-server';
import { requireAdmin } from '@/lib/adminAuth';

/**
 * Admin logout: appends a 'logout' row to admin_logs for the given callsign.
 * The client is responsible for clearing its own session storage — this
 * route only records the audit trail entry.
 */
export async function POST(req) {
  try {
    const supabase = createServerSupabase();
    const admin = await requireAdmin(req, supabase);
    if (!admin) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await supabase.from('admin_logs').insert({
      admin_callsign: admin.callsign,
      admin_name: admin.name || null,
      action: 'logout',
      target_user_id: null,
      target_email: null,
      changes: null,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[admin/logout]', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
