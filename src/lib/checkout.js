// Shared TiQR checkout helper — same request/localStorage/redirect shape the
// online-workshops page uses, so payment-success and the webhook can consume
// bookings started from /cart the same way.

// Single-use keys written by startTiqrCheckout below and consumed exactly
// once by /payment-success — exported so both sides clear the same list and
// never leave stale ticket data sitting in localStorage after use.
export const CHECKOUT_STORAGE_KEYS = [
  'registration_email',
  'selected_workshops',
  'registration_details',
  'tiqr_booking_uid',
];

/**
 * TiQR puts the checkout link in different places for single vs bulk responses.
 * @param {object} data
 * @param {string[]} [excludeUrls] - values to ignore (e.g. the callback_url we
 *   sent, which TiQR echoes back and which otherwise matches the url-key fallback)
 */
export function pickTiqrPaymentUrl(data, excludeUrls = []) {
  if (!data || typeof data !== 'object') return '';

  const ok = (u) =>
    typeof u === 'string' &&
    (u.startsWith('https://') || u.startsWith('http://')) &&
    u.length > 10;

  const candidates = [
    data.url_to_redirect,
    data.urlToRedirect,
    data.redirect_url,
    data.payment_url,
    data.checkout_url,
    data.pay_url,
    data.payment?.url_to_redirect,
    data.payment?.payment_url,
    data.payment?.url,
    data.booking?.payment?.url_to_redirect,
    data.booking?.payment_url,
  ];

  for (const u of candidates) {
    if (ok(u)) return u;
  }

  if (Array.isArray(data.bookings)) {
    for (const b of data.bookings) {
      const u = b?.payment?.url_to_redirect || b?.payment_url || b?.url_to_redirect;
      if (ok(u)) return u;
    }
  }

  // Fallback: TiQR has moved the checkout link before without notice, so scan
  // the whole payload for any string under a url/link/redirect-ish key.
  // Exclude "callback"-ish keys and the callback_url we sent, since TiQR
  // echoes the request back and that is NOT the payment gateway link.
  const urlKeyPattern = /url|link|redirect/i;
  const callbackKeyPattern = /callback/i;
  const seen = new Set();
  const stack = [data];
  while (stack.length) {
    const node = stack.pop();
    if (!node || typeof node !== 'object' || seen.has(node)) continue;
    seen.add(node);
    for (const [key, value] of Object.entries(node)) {
      if (
        typeof value === 'string' &&
        urlKeyPattern.test(key) &&
        !callbackKeyPattern.test(key) &&
        !excludeUrls.includes(value) &&
        ok(value)
      ) {
        return value;
      }
      if (value && typeof value === 'object') stack.push(value);
    }
  }

  return '';
}

/**
 * Books one line per cart item and redirects the browser to TiQR's hosted
 * payment page. Throws with a user-facing message on failure.
 *
 * @param {Array<{id:string, kind:string, ticketId:number, title:string}>} cartItems
 * @param {{ name:string, email:string, phone:string, college?:string, city?:string, userId?:string }} details
 */
export async function startTiqrCheckout(cartItems, details) {
  const callback_url = `${window.location.origin}/payment-success`;

  const metaBase = (extra) => ({
    name: details.name,
    email: details.email,
    phone: details.phone,
    college: details.college || '',
    city: details.city || '',
    gender: details.gender || '',
    user_id: details.userId || '',
    is_new_registration: 'true',
    ...extra,
  });

  const bookings = cartItems.map((item) => ({
    first_name: details.name,
    email: details.email,
    phone_number: details.phone,
    ticket: item.ticketId,
    quantity: item.qty || 1,
    meta_data: metaBase({
      internal_id: item.id,
      workshop_ids: item.id,
      catalog_kind: item.kind,
    }),
  }));

  const body =
    bookings.length > 1
      ? { bookings, callback_url }
      : { ...bookings[0], callback_url };

  const res = await fetch('/api/tiqr', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(
      data?.message || data?.detail || 'We could not start payment. Please try again.'
    );
  }

  const redirectUrl = pickTiqrPaymentUrl(data, [callback_url]);

  const finalUid =
    bookings.length > 1 ? data.uid : data.booking?.uid || data.uid || '';

  // Free (₹0) tickets come back from TiQR already `status: 'confirmed'`
  // with an empty `payment` object — there is no checkout page to send the
  // user to. Only treat a missing link as a real failure otherwise.
  const isAlreadyConfirmed =
    bookings.length > 1
      ? Array.isArray(data.bookings) &&
        data.bookings.length > 0 &&
        data.bookings.every((b) => String(b?.status || '').toLowerCase() === 'confirmed')
      : String(data.booking?.status || data.status || '').toLowerCase() === 'confirmed';

  if (!redirectUrl && !isAlreadyConfirmed) {
    console.error('[TiQR] no checkout link found in response', data);
    throw new Error('Payment started but no checkout link was returned. Please try again.');
  }

  window.localStorage.setItem('registration_email', details.email);
  window.localStorage.setItem(
    'selected_workshops',
    JSON.stringify(cartItems.map((i) => i.id))
  );
  window.localStorage.setItem('registration_details', JSON.stringify(details));
  window.localStorage.setItem('tiqr_booking_uid', finalUid || '');

  window.location.href = redirectUrl
    ? redirectUrl
    : `${window.location.origin}/payment-success?uid=${encodeURIComponent(finalUid)}`;
}
