import { NextResponse } from 'next/server';
import { createServerSupabase } from '../../_supabase-server';
import { getTiqrBookingByUid } from '@/lib/tiqr';

/**
 * TiQR webhook: only upsert when booking_status is confirmed.
 * Registration fields are read from booking meta_data + email on the booking.
 *
 * A bulk checkout (multiple cart items booked together, e.g. a workshop plus
 * accommodation/food) can notify us with several bookings in one call. Accept
 * every shape we've seen or might see: a single top-level booking, a
 * `bookings` array, or the whole payload being an array.
 */
function extractBookingNotifications(body) {
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.bookings)) return body.bookings;
  return [body];
}

async function processBookingNotification(supabase, notification) {
  const meta = notification?.meta_data || notification?.metadata || {};

  const bookingUid =
    notification?.booking_uid ||
    notification?.uid ||
    meta.booking_uid ||
    meta.bookingUid ||
    '';

  const bookingStatus = String(
    notification?.booking_status ||
      notification?.status ||
      meta.booking_status ||
      meta.bookingStatus ||
      ''
  ).toLowerCase();

  if (!bookingUid) {
    return { saved: false, reason: 'no_booking_uid' };
  }

  if (bookingStatus && bookingStatus !== 'confirmed') {
    return { saved: false, reason: bookingStatus, bookingUid };
  }

  const booking = await getTiqrBookingByUid(bookingUid);
  const tiqrStatus = String(booking.status || '').toLowerCase();

  if (tiqrStatus !== 'confirmed') {
    return { saved: false, reason: `tiqr_status_${tiqrStatus}`, bookingUid };
  }

  const email = (booking.email || '').trim().toLowerCase();
  if (!email) {
    return { saved: false, reason: 'no_email', bookingUid };
  }

  const bookingMeta = booking.meta_data || {};
  const workshopRaw = bookingMeta.workshop_ids || bookingMeta.internal_id || '';

  const workshopIds = Array.isArray(workshopRaw)
    ? workshopRaw
    : String(workshopRaw)
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean);

  const { data: existing } = await supabase
    .from('registrations')
    .select('workshop_ids, details, user_id, amount')
    .eq('email', email)
    .maybeSingle();

  let existingIds = [];
  if (existing?.workshop_ids) {
    existingIds = Array.isArray(existing.workshop_ids) ? existing.workshop_ids : [];
  }

  const finalWorkshopIds = [...new Set([...existingIds, ...workshopIds])];

  const existingDetails =
    existing?.details && typeof existing.details === 'object' ? existing.details : {};
  const existingItemsPaid = Array.isArray(existingDetails.items_paid)
    ? existingDetails.items_paid
    : [];

  // Every paid item — including a genuinely ₹0 (free/comped) one — is
  // recorded as its own line so nothing is lost and amounts never get
  // clobbered on a bulk multi-item checkout (each notification here is one
  // cart line; the webhook can fire once per line for the same email).
  const itemAmount = Number(booking.ticket?.amount ?? 0) || 0;
  let itemDates = [];
  if (bookingMeta.item_dates) {
    try {
      const parsed = JSON.parse(bookingMeta.item_dates);
      if (Array.isArray(parsed)) itemDates = parsed;
    } catch {
      // ignore malformed payload, leave dates empty for later resolution
    }
  }
  const thisBookingUid = booking.uid || bookingUid;
  const alreadyRecorded = existingItemsPaid.some((i) => i.booking_uid === thisBookingUid);

  const newItemsPaid = alreadyRecorded
    ? existingItemsPaid
    : [
        ...existingItemsPaid,
        ...workshopIds.map((id) => ({
          internal_id: id,
          booking_uid: thisBookingUid,
          booking_id: booking.booking_id || '',
          qty: Number(bookingMeta.qty) || 1,
          amount: itemAmount,
          dates: itemDates,
          needs_day_selection:
            ['breakfast', 'lunch', 'dinner', 'accommodation'].includes(id) &&
            itemDates.length === 0 &&
            (Number(bookingMeta.qty) || 1) > 0,
          recorded_at: new Date().toISOString(),
        })),
      ];

  const finalAmount = alreadyRecorded
    ? existing?.amount ?? 0
    : (existing?.amount || 0) + itemAmount;

  const details = {
    ...existingDetails,
    ...bookingMeta,
    items_paid: newItemsPaid,
    tiqr_booking_uid: thisBookingUid,
    tiqr_booking_id: String(booking.id || ''),
    tiqr_participant_identification_id:
      booking.participant_identification_id || booking.booking_id || '',
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
        payment_id: thisBookingUid,
        order_id: booking.booking_id || '',
        amount: finalAmount,
        status: 'confirmed',
        payment_status: 'paid',
        updated_at: new Date().toISOString(),
      },
    ],
    { onConflict: 'email' }
  );

  if (error) {
    console.error('[tiqr/webhook] supabase', error);
    return { saved: false, reason: 'supabase_error', bookingUid, error: error.message };
  }

  return { saved: true, bookingUid, email, workshopIds };
}

export async function POST(req) {
  try {
    const body = await req.json();
    console.log('[tiqr/webhook] payload', JSON.stringify(body));

    const notifications = extractBookingNotifications(body);
    const supabase = createServerSupabase();

    const results = [];
    for (const notification of notifications) {
      try {
        const result = await processBookingNotification(supabase, notification);
        results.push(result);
      } catch (err) {
        console.error('[tiqr/webhook] notification failed', err);
        results.push({ saved: false, reason: 'exception', error: err.message });
      }
    }

    const anySaved = results.some((r) => r.saved);
    const anyErrored = results.some((r) => !r.saved && r.reason === 'supabase_error');

    return NextResponse.json(
      { received: true, saved: anySaved, results },
      { status: anyErrored ? 500 : 200 }
    );
  } catch (err) {
    console.error('[tiqr/webhook]', err);
    return NextResponse.json(
      { received: false, message: err.message },
      { status: 500 }
    );
  }
}
