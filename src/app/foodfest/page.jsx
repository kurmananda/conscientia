'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import useProfile from '../hooks/useProfile';
import { startFoodfestCheckout } from '@/lib/foodfestCheckout';
import FetchIntro from '../components/FetchIntro';

const FLOATING_EMOJI = ['🍕', '🌮', '🍔', '🍟', '🍩', '🧋'];
const ITEM_EMOJI = ['🍜', '🥘', '🍢', '🌯', '🧆', '🥟', '🍡', '🥪'];

const ORDER_STAGES = {
  pending: { label: 'Order Placed', icon: '🧾', color: '#facc15' },
  preparing: { label: 'Being Prepared', icon: '👨‍🍳', color: '#fb923c' },
  ready: { label: 'Ready — Come Collect!', icon: '🔔', color: '#4ade80' },
  completed: { label: 'Picked Up', icon: '✅', color: '#94a3b8' },
};

function emojiFor(name, seed) {
  const hash = String(name || '').split('').reduce((a, c) => a + c.charCodeAt(0), seed);
  return ITEM_EMOJI[hash % ITEM_EMOJI.length];
}

export default function FoodfestPage() {
  const [stalls, setStalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openStallId, setOpenStallId] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [myOrders, setMyOrders] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const { items, addItem, updateQty, removeItem } = useCart();
  const { user, loading: authLoading } = useAuth();
  const { profile } = useProfile();

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/foodfest', { cache: 'no-store' });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || 'Failed to load stalls.');
        setStalls(data.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Poll the signed-in user's own orders so they can watch status move
  // pending -> preparing -> ready -> completed without refreshing.
  useEffect(() => {
    if (!user?.email) return;
    let cancelled = false;
    const load = async () => {
      const res = await fetch(`/api/foodfest/my-orders?email=${encodeURIComponent(user.email)}`, {
        cache: 'no-store',
      });
      const data = await res.json().catch(() => ({}));
      if (!cancelled && data.success) setMyOrders(data.data || []);
    };
    load();
    const interval = setInterval(load, 3000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [user?.email, checkingOut]);

  const foodItems = useMemo(() => items.filter((i) => i.kind === 'food'), [items]);
  const cartCount = foodItems.reduce((sum, i) => sum + (i.qty || 1), 0);
  const cartTotal = foodItems.reduce((sum, i) => sum + (i.unitPrice || 0) * (i.qty || 1), 0);
  const activeOrders = myOrders.filter((o) => o.order_status !== 'completed');
  const pastOrders = myOrders.filter((o) => o.order_status === 'completed');

  const qtyFor = (stallId, itemId) =>
    foodItems.find((i) => i.key === `foodfest:${stallId}:${itemId}`)?.qty || 0;

  const handleAdd = (stall, item) => {
    addItem({
      key: `foodfest:${stall.id}:${item.id}`,
      id: item.id,
      kind: 'food',
      stallId: stall.id,
      name: item.name,
      unitPrice: item.price,
      priceLabel: `₹${item.price}`,
      ticketId: item.ticket_id,
    });
  };

  const handleReviewOrder = () => {
    if (foodItems.length === 0) return;
    setCheckoutError('');
    const name = profile?.name || '';
    const phone = profile?.phone || '';
    const email = user?.email || '';
    if (!email || !name || !phone) {
      setCheckoutError('Please complete your profile (name, phone) before ordering.');
      return;
    }
    setConfirming(true);
  };

  const handleCheckout = async () => {
    if (foodItems.length === 0) return;
    setCheckoutError('');
    const name = profile?.name || '';
    const phone = profile?.phone || '';
    const email = user?.email || '';
    if (!email || !name || !phone) {
      setCheckoutError('Please complete your profile (name, phone) before ordering.');
      return;
    }
    setCheckingOut(true);
    try {
      const result = await startFoodfestCheckout(foodItems, { name, email, phone, userId: user?.id });
      if (result?.free) {
        await Promise.all(foodItems.map((item) => removeItem(item.key)));
        setCartOpen(false);
        setConfirming(false);
        setCheckingOut(false);
      }
      // Paid checkout redirects the browser away — no further state to set.
    } catch (err) {
      setCheckoutError(err.message || 'Something went wrong starting payment.');
      setCheckingOut(false);
    }
  };

  const handleConfirmPickup = async (order) => {
    if (!user?.email) return;
    const itemsLabel = (order.items || []).map((it) => `${it.qty}× ${it.name}`).join(', ');
    if (!window.confirm(`Confirm you've picked up this order?\n${itemsLabel}`)) return;
    setMyOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, order_status: 'completed' } : o)));
    try {
      const res = await fetch('/api/foodfest/confirm-pickup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: order.id, email: user.email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || 'Could not confirm pickup.');
    } catch (err) {
      setMyOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, order_status: order.order_status } : o)));
      alert(err.message || 'Could not confirm pickup. Please try again.');
    }
  };

  const closeCart = () => {
    if (checkingOut) return;
    setCartOpen(false);
    setConfirming(false);
    setCheckoutError('');
  };

  if (authLoading) {
    return <FetchIntro loading label="Loading Food Fest" accentColor="#ff6b35" />;
  }

  if (!user) {
    return (
      <div className="relative min-h-[calc(100dvh-12rem)] bg-[#0a0604] text-white overflow-hidden flex items-center justify-center px-6">
        <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-10%,rgba(255,107,53,0.18),transparent_55%)]" />
        <div className="relative z-10 glass-card rounded-2xl p-8 text-center max-w-md">
          <p className="text-2xl mb-2">🍜</p>
          <p className="text-white/60 mb-4">Sign in to access the Food Fest.</p>
          <Link href="/login?redirect=/foodfest" className="btn-primary">
            Sign In / Create Account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#0a0604] text-white overflow-x-hidden pb-32">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-10%,rgba(255,107,53,0.18),transparent_55%)]" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_60%_40%_at_90%_80%,rgba(250,204,21,0.08),transparent_55%)]" />
      <div className="pointer-events-none fixed inset-0 overflow-hidden opacity-25">
        {FLOATING_EMOJI.map((emoji, i) => (
          <span
            key={i}
            className="absolute text-4xl animate-[foodfloat_9s_ease-in-out_infinite] blur-[0.3px]"
            style={{
              left: `${8 + i * 16}%`,
              top: `${12 + (i % 3) * 26}%`,
              animationDelay: `${i * 1.2}s`,
            }}
          >
            {emoji}
          </span>
        ))}
      </div>
      <style>{`
        @keyframes foodfloat {
          0%, 100% { transform: translateY(0) rotate(-6deg); }
          50% { transform: translateY(-24px) rotate(6deg); }
        }
        @keyframes pulseDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }
      `}</style>

      <div className="relative z-10 mx-auto max-w-5xl px-5 pt-16">
        <p className="font-mono text-[10px] uppercase tracking-[0.45em] text-orange-400/90 mb-3">
          Conscientia 2026
        </p>
        <h1 className="text-4xl md:text-6xl font-bold uppercase tracking-tighter mb-2 bg-gradient-to-br from-white via-orange-100 to-orange-300 bg-clip-text text-transparent drop-shadow-[0_4px_20px_rgba(255,107,53,0.25)]">
          Food Fest
        </h1>
        <p className="text-white/50 mb-6 max-w-md">Browse stalls, pick your favourites, pay online, skip the line.</p>

        <button
          type="button"
          onClick={() => setShowMenu(true)}
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-orange-400/40 bg-orange-400/10 px-6 py-3 text-sm font-bold uppercase tracking-[0.2em] text-orange-300 transition-colors hover:bg-orange-400/20"
        >
          📋 Whole Menu
        </button>

        {activeOrders.length > 0 && (
          <div className="mb-10 space-y-3">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-300">My Orders</p>
            {activeOrders.map((order) => {
              const stage = ORDER_STAGES[order.order_status] || ORDER_STAGES.pending;
              const stageOrder = ['pending', 'preparing', 'ready', 'completed'];
              const stepIndex = stageOrder.indexOf(order.order_status);
              return (
                <div
                  key={order.id}
                  className="overflow-hidden rounded-2xl border shadow-[0_8px_30px_rgba(0,0,0,0.25)]"
                  style={{ borderColor: `${stage.color}55`, background: `linear-gradient(135deg, ${stage.color}18, rgba(255,255,255,0.02))` }}
                >
                  <div className="flex items-center gap-4 p-4">
                    <span
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl"
                      style={{ background: `${stage.color}26`, boxShadow: `inset 0 0 0 1px ${stage.color}55` }}
                    >
                      {stage.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold" style={{ color: stage.color }}>
                        {stage.label}
                      </p>
                      <p className="truncate text-xs text-white/50">
                        {(order.items || []).map((it) => `${it.qty}× ${it.name}`).join(', ')}
                      </p>
                    </div>
                    {order.order_status !== 'completed' && (
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ background: stage.color, animation: 'pulseDot 1.6s ease-in-out infinite' }}
                      />
                    )}
                  </div>
                  <div className="flex px-4 pb-3.5">
                    {stageOrder.map((s, i) => (
                      <div key={s} className="flex flex-1 items-center last:flex-none">
                        <span
                          className="h-1.5 w-1.5 shrink-0 rounded-full transition-colors"
                          style={{ background: i <= stepIndex ? stage.color : 'rgba(255,255,255,0.15)' }}
                        />
                        {i < stageOrder.length - 1 && (
                          <span
                            className="mx-1 h-[2px] flex-1 rounded-full transition-colors"
                            style={{ background: i < stepIndex ? stage.color : 'rgba(255,255,255,0.1)' }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="px-4 pb-4">
                    {order.order_status === 'ready' ? (
                      <button
                        onClick={() => handleConfirmPickup(order)}
                        className="w-full rounded-full border border-green-400/50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-green-300 transition-colors hover:bg-green-400 hover:text-black"
                      >
                        Confirm Takeaway
                      </button>
                    ) : (
                      <p className="text-center text-[10px] uppercase tracking-[0.15em] text-white/30">
                        Waiting for the stall to confirm your order
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {pastOrders.length > 0 && (
          <div className="mb-10">
            <button
              onClick={() => setShowHistory((v) => !v)}
              className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-white/40 hover:text-white/70 transition-colors"
            >
              Order History ({pastOrders.length})
              <span className="transition-transform duration-200" style={{ transform: showHistory ? 'rotate(180deg)' : 'none' }}>▾</span>
            </button>
            <AnimatePresence initial={false}>
              {showHistory && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="space-y-2 pt-1">
                    {pastOrders.map((order) => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-xs text-white/60">
                            {(order.items || []).map((it) => `${it.qty}× ${it.name}`).join(', ')}
                          </p>
                          <p className="text-[10px] text-white/35">
                            {order.created_at ? new Date(order.created_at).toLocaleDateString() : ''}
                          </p>
                        </div>
                        <span className="shrink-0 text-sm font-bold text-white/70">
                          {order.amount === 0 ? 'Free' : `₹${order.amount}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {loading && <p className="text-white/40">Loading stalls…</p>}
        {error && <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}

        <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2">
          {stalls.map((stall) => (
            <StallCard
              key={stall.id}
              stall={stall}
              open={openStallId === stall.id}
              onToggle={() => setOpenStallId(openStallId === stall.id ? null : stall.id)}
              qtyFor={qtyFor}
              onAdd={handleAdd}
              onUpdateQty={(itemId, qty) =>
                qty > 0
                  ? updateQty(`foodfest:${stall.id}:${itemId}`, qty)
                  : removeItem(`foodfest:${stall.id}:${itemId}`)
              }
            />
          ))}
        </div>

        {!loading && stalls.length === 0 && !error && (
          <p className="text-white/40">No stalls open right now — check back soon.</p>
        )}

        <div className="mt-16 flex flex-col items-center text-center">
          <p className="mb-4 font-mono text-[20px] uppercase tracking-[0.4em] text-white/35">
            Website created by organizer of
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/creator.png"
            alt="Organizer stall poster"
            className=" w-2/3 rounded-2xl border border-white/10 object-fill shadow-[0_8px_30px_rgba(0,0,0,0.4)]"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextSibling.style.display = 'flex';
            }}
          />
          <div
            className="hidden h-64 w-full max-w-md flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.02] text-sm text-white/30"
          >
            Poster image coming soon
          </div>
        </div>
      </div>

      <AnimatePresence>
        {cartCount > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 z-30 border-t border-orange-500/25 bg-[#150d08]/95 backdrop-blur px-5 py-4 shadow-[0_-8px_30px_rgba(0,0,0,0.5)]"
          >
            <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
              <button onClick={() => setCartOpen(true)} className="flex items-center gap-3 text-left">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-400/15 text-lg">🛒</span>
                <span>
                  <p className="text-sm font-bold">{cartCount} item{cartCount > 1 ? 's' : ''} · ₹{cartTotal}</p>
                  <p className="text-xs text-white/50">Tap to view cart</p>
                </span>
              </button>
              <button
                onClick={() => setCartOpen(true)}
                className="rounded-full bg-orange-400 px-6 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-black shadow-[0_4px_16px_rgba(251,146,60,0.35)] hover:bg-white transition-colors"
              >
                View Cart →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {cartOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center"
            onClick={closeCart}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-t-2xl border border-orange-500/20 bg-[#0a0604] p-5 sm:rounded-2xl"
            >
              {!confirming ? (
                <>
                  <h2 className="mb-4 text-lg font-bold">Your Order</h2>
                  <div className="mb-4 max-h-64 space-y-3 overflow-y-auto">
                    {foodItems.map((item) => (
                      <div key={item.key} className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{item.name}</p>
                          <p className="text-xs text-white/50">₹{item.unitPrice} × {item.qty}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              item.qty > 1 ? updateQty(item.key, item.qty - 1) : removeItem(item.key)
                            }
                            className="h-7 w-7 rounded-full border border-white/15 text-sm"
                          >
                            {item.qty > 1 ? '−' : '×'}
                          </button>
                          <span className="w-5 text-center text-sm">{item.qty}</span>
                          <button
                            onClick={() => updateQty(item.key, (item.qty || 1) + 1)}
                            className="h-7 w-7 rounded-full border border-white/15 text-sm"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                    {foodItems.length === 0 && <p className="text-sm text-white/40">Your cart is empty.</p>}
                  </div>
                  <div className="mb-4 flex items-center justify-between border-t border-white/10 pt-3 text-sm font-bold">
                    <span>Total</span>
                    <span>{cartTotal === 0 ? 'Free' : `₹${cartTotal}`}</span>
                  </div>
                  {checkoutError && (
                    <p className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                      {checkoutError}
                    </p>
                  )}
                  <button
                    onClick={handleReviewOrder}
                    disabled={foodItems.length === 0}
                    className="w-full rounded-full bg-orange-400 px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-black hover:bg-white transition-colors disabled:opacity-50"
                  >
                    Review Order →
                  </button>
                </>
              ) : (
                <>
                  <h2 className="mb-1 text-lg font-bold">Confirm Your Order</h2>
                  <p className="mb-4 text-xs text-white/50">Please double-check before placing this order.</p>
                  <div className="mb-4 max-h-64 space-y-2 overflow-y-auto rounded-xl border border-white/10 bg-white/[0.02] p-3">
                    {foodItems.map((item) => (
                      <div key={item.key} className="flex items-center justify-between gap-3 text-sm">
                        <span className="truncate">{item.qty}× {item.name}</span>
                        <span className="shrink-0 text-white/60">₹{(item.unitPrice || 0) * (item.qty || 1)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mb-5 flex items-center justify-between border-t border-white/10 pt-3 text-sm font-bold">
                    <span>Total to pay</span>
                    <span>{cartTotal === 0 ? 'Free' : `₹${cartTotal}`}</span>
                  </div>
                  {checkoutError && (
                    <p className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                      {checkoutError}
                    </p>
                  )}
                  <div className="flex gap-3">
                    <button
                      onClick={() => setConfirming(false)}
                      disabled={checkingOut}
                      className="flex-1 rounded-full border border-white/15 px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white/70 transition-colors hover:border-white/30 disabled:opacity-50"
                    >
                      Go Back
                    </button>
                    <button
                      onClick={handleCheckout}
                      disabled={checkingOut}
                      className="flex-1 rounded-full bg-orange-400 px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-black hover:bg-white transition-colors disabled:opacity-50"
                    >
                      {checkingOut ? 'Placing…' : cartTotal === 0 ? 'Confirm Free Order' : 'Confirm & Pay'}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 p-4"
            onClick={() => setShowMenu(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative max-h-[90vh] max-w-3xl overflow-auto rounded-2xl border border-white/10 bg-[#0a0604]"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowMenu(false)}
                className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-lg text-white hover:bg-black/80"
                aria-label="Close menu"
              >
                ×
              </button>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/menu.png" alt="Whole Menu" className="block max-w-full" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StallCard({ stall, open, onToggle, qtyFor, onAdd, onUpdateQty }) {
  const accent = stall.accent_color || '#ff6b35';
  return (
    <div
      className="overflow-hidden rounded-2xl border bg-white/[0.03] shadow-[0_6px_24px_rgba(0,0,0,0.3)] transition-all duration-200"
      style={{ borderColor: open ? `${accent}77` : 'rgba(255,255,255,0.1)', boxShadow: open ? `0 6px 24px rgba(0,0,0,0.3), 0 0 0 1px ${accent}33` : undefined }}
    >
      <button
        onClick={onToggle}
        className="relative flex w-full items-center gap-4 p-4 text-left transition-colors hover:brightness-110"
        style={{ background: `linear-gradient(120deg, ${accent}2a, transparent 75%)` }}
      >
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-3xl"
          style={{ background: `${accent}26`, boxShadow: `inset 0 0 0 1px ${accent}44` }}
        >
          {stall.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={stall.image_url} alt="" className="h-full w-full rounded-2xl object-cover" />
          ) : (
            '🍽️'
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-bold tracking-tight">{stall.name}</p>
            {stall.items?.length > 0 && (
              <span className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/50">
                {stall.items.length} item{stall.items.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <p className="truncate text-xs text-white/50">{stall.description}</p>
        </div>
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-lg transition-transform duration-200"
          style={{ background: `${accent}22`, color: accent, transform: open ? 'rotate(45deg)' : 'none' }}
        >
          +
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden border-t border-white/10"
          >
            <div className="divide-y divide-white/5">
              {(stall.items || []).map((item, i) => {
                const qty = qtyFor(stall.id, item.id);
                return (
                  <div key={item.id} className="flex items-center gap-3 p-4 transition-colors hover:bg-white/[0.03]">
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl"
                      style={{ background: `${accent}18`, boxShadow: `inset 0 0 0 1px ${accent}2a` }}
                    >
                      {emojiFor(item.name, i)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{item.name}</p>
                      <p className="truncate text-xs text-white/50">{item.description}</p>
                      <p className="mt-1 text-sm font-bold" style={{ color: accent }}>
                        {item.price === 0 ? 'Free' : `₹${item.price}`}
                      </p>
                    </div>
                    {qty > 0 ? (
                      <div className="flex shrink-0 items-center gap-1 rounded-full border border-white/10 bg-black/30 p-1">
                        <button
                          onClick={() => onUpdateQty(item.id, qty - 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-full text-sm hover:bg-white/10"
                        >
                          −
                        </button>
                        <span className="w-5 text-center text-sm font-bold">{qty}</span>
                        <button
                          onClick={() => onUpdateQty(item.id, qty + 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-full text-sm hover:bg-white/10"
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => onAdd(stall, item)}
                        className="shrink-0 rounded-full border px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] transition-colors hover:text-black"
                        style={{ borderColor: `${accent}80`, color: accent }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = accent)}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        Add
                      </button>
                    )}
                  </div>
                );
              })}
              {(stall.items || []).length === 0 && (
                <p className="p-4 text-sm text-white/40">No items yet.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
