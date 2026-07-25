import { NextResponse } from 'next/server';
import { createServerSupabase } from '../../_supabase-server';
import { requireAdmin } from '@/lib/adminAuth';

/**
 * Lists all admins (callsign, name, role only — never the password hash).
 */
export async function GET(req) {
  try {
    const supabase = createServerSupabase();
    if (!(await requireAdmin(req, supabase))) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('admins')
      .select('callsign, name, role')
      .order('name', { ascending: true });

    if (error) {
      console.error('[admin/list]', error);
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (err) {
    console.error('[admin/list]', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
