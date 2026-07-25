'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useCart } from '../context/CartContext';

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={null}>
      <PaymentSuccessContent />
    </Suspense>
  );
}

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const { clear } = useCart();
  const [status, setStatus] = useState('verifying'); // verifying | success | failed
  const [message, setMessage] = useState('Confirming your payment…');

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
        const verifyRes = await fetch(`/api/tiqr/verify-booking?uid=${encodeURIComponent(uid)}`);
        const verifyData = await verifyRes.json();

        if (!verifyData.success || !verifyData.confirmed) {
          setStatus('failed');
          setMessage(`Payment not confirmed yet (status: ${verifyData.status || 'unknown'}).`);
          return;
        }

        const email = window.localStorage.getItem('registration_email') || verifyData.email || '';
        const workshopIds = JSON.parse(window.localStorage.getItem('selected_workshops') || '[]');
        const details = JSON.parse(window.localStorage.getItem('registration_details') || '{}');

        await fetch('/api/save-registration', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            workshop_ids: workshopIds,
            details,
            payment_id: uid,
            order_id: verifyData.booking_id || '',
            amount: verifyData.amount || 0,
          }),
        });

        clear();
        setStatus('success');
        setMessage('Your registration is confirmed.');
      } catch (err) {
        setStatus('failed');
        setMessage(err.message || 'Something went wrong confirming your payment.');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          {status === 'success' ? 'Payment Confirmed' : status === 'failed' ? 'Payment Pending' : 'Verifying…'}
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
