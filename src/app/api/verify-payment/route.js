import { NextResponse } from 'next/server';

export async function GET(req) {

  try {

    const { searchParams } = new URL(req.url);

    const order_id = searchParams.get('order_id');

    // For TiQR bookings, return mock success since booking is already verified
    if (order_id && order_id.startsWith('order_')) {
      return NextResponse.json({
        order_status: 'PAID',
        cf_payment_id: `tiqr_${order_id}`,
        order_amount: 0 // Will be set from localStorage in save-registration
      });
    }

    // Original Cashfree verification for backward compatibility
    const response = await fetch(
      `https://sandbox.cashfree.com/pg/orders/${order_id}`,
      {
        method: 'GET',

        headers: {
          'x-client-id':
            process.env.CASHFREE_CLIENT_ID,

          'x-client-secret':
            process.env.CASHFREE_CLIENT_SECRET,

          'x-api-version': '2023-08-01',
        },
      }
    );

    const data = await response.json();

    return NextResponse.json(data);

  } catch (err) {

    return NextResponse.json(
      {
        message: err.message,
      },
      {
        status: 500,
      }
    );
  }
}