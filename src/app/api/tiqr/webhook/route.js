import { NextResponse } from 'next/server';
import { createServerSupabase } from '../../_supabase-server';
import { getTiqrBookingByUid } from '@/lib/tiqr';

/**
 * TiQR webhook: only upsert when booking_status is confirmed.
 * Registration fields are read from booking meta_data + email on the booking.
 */
export async function POST(req) {
  try {
    const body = await req.json();
    const meta = body.meta_data || body.metadata || {};

    const bookingUid = meta.booking_uid || meta.bookingUid || '';
    const bookingStatus = String(
      meta.booking_status || meta.bookingStatus || ''
    ).toLowerCase();

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

    const email = (booking.email || '').trim().toLowerCase();
    if (!email) {
      return NextResponse.json({ received: true, skipped: true, reason: 'no_email' }, { status: 200 });
    }

    const bookingMeta = booking.meta_data || {};
    const workshopRaw =
      bookingMeta.workshop_ids ||
      bookingMeta.internal_id ||
      '';

    const workshopIds = Array.isArray(workshopRaw)
      ? workshopRaw
      : String(workshopRaw)
          .split(',')
          .map((id) => id.trim())
          .filter(Boolean);

    const supabase = createServerSupabase();

    const { data: existing } = await supabase
      .from('registrations')
      .select('workshop_ids, details, user_id')
      .eq('email', email)
      .maybeSingle();

    let existingIds = [];
    if (existing?.workshop_ids) {
      existingIds = Array.isArray(existing.workshop_ids)
        ? existing.workshop_ids
        : [];
    }

    const finalWorkshopIds = [...new Set([...existingIds, ...workshopIds])];

    const details = {
      ...(existing?.details && typeof existing.details === 'object'
        ? existing.details
        : {}),
      ...bookingMeta,
      tiqr_booking_uid: booking.uid || bookingUid,
      tiqr_booking_id: String(booking.id || ''),
      tiqr_participant_identification_id:
        booking.participant_identification_id ||
        booking.booking_id ||
        '',
      name:
        bookingMeta.name ||
        [booking.first_name, booking.last_name].filter(Boolean).join(' ').trim(),
      phone: bookingMeta.phone || booking.phone_number || '',
    };

    const { error } = await supabase.from('registrations').upsert(
      [
        {
          email,
          user_id: bookingMeta.user_id || existing?.user_id || null,
          workshop_ids: finalWorkshopIds,
          details,
          payment_id: booking.uid || bookingUid,
          order_id: booking.booking_id || '',
          amount: booking.ticket?.amount ?? 0,
          status: 'confirmed',
          payment_status: 'paid',
          updated_at: new Date().toISOString(),
        },
      ],
      { onConflict: 'email' }
    );

    if (error) {
      console.error('[tiqr/webhook] supabase', error);
      return NextResponse.json(
        { received: false, message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ received: true, saved: true }, { status: 200 });
  } catch (err) {
    console.error('[tiqr/webhook]', err);
    return NextResponse.json(
      { received: false, message: err.message },
      { status: 500 }
    );
  }
}
