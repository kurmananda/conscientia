'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import useProfile from '../hooks/useProfile';
import usePaymentReminder from '../hooks/usePaymentReminder';
import PrePaymentReminderModal from '../components/PrePaymentReminderModal';
import { startTiqrCheckout } from '@/lib/checkout';

export default function CartPage() {
  const { user, loading } = useAuth();
  const { items, removeItem, clear } = useCart();
  const { profile } = useProfile();
  const { guard, modalProps } = usePaymentReminder();
  const [form, setForm] = useState({ name: '', phone: '', college: '', city: '', gender: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!profile) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm({
      name: profile.name || '',
      phone: profile.phone || '',
      college: profile.college || '',
      city: profile.city || '',
      gender: profile.gender || '',
    });
  }, [profile]);

  const runCheckout = async () => {
    setError('');
    setBusy(true);
    try {
      await startTiqrCheckout(items, {
        name: form.name.trim(),
        email: user.email,
        phone: form.phone.trim(),
        college: form.college.trim(),
        city: form.city.trim(),
        gender: form.gender || '',
        userId: user.id,
      });
      // startTiqrCheckout redirects the browser on success; nothing left to do.
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  const handleCheckout = (e) => {
    e.preventDefault();
    guard(runCheckout);
  };

  return (
    <div className="relative min-h-[calc(100dvh-12rem)] bg-[#030508] text-white overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(6,182,212,0.12),transparent_55%)]" />
      <div className="relative z-10 mx-auto max-w-3xl px-6 pt-28 pb-24 md:pt-32">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-mono text-[10px] uppercase tracking-[0.45em] text-cyan-400/90 mb-4"
        >
          Conscientia 2026
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-syncopate text-4xl md:text-6xl font-bold uppercase tracking-tighter leading-[0.95] mb-10"
        >
          Your Cart
        </motion.h1>

        {loading ? null : !user ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
            <p className="text-white/60 mb-4">Sign in to check out your cart.</p>
            <Link
              href="/login?redirect=/cart"
              className="inline-flex items-center gap-2 rounded-full bg-cyan-400 px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-black hover:bg-white transition-colors"
            >
              Sign In / Create Account
            </Link>
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center">
            <p className="text-white/40 mb-4">Your cart is empty.</p>
            <div className="flex justify-center gap-4">
              <Link href="/workshop" className="text-cyan-400 text-xs font-bold uppercase tracking-[0.2em] hover:underline">
                Browse Workshops →
              </Link>
              <Link href="/events" className="text-cyan-400 text-xs font-bold uppercase tracking-[0.2em] hover:underline">
                Browse Events →
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-8 space-y-3">
              {items.map((item) => (
                <div
                  key={item.key}
                  className="flex items-center gap-4 rounded-xl border p-3"
                  style={{ borderColor: `${item.accentColor || '#22d3ee'}33` }}
                >
                  {item.image && (
                    <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg">
                      <Image src={item.image} alt={item.title} fill className="object-cover" sizes="56px" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{item.title}</p>
                    <p className="text-xs text-white/40">{item.priceLabel}</p>
                  </div>
                  <button
                    onClick={() => removeItem(item.key)}
                    className="text-white/30 hover:text-red-400 text-sm px-2"
                    aria-label="Remove"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <form
              onSubmit={handleCheckout}
              className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6"
            >
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">
                Registrant Details
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  required
                  placeholder="Full Name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="rounded-lg border border-white/15 bg-black/40 px-4 py-2.5 text-sm outline-none focus:border-cyan-500/60"
                />
                <input
                  required
                  placeholder="Phone Number"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="rounded-lg border border-white/15 bg-black/40 px-4 py-2.5 text-sm outline-none focus:border-cyan-500/60"
                />
                <input
                  placeholder="College / Institution"
                  value={form.college}
                  onChange={(e) => setForm({ ...form, college: e.target.value })}
                  className="rounded-lg border border-white/15 bg-black/40 px-4 py-2.5 text-sm outline-none focus:border-cyan-500/60"
                />
                <input
                  placeholder="City"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="rounded-lg border border-white/15 bg-black/40 px-4 py-2.5 text-sm outline-none focus:border-cyan-500/60"
                />
                <select
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  className="rounded-lg border border-white/15 bg-black/40 px-4 py-2.5 text-sm outline-none focus:border-cyan-500/60"
                >
                  <option value="">Gender (optional)</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="rather_not_say">Neutral</option>
                </select>
              </div>

              {error && (
                <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-full bg-cyan-400 px-6 py-3 text-[11px] font-black uppercase tracking-[0.2em] text-black transition-colors hover:bg-white disabled:opacity-50"
              >
                {busy ? 'Starting payment…' : `Pay & Register (${items.length} item${items.length > 1 ? 's' : ''})`}
              </button>
            </form>
          </>
        )}
      </div>
      <PrePaymentReminderModal {...modalProps} />
    </div>
  );
}
