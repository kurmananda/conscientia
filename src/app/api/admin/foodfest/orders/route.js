import { NextResponse } from 'next/server';
import { createServerSupabase } from '../../../_supabase-server';
import { requireFoodfestAdmin } from '@/lib/foodfestAdminAuth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const ORDER_STATUSES = ['pending', 'preparing', 'ready', 'completed'];

export async function GET(req) {
  const supabase = createServerSupabase();
  if (!(await requireFoodfestAdmin(req, supabase))) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }
  const { data, error } = await supabase
    .from('foodfest_orders')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });

  const userIds = [...new Set((data || []).map((o) => o.user_id).filter(Boolean))];
  let codeByUserId = {};
  if (userIds.length > 0) {
    const { data: profiles } = await supabase.from('profiles').select('user_id, unique_code').in('user_id', userIds);
    codeByUserId = Object.fromEntries((profiles || []).map((p) => [p.user_id, p.unique_code]));
  }
  const withCns = (data || []).map((o) => ({ ...o, cns_id: codeByUserId[o.user_id] || null }));

  return NextResponse.json({ success: true, data: withCns });
}

export async function PATCH(req) {
  const supabase = createServerSupabase();
  if (!(await requireFoodfestAdmin(req, supabase))) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const { id, order_status } = body;
  if (!id || !ORDER_STATUSES.includes(order_status)) {
    return NextResponse.json(
      { success: false, message: `id and order_status (${ORDER_STATUSES.join('|')}) are required.` },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from('foodfest_orders')
    .update({ order_status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data });
}
