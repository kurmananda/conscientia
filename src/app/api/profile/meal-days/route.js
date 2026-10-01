// Lets a user resolve which festival days their already-paid
// breakfast/lunch/dinner add-ons were for, when that data was lost before
// per-day tracking existed. Body: { user_id, email, resolutions: [{ booking_uid, dates: [] }] }
// `dates.length` must equal the item's paid `qty` — enforced here too, not
// just client-side, since this can be hit directly.
//
// The registration is looked up by `user_id` first, matching how the
// profile page fetches it (/api/get-registrations?user_id=...) — a
// registration's `email` column can differ from the logged-in user's auth
// email (e.g. it was created/paid under a different email and only later
// linked to this account via user_id), so an email-only lookup could miss
// the row and wrongly report "not found".
import { NextResponse } from 'next/server';
import { createServerSupabase } from '../../_supabase-server';

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const userId = String(body.user_id || '').trim();
  const email = String(body.email || '').trim().toLowerCase();
  const resolutions = Array.isArray(body.resolutions) ? body.resolutions : [];

  if ((!userId && !email) || resolutions.length === 0) {
    return NextResponse.json({ success: false, message: 'user_id or email, and resolutions, required' }, { status: 400 });
  }

  const supabase = createServerSupabase();
  const query = supabase.from('registrations').select('details');
  const { data: existing, error: fetchError } = userId
    ? await query.eq('user_id', userId).maybeSingle()
    : await query.eq('email', email).maybeSingle();

  if (fetchError || !existing) {
    return NextResponse.json({ success: false, message: fetchError?.message || 'not found' }, { status: 404 });
  }

  const details = existing.details && typeof existing.details === 'object' ? existing.details : {};
  const itemsPaid = Array.isArray(details.items_paid) ? details.items_paid : [];

  const byUid = new Map(resolutions.map((r) => [r.booking_uid, r.dates]));

  const updatedItems = itemsPaid.map((item) => {
    const dates = byUid.get(item.booking_uid);
    if (!dates) return item;
    if (!Array.isArray(dates) || dates.length !== item.qty) {
      return item; // silently ignore a malformed/mismatched submission for this line
    }
    return { ...item, dates, needs_day_selection: false };
  });

  const updateQuery = supabase
    .from('registrations')
    .update({ details: { ...details, items_paid: updatedItems }, updated_at: new Date().toISOString() });
  const { error: updateError } = userId
    ? await updateQuery.eq('user_id', userId)
    : await updateQuery.eq('email', email);

  if (updateError) {
    return NextResponse.json({ success: false, message: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
