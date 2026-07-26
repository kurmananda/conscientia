import { NextResponse } from 'next/server';
import { createServerSupabase } from '../../_supabase-server';
import { requireAdmin } from '@/lib/adminAuth';

/**
 * The `tickets` table is the single source of truth for every ticket id in
 * the app (workshops, events, food/accommodation/merch addons, and the
 * online-workshops combos). Read-only here by design — it's managed
 * directly in Supabase, never through this portal.
 */
export async function GET(req) {
  const supabase = createServerSupabase();
  const admin = await requireAdmin(req, supabase);
  if (!admin) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase.from('tickets').select('*').order('type').order('id');
  if (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true, data: data || [] });
}
