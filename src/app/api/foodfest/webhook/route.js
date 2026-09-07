import { NextResponse } from 'next/server';
import { createServerSupabase } from '../../_supabase-server';
import { getTiqrBookingByUid } from '@/lib/tiqr';

/**
 * TiQR webhook for Food Fest orders. Unlike registrations (one row per
 * email, merged), every order is its own row — a person can order food
 * many times — so we upsert keyed by tiqr_booking_uid (idempotent against
 * webhook retries) instead of merging by email.
 */
export async function POST(req) {
  try {
    const body = await req.json();
    const meta = body.meta_data || body.metadata || {};

    const bookingUid = meta.booking_uid || meta.bookingUid || '';
    const bookingStatus = String(meta.booking_status || meta.bookingStatus || '').toLowerCase();

    if (!bookingUid) {
      return NextResponse.json({ received: true }, { status: 200 });
    }

    if (bookingStatus !== 'confirmed') {
      return NextResponse.json(
        { received: true, skipped: true, reason: bookingStatus || 'not_confirmed' },
        { status: 200 }
      );
    }

    const booking = await getTiqrBookingByUid(bookingUid);
    const tiqrStatus = String(booking.status || '').toLowerCase();

    if (tiqrStatus !== 'confirmed') {
      return NextResponse.json(
        { received: true, skipped: true, reason: `tiqr_status_${tiqrStatus}` },
        { status: 200 }
      );
    }

    const bookingMeta = booking.meta_data || {};
    const supabase = createServerSupabase();

    const { error } = await supabase.from('foodfest_orders').upsert(
      [
        {
          tiqr_booking_uid: booking.uid || bookingUid,
          email: (booking.email || bookingMeta.email || '').trim().toLowerCase(),
          name: bookingMeta.name || [booking.first_name, booking.last_name].filter(Boolean).join(' ').trim(),
          phone: bookingMeta.phone || booking.phone_number || '',
          user_id: bookingMeta.user_id || null,
          items: [
            {
              stall_id: bookingMeta.stall_id || '',
              item_id: bookingMeta.item_id || '',
              name: bookingMeta.item_name || '',
              qty: booking.ticket?.quantity ?? 1,
              price: booking.ticket?.amount ?? 0,
            },
          ],
          amount: booking.ticket?.amount ?? 0,
          payment_status: 'paid',
          order_status: 'pending',
          updated_at: new Date().toISOString(),
        },
      ],
      { onConflict: 'tiqr_booking_uid' }
    );

    if (error) {
      console.error('[foodfest/webhook] supabase', error);
      return NextResponse.json({ received: false, message: error.message }, { status: 500 });
    }

    return NextResponse.json({ received: true, saved: true }, { status: 200 });
  } catch (err) {
    console.error('[foodfest/webhook]', err);
    return NextResponse.json({ received: false, message: err.message }, { status: 500 });
  }
}
