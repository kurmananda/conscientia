import { NextResponse } from 'next/server';
import { createServerSupabase } from '../../_supabase-server';

/**
 * Participant list for one workshop/event, restricted to callers whose own
 * unique_code is in that item's `access` list. Read-only — this route has
 * no corresponding write path, matching /data being a view-only page.
 */
export async function GET(req) {
  try {
    const supabase = createServerSupabase();
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token) {
      return NextResponse.json({ success: false, message: 'Not signed in.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get('item_id');
    if (!itemId) {
      return NextResponse.json({ success: false, message: 'item_id is required.' }, { status: 400 });
    }

    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) {
      return NextResponse.json({ success: false, message: 'Not signed in.' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('unique_code')
      .eq('user_id', userData.user.id)
      .maybeSingle();

    if (!profile?.unique_code) {
      return NextResponse.json({ success: false, message: 'No profile found.' }, { status: 403 });
    }

    const { data: item } = await supabase
      .from('catalog_items')
      .select('id, kind, title, access')
      .eq('id', itemId)
      .maybeSingle();

    if (!item || !Array.isArray(item.access) || !item.access.includes(profile.unique_code)) {
      return NextResponse.json(
        { success: false, message: "You haven't been assigned this event or workshop. Ask admin to send permission." },
        { status: 403 }
      );
    }

    const { data: registrations, error } = await supabase
      .from('registrations')
      .select('*')
      .contains('workshop_ids', [itemId]);

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    const userIds = (registrations || []).map((r) => r.user_id).filter(Boolean);
    const { data: profiles } = userIds.length
      ? await supabase.from('profiles').select('*').in('user_id', userIds)
      : { data: [] };
    const profileByUserId = Object.fromEntries((profiles || []).map((p) => [p.user_id, p]));

    const participants = (registrations || []).map((reg) => {
      const p = profileByUserId[reg.user_id];
      return {
        name: p?.name || null,
        phone: p?.phone || null,
        college: p?.college || null,
        city: p?.city || null,
        address: p?.address || null,
        gender: p?.gender || null,
        unique_code: p?.unique_code || null,
        email: reg.email,
        payment_status: reg.payment_status,
        status: reg.status,
        amount: reg.amount,
        registered_at: reg.created_at,
      };
    });

    return NextResponse.json({
      success: true,
      data: { item: { id: item.id, kind: item.kind, title: item.title }, participants },
    });
  } catch (err) {
    console.error('[data/registrants GET]', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
