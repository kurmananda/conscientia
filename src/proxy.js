import { NextResponse } from 'next/server';

/**
 * The payment gateway sometimes returns the user to our callback_url with a
 * form POST instead of a GET. /payment-success is a static page, so Vercel
 * answers a POST with 405 and the browser shows "This page isn't working".
 * Turn it into a 303 GET redirect, carrying any posted fields (e.g. the
 * booking uid) across as query params.
 */
export async function proxy(request) {
  if (request.method !== 'POST') return NextResponse.next();

  const url = request.nextUrl.clone();
  try {
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const body = await request.json();
      for (const [key, value] of Object.entries(body || {})) {
        if (typeof value === 'string' || typeof value === 'number') {
          if (!url.searchParams.has(key)) url.searchParams.set(key, String(value));
        }
      }
    } else if (
      contentType.includes('application/x-www-form-urlencoded') ||
      contentType.includes('multipart/form-data')
    ) {
      const form = await request.formData();
      for (const [key, value] of form.entries()) {
        if (typeof value === 'string' && !url.searchParams.has(key)) {
          url.searchParams.set(key, value);
        }
      }
    }
  } catch {
    // Unreadable body — the page falls back to the uid saved in localStorage.
  }

  return NextResponse.redirect(url, 303);
}

export const config = {
  matcher: ['/payment-success', '/foodfest/payment-success'],
};
