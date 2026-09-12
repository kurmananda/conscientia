import { NextResponse } from 'next/server';
import { createServerSupabase } from '../_supabase-server';
import { verifyTiqrBookingConfirmed } from '@/lib/tiqr';

export async function POST(req) {
  try {
    const body = await req.json();

    console.log('SAVE BODY:', body);

    if (body.stage === 'pre_payment') {
      return NextResponse.json({
        success: true,
        skipped: true,
        message: 'Pre-payment records are not stored. Complete payment first.',
      });
    }

    const email = (body.email || '').trim();

    const newWorkshopIds = body.workshop_ids || '';

    const details = body.details || {};

    const user_id = body.user_id || details.userId || details.user_id || null;

    const tiqr_booking_uid =
      body.tiqr_booking_uid || details.tiqr_booking_uid || '';

    const tiqr_booking_id =
      body.tiqr_booking_id || details.tiqr_booking_id || '';

    const tiqr_participant_identification_id =
      body.tiqr_participant_identification_id ||
      details.tiqr_participant_identification_id ||
      '';

    const payment_id = body.payment_id || '';

    const order_id = body.order_id || '';

    const amount = body.amount ?? 0;

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email missing' },
        { status: 400 }
      );
    }

    if (tiqr_booking_uid) {
      const { confirmed, status } =
        await verifyTiqrBookingConfirmed(tiqr_booking_uid);

      if (!confirmed) {
        return NextResponse.json(
          {
            success: false,
            message: `Payment not confirmed with TiQR (status: ${status || 'unknown'}). Registration was not saved.`,
          },
          { status: 402 }
        );
      }
    }

    const registrationDetails = { ...details };

    if (tiqr_booking_uid) {
      registrationDetails.tiqr_booking_uid = tiqr_booking_uid;
    }

    if (tiqr_booking_id) {
      registrationDetails.tiqr_booking_id = tiqr_booking_id;
    }

    if (tiqr_participant_identification_id) {
      registrationDetails.tiqr_participant_identification_id =
        tiqr_participant_identification_id;
    }

    const supabase = createServerSupabase();

    const { data: existingUser } = await supabase
      .from('registrations')
      .select('*')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    const finalUserId = user_id || existingUser?.user_id || null;

    let existingIds = [];

    if (existingUser?.workshop_ids) {
      existingIds = Array.isArray(existingUser.workshop_ids)
        ? existingUser.workshop_ids
        : [];
    }

    const incomingIds = Array.isArray(newWorkshopIds)
      ? newWorkshopIds
      : String(newWorkshopIds)
          .split(',')
          .map((id) => id.trim())
          .filter(Boolean);

    const finalWorkshopIds = [...new Set([...existingIds, ...incomingIds])];

    // Per-item breakdown (qty/price/dates) from the cart — /payment-success
    // forwards this since `workshop_ids` alone is just bare ids and loses
    // which festival days accommodation/food add-ons were booked for.
    const incomingItems = Array.isArray(body.items) ? body.items : [];
    const existingItemsPaid = Array.isArray(existingUser?.details?.items_paid)
      ? existingUser.details.items_paid
      : [];
    // Dedup against a retry/reload of the same confirmed payment — there's
    // no per-item booking id at this call site, so key on payment_id+item id.
    const seenBookingKeys = new Set(existingItemsPaid.map((i) => i.booking_uid).filter(Boolean));
    const newItems = incomingItems.filter((item) => !seenBookingKeys.has(`${payment_id}:${item.id}`));

    // Distribute the verified total across items lacking their own price
    // (older/partial payloads) rather than dropping it.
    const itemsWithKnownPrice = newItems.filter((i) => i.unitPrice != null);
    const itemsWithoutPrice = newItems.filter((i) => i.unitPrice == null);
    const knownTotal = itemsWithKnownPrice.reduce((sum, i) => sum + Number(i.unitPrice) * (Number(i.qty) || 1), 0);
    const remainder = Math.max(0, Number(amount) - knownTotal);
    const perUnknownShare = itemsWithoutPrice.length ? remainder / itemsWithoutPrice.length : 0;

    const DAY_TRACKED_IDS = new Set(['breakfast', 'lunch', 'dinner', 'accommodation']);
    const newItemsPaid = newItems.map((item) => {
      const qty = Number(item.qty) || 1;
      const itemAmount = item.unitPrice != null ? Number(item.unitPrice) * qty : perUnknownShare;
      const dates = Array.isArray(item.dates) ? item.dates : [];
      return {
        internal_id: item.id,
        title: item.title || item.id,
        booking_uid: `${payment_id}:${item.id}`,
        qty,
        amount: itemAmount,
        dates,
        needs_day_selection: DAY_TRACKED_IDS.has(item.id) && dates.length === 0 && qty > 0,
        recorded_at: new Date().toISOString(),
      };
    });

    const addedAmount = newItemsPaid.reduce((sum, i) => sum + i.amount, 0);
    // Amount is SUMMED, never overwritten — a bulk checkout with several
    // items paid together must not clobber whatever was already recorded
    // for this email (e.g. from an earlier separate purchase). If no
    // per-item breakdown was sent at all (older client bundle), fall back
    // to adding the verified total directly; if a breakdown WAS sent but
    // every item in it was already recorded (a reload/retry), add nothing.
    const finalAmount =
      (Number(existingUser?.amount) || 0) + (incomingItems.length > 0 ? addedAmount : Number(amount) || 0);

    if (newItemsPaid.length > 0) {
      registrationDetails.items_paid = [...existingItemsPaid, ...newItemsPaid];
    } else if (existingItemsPaid.length > 0 && !registrationDetails.items_paid) {
      registrationDetails.items_paid = existingItemsPaid;
    }

    const row = {
      email: email.toLowerCase(),
      user_id: finalUserId,
      workshop_ids: finalWorkshopIds,
      details: registrationDetails,
      payment_id,
      order_id,
      amount: finalAmount,
      status: 'confirmed',
      payment_status: 'paid',
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('registrations')
      .upsert([row], { onConflict: 'email' })
      .select();

    if (error) {
      console.log(error);
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.log(err);
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}
