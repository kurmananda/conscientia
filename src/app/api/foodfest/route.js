import { NextResponse } from 'next/server';
import { createServerSupabase } from '../_supabase-server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/** Public Food Fest listing: open stalls with their available items. */
export async function GET() {
  const supabase = createServerSupabase();

  const [{ data: stalls, error: stallsError }, { data: items, error: itemsError }] = await Promise.all([
    supabase.from('foodfest_stalls').select('*').eq('is_open', true).order('sort_order'),
    supabase.from('foodfest_items').select('*').eq('is_available', true).order('sort_order'),
  ]);

  if (stallsError) return NextResponse.json({ success: false, message: stallsError.message }, { status: 500 });
  if (itemsError) return NextResponse.json({ success: false, message: itemsError.message }, { status: 500 });

  const itemsByStall = new Map();
  for (const item of items || []) {
    const list = itemsByStall.get(item.stall_id) || [];
    list.push(item);
    itemsByStall.set(item.stall_id, list);
  }

  const data = (stalls || []).map((stall) => ({ ...stall, items: itemsByStall.get(stall.id) || [] }));

  return NextResponse.json(
    { success: true, data },
    { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
  );
}
