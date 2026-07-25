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

    const row = {
      email: email.toLowerCase(),
      user_id: finalUserId,
      workshop_ids: finalWorkshopIds,
      details: registrationDetails,
      payment_id,
      order_id,
      amount,
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
