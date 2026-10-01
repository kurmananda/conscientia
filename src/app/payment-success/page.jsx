'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { CHECKOUT_STORAGE_KEYS } from '@/lib/checkout';

// TiQR often still reports the booking as pending for a few seconds after
// the gateway redirects back, so poll instead of giving up on the first
// check (which left paid users unregistered with everything still in cart).
const VERIFY_ATTEMPTS = 20;
const VERIFY_INTERVAL_MS = 3000;
const TERMINAL_FAILURE_STATUSES = ['failed', 'cancelled', 'canceled', 'expired', 'rejected'];

async function verifyBooking(uid) {
  let last = { status: 'unknown' };
  for (let attempt = 0; attempt < VERIFY_ATTEMPTS; attempt += 1) {
    try {
      const res = await fetch(`/api/tiqr/verify-booking?uid=${encodeURIComponent(uid)}`);
      const data = await res.json();
      if (data.success && data.confirmed) return data;
      last = data;
      if (TERMINAL_FAILURE_STATUSES.includes(data.status)) return data;
    } catch {
      // Transient network/5xx — keep polling.
    }
    await new Promise((resolve) => setTimeout(resolve, VERIFY_INTERVAL_MS));
  }
  return last;
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={null}>
      <PaymentSuccessContent />
    </Suspense>
  );
}

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { refreshRegistered } = useCart();
  const [status, setStatus] = useState('verifying'); // verifying | success | failed
  const [message, setMessage] = useState('Confirming your payment…');

  useEffect(() => {
    if (status !== 'success') return;
    const timer = setTimeout(() => router.push('/profile'), 1400);
    return () => clearTimeout(timer);
  }, [status, router]);

  useEffect(() => {
    const uid =
      searchParams.get('uid') ||
      searchParams.get('booking_uid') ||
      window.localStorage.getItem('tiqr_booking_uid') ||
      '';

    if (!uid) {
      setStatus('failed');
      setMessage('No booking reference found. If you completed payment, check your email for confirmation.');
      return;
    }

    (async () => {
      try {
        const verifyData = await verifyBooking(uid);

        if (!verifyData.success || !verifyData.confirmed) {
          setStatus('failed');
          setMessage(
            TERMINAL_FAILURE_STATUSES.includes(verifyData.status)
              ? `Payment was not completed (status: ${verifyData.status}).`
              : 'Your payment is still being processed. It will appear on your profile once confirmed — you do not need to pay again.'
          );
          return;
        }

        const email = window.localStorage.getItem('registration_email') || verifyData.email || '';
        const workshopIds = JSON.parse(window.localStorage.getItem('selected_workshops') || '[]');
        const itemsMeta = JSON.parse(window.localStorage.getItem('selected_workshops_meta') || '[]');
        const details = JSON.parse(window.localStorage.getItem('registration_details') || '{}');

        const saveRes = await fetch('/api/save-registration', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            workshop_ids: workshopIds,
            items: itemsMeta,
            details,
            payment_id: uid,
            order_id: verifyData.booking_id || '',
            amount: verifyData.amount || 0,
          }),
        });
        const saveData = await saveRes.json().catch(() => ({}));
        if (!saveRes.ok || !saveData.success) {
          // Keep the checkout data so reloading this page retries the save.
          throw new Error(
            saveData.message ||
              'Your payment went through but we could not save your registration. Please reload this page.'
          );
        }

        // Single-use — clear only once the save has succeeded so this data
        // can't leak into a later checkout, but a failed save can retry.
        CHECKOUT_STORAGE_KEYS.forEach((key) => window.localStorage.removeItem(key));
        // CartContext prunes paid items once it sees the new registration.
        refreshRegistered();
        setStatus('success');
        setMessage('Your registration is confirmed.');
      } catch (err) {
        setStatus('failed');
        setMessage(err.message || 'Something went wrong confirming your payment.');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === 'success') {
    return (
      <div className="relative min-h-[calc(100dvh-12rem)] bg-[#030508] text-white overflow-hidden flex items-center justify-center">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(6,182,212,0.12),transparent_55%)]" />
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 16 }}
          className="relative z-10 flex h-28 w-28 items-center justify-center"
        >
          <svg viewBox="0 0 64 64" className="h-28 w-28">
            <motion.circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke="#22d3ee"
              strokeWidth="3"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
            <motion.path
              d="M20 33.5L28 41.5L44 24.5"
              fill="none"
              stroke="#22d3ee"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.4, ease: 'easeOut', delay: 0.5 }}
            />
          </svg>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100dvh-12rem)] bg-[#030508] text-white overflow-hidden flex items-center justify-center">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(6,182,212,0.12),transparent_55%)]" />
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 max-w-md px-6 text-center"
      >
        <p className="font-mono text-[10px] uppercase tracking-[0.45em] text-cyan-400/90 mb-4">
          Conscientia 2026
        </p>
        <h1 className="font-syncopate text-3xl md:text-4xl font-bold uppercase tracking-tighter mb-6">
          {status === 'failed' ? 'Payment Pending' : 'Verifying…'}
        </h1>
        <p className="text-white/60 mb-8">{message}</p>
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 rounded-full bg-cyan-400 px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-black hover:bg-white transition-colors"
        >
          Go to Profile →
        </Link>
      </motion.div>
    </div>
  );
}
