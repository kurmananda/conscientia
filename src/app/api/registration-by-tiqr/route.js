import { NextResponse } from 'next/server';
import { createServerSupabase } from '../_supabase-server';

/**
 * Recover registration row after payment when localStorage was cleared
 * (in-app browser, www vs apex, new tab, etc.). Looks up by TiQR booking uid
 * stored in details JSON.
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const uid = searchParams.get('uid')?.trim();

    if (!uid) {
      return NextResponse.json(
        { success: false, message: 'uid query required' },
        { status: 400 }
      );
    }

    const supabase = createServerSupabase();

    const { data, error } = await supabase
      .from('registrations')
      .select('email, workshop_ids, details, status, payment_status')
      .filter('details->>tiqr_booking_uid', 'eq', uid)
      .maybeSingle();

    if (error) {
      console.error('[registration-by-tiqr]', error);
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { success: false, message: 'No registration found for this booking' },
        { status: 404 }
      );
    }

    if (
      data.status !== 'confirmed' ||
      data.payment_status !== 'paid'
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Registration not completed for this booking',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('[registration-by-tiqr]', err);
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}
