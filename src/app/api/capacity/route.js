import { NextResponse } from 'next/server';
import { createServerSupabase } from '../_supabase-server';

/** Paid-registration counts per event/workshop id, used to derive "seats left". */
export async function GET() {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from('registrations')
    .select('workshop_ids')
    .eq('payment_status', 'paid');

  if (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }

  const counts = {};
  for (const row of data || []) {
    for (const id of row.workshop_ids || []) {
      counts[id] = (counts[id] || 0) + 1;
    }
  }

  return NextResponse.json({ success: true, counts });
}
