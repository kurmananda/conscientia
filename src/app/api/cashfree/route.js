import { NextResponse } from 'next/server';
import { Cashfree } from 'cashfree-pg';

Cashfree.XClientId =
  process.env.CASHFREE_CLIENT_ID;

Cashfree.XClientSecret =
  process.env.CASHFREE_CLIENT_SECRET;

Cashfree.XEnvironment = 0;

export async function POST(req) {

  try {

    const body = await req.json();

    // AUTO-DETECT BASE URL FROM REQUEST
    const url = new URL(req.url);
    const baseUrl = `${url.protocol}//${url.host}`;

    const {
      customer_id,
      customer_phone,
      customer_email,
      customer_name,
      order_amount,
      metadata
    } = body;

    const order_id =
      `order_${Date.now()}`;

    const requestData = {

      order_amount,

      order_currency: 'INR',

      order_id,

      customer_details: {

        customer_id:
          String(customer_id),

        customer_name:
          String(customer_name),

        customer_email:
          String(customer_email),

        customer_phone:
          String(customer_phone)
      },

      order_meta: {

        return_url:
          `${baseUrl}/payment-success?order_id=${order_id}`
      },

      order_tags: metadata
    };

    let response;

    if (
      typeof Cashfree.PGCreateOrder
      === 'function'
    ) {

      response =
        await Cashfree.PGCreateOrder(
          '2023-08-01',
          requestData
        );

    } else {

      const url =
        Cashfree.XEnvironment === 0
          ? 'https://sandbox.cashfree.com/pg/orders'
          : 'https://api.cashfree.com/pg/orders';

      const res = await fetch(url, {

        method: 'POST',

        headers: {

          'x-client-id':
            Cashfree.XClientId,

          'x-client-secret':
            Cashfree.XClientSecret,

          'x-api-version':
            '2023-08-01',

          'Content-Type':
            'application/json'
        },

        body: JSON.stringify(
          requestData
        )
      });

      const data =
        await res.json();

      if (!res.ok) {

        throw new Error(
          data.message ||
          'Cashfree API Error'
        );
      }

      response = { data };
    }

    return NextResponse.json({

      ...response.data,

      order_id
    });

  } catch (error) {

    console.error(error);

    return NextResponse.json(
      {
        message:
          error.message ||
          'Payment initiation failed'
      },
      { status: 500 }
    );
  }
}