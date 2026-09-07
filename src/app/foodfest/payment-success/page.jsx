'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useCart } from '../../context/CartContext';
import { FOODFEST_STORAGE_KEYS } from '@/lib/foodfestCheckout';

export default function FoodfestPaymentSuccessPage() {
  return (
    <Suspense fallback={null}>
      <FoodfestPaymentSuccessContent />
    </Suspense>
  );
}

function FoodfestPaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { items, removeItem } = useCart();
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('Confirming your payment…');

  useEffect(() => {
    if (status !== 'success') return;
    const timer = setTimeout(() => router.push('/foodfest'), 1400);
    return () => clearTimeout(timer);
  }, [status, router]);

  useEffect(() => {
    const uid =
      searchParams.get('uid') ||
      searchParams.get('booking_uid') ||
      window.localStorage.getItem('foodfest_tiqr_booking_uid') ||
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

        const order = JSON.parse(window.localStorage.getItem('foodfest_pending_order') || '{}');
        FOODFEST_STORAGE_KEYS.forEach((key) => window.localStorage.removeItem(key));

        await fetch('/api/save-foodfest-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tiqr_booking_uid: uid, order }),
        });

        const foodItems = items.filter((item) => item.kind === 'food');
        await Promise.all(foodItems.map((item) => removeItem(item.key)));

        setStatus('success');
        setMessage('Your order is confirmed! Head to the stall to collect it.');
      } catch (err) {
        setStatus('failed');
        setMessage(err.message || 'Something went wrong confirming your payment.');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === 'success') {
    return (
      <div className="relative min-h-[calc(100dvh-12rem)] bg-[#0a0604] text-white overflow-hidden flex items-center justify-center">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(255,107,53,0.15),transparent_55%)]" />
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 16 }}
          className="relative z-10 text-center"
        >
          <div className="text-6xl mb-4">🎉</div>
          <p className="text-white/70">{message}</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100dvh-12rem)] bg-[#0a0604] text-white overflow-hidden flex items-center justify-center">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(255,107,53,0.15),transparent_55%)]" />
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 max-w-md px-6 text-center"
      >
        <p className="font-mono text-[10px] uppercase tracking-[0.45em] text-orange-400/90 mb-4">
          Food Fest
        </p>
        <h1 className="text-3xl md:text-4xl font-bold uppercase tracking-tighter mb-6">
          {status === 'failed' ? 'Payment Pending' : 'Verifying…'}
        </h1>
        <p className="text-white/60 mb-8">{message}</p>
        <Link
          href="/foodfest"
          className="inline-flex items-center gap-2 rounded-full bg-orange-400 px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-black hover:bg-white transition-colors"
        >
          Back to Food Fest →
        </Link>
      </motion.div>
    </div>
  );
}
