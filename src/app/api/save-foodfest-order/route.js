import { NextResponse } from 'next/server';
import { createServerSupabase } from '../_supabase-server';
import { verifyTiqrBookingConfirmed } from '@/lib/tiqr';

/**
 * Client-triggered dual-write after redirect back from TiQR, mirroring
 * save-registration/route.js: re-verifies with TiQR server-side before
 * writing, as a faster/redundant path alongside the webhook.
 */
export async function POST(req) {
  try {
    const body = await req.json();

    const uid = body.tiqr_booking_uid || '';
    if (!uid) {
      return NextResponse.json({ success: false, message: 'Booking UID missing' }, { status: 400 });
    }

    const order = body.order || {};
    const supabase = createServerSupabase();

    // ₹0 orders never went through TIQR (see startFoodfestCheckout) — the
    // "free-" uid prefix is generated client-side, never by TIQR, so real
    // paid orders can never collide with this bypass.
    const isFreeOrder = body.free === true && uid.startsWith('free-') && Number(order.amount) === 0;

    let booking = null;
    if (!isFreeOrder) {
      const { confirmed, status, booking: verifiedBooking } = await verifyTiqrBookingConfirmed(uid);
      if (!confirmed) {
        return NextResponse.json(
          { success: false, message: `Payment not confirmed with TiQR (status: ${status || 'unknown'}).` },
          { status: 402 }
        );
      }
      booking = verifiedBooking;
    }

    const row = {
      tiqr_booking_uid: booking?.uid || uid,
      email: (order.email || booking?.email || '').trim().toLowerCase(),
      name: order.name || '',
      phone: order.phone || '',
      user_id: order.user_id || null,
      items: Array.isArray(order.items) ? order.items : [],
      amount: order.amount ?? booking?.ticket?.amount ?? 0,
      payment_status: 'paid',
      order_status: 'pending',
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('foodfest_orders')
      .upsert([row], { onConflict: 'tiqr_booking_uid' })
      .select();

    if (error) {
      console.error('[save-foodfest-order]', error);
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('[save-foodfest-order]', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
