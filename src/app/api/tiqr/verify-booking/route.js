import { NextResponse } from 'next/server';
import { verifyTiqrBookingConfirmed } from '@/lib/tiqr';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const uid = searchParams.get('uid')?.trim();

    if (!uid) {
      return NextResponse.json(
        { success: false, message: 'uid query parameter required' },
        { status: 400 }
      );
    }

    const { confirmed, status, booking } = await verifyTiqrBookingConfirmed(uid);

    return NextResponse.json({
      success: true,
      confirmed,
      status,
      email: booking.email || '',
      booking_id: booking.booking_id || booking.participant_identification_id || '',
      amount: booking.ticket?.amount ?? booking.payment?.amount ?? null,
    });
  } catch (err) {
    console.error('[tiqr/verify-booking]', err);
    return NextResponse.json(
      {
        success: false,
        message: err instanceof Error ? err.message : 'Verification failed',
      },
      { status: 500 }
    );
  }
}
