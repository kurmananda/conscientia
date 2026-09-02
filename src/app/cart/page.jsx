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
  const { profile, save } = useProfile();
  const { guard, modalProps } = usePaymentReminder();
  const [form, setForm] = useState({ name: '', phone: '', college: '', collegeId: '', aadhaarNumber: '', city: '', gender: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!profile) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm({
      name: profile.name || '',
      phone: profile.phone || '',
      college: profile.college || '',
      collegeId: profile.college_id || '',
      aadhaarNumber: profile.aadhaar_number || '',
      city: profile.city || '',
      gender: profile.gender || '',
    });
  }, [profile]);

  const runCheckout = async () => {
    setError('');
    if (!form.collegeId.trim() || !form.aadhaarNumber.trim()) {
      setError('College ID and Aadhaar number are required.');
      return;
    }
    if (!/^\d{12}$/.test(form.aadhaarNumber.trim())) {
      setError('Aadhaar number must be exactly 12 digits.');
      return;
    }
    if (!form.gender) {
      setError('Please select a gender to continue.');
      return;
    }
    setBusy(true);
    try {
      // This form only ever fed TiQR's checkout payload — it never wrote
      // back to the actual profiles row, so someone filling name/phone/
      // college/gender here (instead of on /profile) would see /profile
      // still treat those as missing and re-open edit mode. Persist
      // whatever changed here too, same fields useProfile().save() accepts
      // elsewhere, so this stays in sync going forward.
      const trimmed = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        college: form.college.trim(),
        college_id: form.collegeId.trim(),
        aadhaar_number: form.aadhaarNumber.trim(),
        city: form.city.trim(),
        gender: form.gender,
      };
      const changed =
        !profile ||
        trimmed.name !== (profile.name || '') ||
        trimmed.phone !== (profile.phone || '') ||
        trimmed.college !== (profile.college || '') ||
        trimmed.college_id !== (profile.college_id || '') ||
        trimmed.aadhaar_number !== (profile.aadhaar_number || '') ||
        trimmed.city !== (profile.city || '') ||
        trimmed.gender !== (profile.gender || '');
      if (changed) {
        await save(trimmed);
      }

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
          className="section-eyebrow mb-4"
        >
          Conscientia 2026
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="section-heading text-4xl md:text-6xl font-bold mb-10"
        >
          Your Cart
        </motion.h1>

        {loading ? null : !user ? (
          <div className="glass-card rounded-2xl p-8 text-center">
            <p className="text-white/60 mb-4">Sign in to check out your cart.</p>
            <Link
              href="/login?redirect=/cart"
              className="btn-primary"
            >
              Sign In / Create Account
            </Link>
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-8 text-center">
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
            <div className="mb-4 space-y-3">
              {items.map((item) => {
                const qty = item.qty || 1;
                const unit = item.unitPrice;
                const lineTotal = typeof unit === 'number' ? unit * qty : null;
                const isLockedDelivery =
                  item.key === 'delivery' && items.some((i) => i.kind === 'merch');
                return (
                  <div
                    key={item.key}
                    className="glass-card flex items-center gap-4 rounded-xl p-3"
                    style={{ borderColor: `${item.accentColor || '#22d3ee'}33` }}
                  >
                    {item.image && (
                      <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg">
                        <Image src={item.image} alt={item.title} fill className="object-cover" sizes="56px" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">
                        {item.title}
                        {qty > 1 && (
                          <span className="ml-1.5 text-cyan-300">x{qty}</span>
                        )}
                      </p>
                      <p className="text-xs text-white/40">
                        {item.priceLabel}
                        {qty > 1 ? ` each` : ''}
                        {lineTotal !== null && qty > 1 ? ` · ₹${lineTotal} total` : ''}
                      </p>
                      {item.subtitle && (
                        <p className="truncate text-[11px] text-cyan-300/70">{item.subtitle}</p>
                      )}
                      {isLockedDelivery && (
                        <p className="mt-0.5 text-[11px] text-white/30">
                          Remove all merch items to drop delivery
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => removeItem(item.key)}
                      disabled={isLockedDelivery}
                      className="text-white/30 hover:text-red-400 text-sm px-2 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:text-white/30"
                      aria-label="Remove"
                      title={isLockedDelivery ? 'Remove all merch items to drop delivery' : undefined}
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>

            {(() => {
              const total = items.reduce(
                (sum, item) => sum + (typeof item.unitPrice === 'number' ? item.unitPrice * (item.qty || 1) : 0),
                0
              );
              const unpriced = items.some((item) => typeof item.unitPrice !== 'number');
              return total > 0 ? (
                <div className="mb-8 rounded-xl border border-cyan-500/20 bg-cyan-500/[0.04] px-4 py-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-bold uppercase tracking-[0.15em] text-white/70">Total Cost</span>
                    <span className="text-lg font-bold text-cyan-300">₹{total}</span>
                  </div>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-white/35">
                    Informational only{unpriced ? ' — some items have no listed price and are excluded from this sum' : ''}. The amount charged at checkout is set by the ticket price on the payment page.
                  </p>
                </div>
              ) : (
                <div className="mb-8" />
              );
            })()}

            <form
              onSubmit={handleCheckout}
              className="glass-card space-y-4 rounded-2xl p-6"
            >
              <p className="section-eyebrow">
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
                  required
                  placeholder="College ID"
                  value={form.collegeId}
                  onChange={(e) => setForm({ ...form, collegeId: e.target.value })}
                  className="rounded-lg border border-white/15 bg-black/40 px-4 py-2.5 text-sm outline-none focus:border-cyan-500/60"
                />
                <input
                  required
                  inputMode="numeric"
                  maxLength={12}
                  placeholder="Aadhaar Number (12 digits)"
                  value={form.aadhaarNumber}
                  onChange={(e) => setForm({ ...form, aadhaarNumber: e.target.value.replace(/\D/g, '') })}
                  className="rounded-lg border border-white/15 bg-black/40 px-4 py-2.5 text-sm outline-none focus:border-cyan-500/60"
                />
                <input
                  placeholder="City"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="rounded-lg border border-white/15 bg-black/40 px-4 py-2.5 text-sm outline-none focus:border-cyan-500/60"
                />
                <select
                  required
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  className="rounded-lg border border-white/15 bg-black/40 px-4 py-2.5 text-sm outline-none focus:border-cyan-500/60"
                >
                  <option value="">Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
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
                className="btn-primary w-full disabled:opacity-50"
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
