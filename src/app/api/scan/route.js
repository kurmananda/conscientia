import { NextResponse } from 'next/server';
import { createServerSupabase } from '../_supabase-server';
import { lookupByUniqueCode } from '@/lib/scanLookup';

/**
 * Peer-to-peer QR lookup for the profile page's scanner — any signed-in
 * user can scan another attendee's QR and see their details, same trust
 * model as the CNS-id already being shared for team registration.
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

    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    if (!code) {
      return NextResponse.json({ success: false, message: 'code is required.' }, { status: 400 });
    }

    const result = await lookupByUniqueCode(supabase, code);
    if (!result) {
      return NextResponse.json({ success: false, message: 'No attendee found for that code.' }, { status: 404 });
    }

    // user_id is internal — never expose it to another attendee.
    const { user_id, ...data } = result;
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('[scan GET]', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
