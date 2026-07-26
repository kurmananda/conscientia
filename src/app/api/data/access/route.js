import { NextResponse } from 'next/server';
import { createServerSupabase } from '../../_supabase-server';

/**
 * Lists the workshops/events the calling user is a coordinator for — i.e.
 * their own profiles.unique_code (their "CNS-id") appears in that catalog
 * item's `access` list. The caller is identified from a Supabase session
 * access token, never a client-supplied id, since this reveals other
 * people's registration data.
 */
export async function GET(req) {
  try {
    const supabase = createServerSupabase();
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token) {
      return NextResponse.json({ success: false, message: 'Not signed in.' }, { status: 401 });
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
      return NextResponse.json({ success: true, data: [] });
    }

    const { data: items, error } = await supabase
      .from('catalog_items')
      .select('id, kind, title, section, access')
      .contains('access', [profile.unique_code]);

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    const withCounts = await Promise.all(
      (items || []).map(async (item) => {
        const { count } = await supabase
          .from('registrations')
          .select('id', { count: 'exact', head: true })
          .contains('workshop_ids', [item.id]);
        return { id: item.id, kind: item.kind, title: item.title, section: item.section, count: count || 0 };
      })
    );

    return NextResponse.json({ success: true, data: withCounts });
  } catch (err) {
    console.error('[data/access GET]', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
