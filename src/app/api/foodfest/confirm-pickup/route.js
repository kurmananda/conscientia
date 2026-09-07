import { NextResponse } from 'next/server';
import { createServerSupabase } from '../../_supabase-server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Lets a signed-in user confirm they've picked up their own order, moving it
 * from the active list into their history. Scoped to the order's own email
 * so one user can't complete another's order.
 */
export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const id = (body.id || '').trim();
  const email = (body.email || '').trim().toLowerCase();
  if (!id || !email) {
    return NextResponse.json({ success: false, message: 'id and email are required.' }, { status: 400 });
  }

  const supabase = createServerSupabase();
  const { data: order, error: fetchError } = await supabase
    .from('foodfest_orders')
    .select('id, email, order_status')
    .eq('id', id)
    .maybeSingle();

  if (fetchError) return NextResponse.json({ success: false, message: fetchError.message }, { status: 500 });
  if (!order || order.email?.toLowerCase() !== email) {
    return NextResponse.json({ success: false, message: 'Order not found.' }, { status: 404 });
  }
  if (order.order_status === 'completed') {
    return NextResponse.json({ success: true, data: order });
  }

  const { data, error } = await supabase
    .from('foodfest_orders')
    .update({ order_status: 'completed', updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data });
}
