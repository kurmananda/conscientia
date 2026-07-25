const TIQR_BASE = 'https://api.tiqr.events';

/**
 * Fetch booking by UID from TiQR (no auth — public participant booking endpoint).
 * @param {string} uid
 */
export async function getTiqrBookingByUid(uid) {
  const trimmed = String(uid || '').trim();
  if (!trimmed) {
    throw new Error('Booking UID is required');
  }

  const url = `${TIQR_BASE}/participant/booking/${encodeURIComponent(trimmed)}/`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(
      data.message || data.detail || `TiQR booking lookup failed (${res.status})`
    );
  }

  return data;
}

/**
 * @param {string} uid
 * @returns {Promise<{ confirmed: boolean, status: string, booking: object }>}
 */
export async function verifyTiqrBookingConfirmed(uid) {
  const booking = await getTiqrBookingByUid(uid);
  const status = String(booking.status || '').toLowerCase();

  return {
    confirmed: status === 'confirmed',
    status,
    booking,
  };
}

/**
 * POST with redirect handling (TiQR often 301s bulk URL). No auth required.
 * @param {string} path
 * @param {object} payload
 */
export async function tiqrPost(path, payload) {
  const url = path.startsWith('http') ? path : `${TIQR_BASE}${path}`;
  const body = JSON.stringify(payload);
  const headers = { 'Content-Type': 'application/json' };
  const init = { method: 'POST', headers, body, redirect: 'manual' };

  let currentUrl = url;
  for (let hop = 0; hop < 5; hop += 1) {
    const res = await fetch(currentUrl, init);
    if (res.status < 300 || res.status >= 400) {
      return res;
    }
    const loc = res.headers.get('location');
    if (!loc) {
      return res;
    }
    currentUrl = new URL(loc, currentUrl).href;
  }

  return fetch(currentUrl, {
    method: 'POST',
    headers,
    body,
  });
}
