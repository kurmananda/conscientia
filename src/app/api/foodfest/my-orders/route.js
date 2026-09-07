import { NextResponse } from 'next/server';
import { createServerSupabase } from '../../_supabase-server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/** Public order-status lookup for the signed-in user's own email, so they can watch their order move through pending → preparing → ready → completed. */
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const email = (searchParams.get('email') || '').trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ success: false, message: 'email is required.' }, { status: 400 });
  }

  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from('foodfest_orders')
    .select('id, items, amount, order_status, payment_status, created_at')
    .eq('email', email)
    .eq('payment_status', 'paid')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  return NextResponse.json(
    { success: true, data },
    { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
  );
}
