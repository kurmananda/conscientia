// Food Fest checkout — same TiQR proxy/redirect mechanics as
// src/lib/checkout.js's startTiqrCheckout, but food orders are distinct
// per-purchase rows (not merged like registrations), so we stash a full
// item snapshot in localStorage for /foodfest/payment-success to write.
import { pickTiqrPaymentUrl } from './checkout';

export const FOODFEST_STORAGE_KEYS = ['foodfest_pending_order', 'foodfest_tiqr_booking_uid'];

/**
 * @param {Array<{key:string, stallId:string, id:string, name:string, qty:number, unitPrice:number, ticketId:string}>} cartItems
 * @param {{ name:string, email:string, phone:string, userId:string }} details
 */
export async function startFoodfestCheckout(cartItems, details) {
  const amount = cartItems.reduce((sum, i) => sum + (i.unitPrice || 0) * (i.qty || 1), 0);
  const orderSnapshot = {
    email: details.email,
    name: details.name,
    phone: details.phone,
    user_id: details.userId || null,
    items: cartItems.map((i) => ({
      stall_id: i.stallId,
      item_id: i.id,
      name: i.name,
      qty: i.qty || 1,
      price: i.unitPrice,
    })),
    amount,
  };

  // ₹0 items ("FREE" ticket sentinel) never go through TIQR — there's no
  // real ticket to book. Write the order straight away as already paid.
  if (amount === 0) {
    const uid = `free-${crypto.randomUUID()}`;
    const res = await fetch('/api/save-foodfest-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tiqr_booking_uid: uid, order: orderSnapshot, free: true }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
      throw new Error(data?.message || 'Could not place your free order. Please try again.');
    }
    return { free: true };
  }

  const callback_url = `${window.location.origin}/foodfest/payment-success`;

  const bookings = cartItems.map((item) => ({
    first_name: details.name,
    email: details.email,
    phone_number: details.phone,
    ticket: item.ticketId,
    quantity: item.qty || 1,
    meta_data: {
      name: details.name,
      email: details.email,
      phone: details.phone,
      user_id: details.userId || null,
      stall_id: item.stallId,
      item_id: item.id,
      item_name: item.name,
    },
  }));

  const body = bookings.length > 1 ? { bookings, callback_url } : { ...bookings[0], callback_url };

  const res = await fetch('/api/tiqr', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.message || data?.detail || 'We could not start payment. Please try again.');
  }

  const redirectUrl = pickTiqrPaymentUrl(data, [callback_url]);
  const finalUid = bookings.length > 1 ? data.uid : data.booking?.uid || data.uid || '';

  const isAlreadyConfirmed =
    bookings.length > 1
      ? Array.isArray(data.bookings) &&
        data.bookings.length > 0 &&
        data.bookings.every((b) => String(b?.status || '').toLowerCase() === 'confirmed')
      : String(data.booking?.status || data.status || '').toLowerCase() === 'confirmed';

  if (!redirectUrl && !isAlreadyConfirmed) {
    console.error('[Foodfest TiQR] no checkout link found in response', data);
    throw new Error('Payment started but no checkout link was returned. Please try again.');
  }

  window.localStorage.setItem('foodfest_pending_order', JSON.stringify(orderSnapshot));
  window.localStorage.setItem('foodfest_tiqr_booking_uid', finalUid || '');

  window.location.href = redirectUrl
    ? redirectUrl
    : `${window.location.origin}/foodfest/payment-success?uid=${encodeURIComponent(finalUid)}`;
}
