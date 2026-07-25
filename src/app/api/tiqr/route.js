import { NextResponse } from 'next/server';
import { tiqrPost } from '@/lib/tiqr';

const TIQR_SINGLE = '/participant/booking/';
const TIQR_BULK = '/participant/booking/bulk/';

export async function POST(req) {
  try {
    const body = await req.json();

    if (process.env.NODE_ENV !== 'production') {
      console.log('[TiQR] proxy request', {
        hasBookings: Array.isArray(body?.bookings),
        bookingCount: body?.bookings?.length,
      });
    }

    let tiqrPath = TIQR_SINGLE;
    let tiqrPayload = body;

    if (Array.isArray(body.bookings) && body.bookings.length > 0) {
      const { callback_url, bookings } = body;
      if (bookings.length > 1) {
        tiqrPath = TIQR_BULK;
        tiqrPayload = { bookings, callback_url };
      } else {
        tiqrPayload = { ...bookings[0], callback_url };
      }
    }

    const response = await tiqrPost(tiqrPath, tiqrPayload);

    const contentType = response.headers.get('content-type');
    let data;

    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      console.error(
        'TiQR API returned non-JSON response:',
        text.substring(0, 500)
      );
      return NextResponse.json(
        {
          message: 'TiQR API returned invalid response',
          status: response.status,
          details: text.substring(0, 500),
        },
        { status: response.status }
      );
    }

    if (!response.ok) {
      console.error('[TiQR] upstream error', response.status, data);
      return NextResponse.json(data, { status: response.status });
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log('[TiQR] upstream ok', {
        keys: data && typeof data === 'object' ? Object.keys(data) : [],
      });
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error('Backend Fetch Error:', error);
    return NextResponse.json(
      { message: 'Server Connection Error', error: error.message },
      { status: 500 }
    );
  }
}
