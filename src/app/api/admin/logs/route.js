import { NextResponse } from 'next/server';
import { createServerSupabase } from '../../_supabase-server';
import { requireAdmin } from '@/lib/adminAuth';

/**
 * Admin action log view: returns recent admin_logs rows (who changed what,
 * for which user, when) so the admin portal can render an audit trail.
 */
export async function GET(req) {
  try {
    const supabase = createServerSupabase();
    if (!(await requireAdmin(req, supabase))) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('admin_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) {
      console.error('[admin/logs]', error);
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (err) {
    console.error('[admin/logs]', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
