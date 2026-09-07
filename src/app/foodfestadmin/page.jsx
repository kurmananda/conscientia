'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { FOODFEST_TICKETS } from '@/lib/foodfestTickets';

const PASSWORD_HEADER = 'x-foodfest-password';

// Always pull a fresh token right before each request instead of caching one
// at mount — a cached access token expires (~1hr) and every admin call then
// silently 401s, which looks like the page "isn't loading".
async function headersFor(password, extra = {}) {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token || null;
  return {
    'Content-Type': 'application/json',
    [PASSWORD_HEADER]: password,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

export default function FoodfestAdminPage() {
  const { user, loading: authLoading } = useAuth();
  const [password, setPassword] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  const handleUnlock = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoggingIn(true);
    try {
      const res = await fetch('/api/admin/foodfest/login', { method: 'POST', headers: await headersFor(password) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || 'Incorrect password.');
      setUnlocked(true);
    } catch (err) {
      setLoginError(err.message);
    } finally {
      setLoggingIn(false);
    }
  };

  const bg = (
    <>
      <div className="pointer-events-none fixed inset-0 bg-[#030508]" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(255,107,53,0.12),transparent_55%)]" />
    </>
  );

  if (authLoading) {
    return (
      <div className="relative min-h-screen text-white flex items-center justify-center">
        {bg}
        <p className="relative z-10 text-white/40">Loading…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="relative min-h-screen text-white flex items-center justify-center">
        {bg}
        <div className="relative z-10 text-center">
          <p className="mb-4 text-white/60">Sign in first to access Food Fest admin.</p>
          <Link href="/login" className="rounded-full bg-orange-400 px-6 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-black">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (!unlocked) {
    return (
      <div className="relative min-h-screen text-white flex items-center justify-center px-5">
        {bg}
        <form onSubmit={handleUnlock} className="relative z-10 w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.35em] text-orange-400/90">Food Fest</p>
          <h1 className="mb-5 text-xl font-bold">Admin Access</h1>
          <input
            type="password"
            required
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="mb-3 w-full rounded-lg border border-white/15 bg-black/40 px-4 py-2.5 text-sm outline-none focus:border-orange-500/60"
          />
          {loginError && (
            <p className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">{loginError}</p>
          )}
          <button
            type="submit"
            disabled={loggingIn}
            className="w-full rounded-full bg-orange-400 px-6 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-black hover:bg-white transition-colors disabled:opacity-50"
          >
            {loggingIn ? 'Checking…' : 'Unlock'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen text-white">
      {bg}
      <Dashboard password={password} />
    </div>
  );
}

const TABS = [
  { id: 'stalls', label: 'Stalls' },
  { id: 'items', label: 'Items' },
  { id: 'orders', label: 'Orders' },
  { id: 'revenue', label: 'Revenue' },
];

function Dashboard({ password }) {
  const [tab, setTab] = useState('stalls');
  const [toasts, setToasts] = useState([]);

  const pushToast = (message, tone = 'ok') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  };

  return (
    <div className="relative z-10 mx-auto max-w-5xl px-6 pt-20 pb-24">
      <h1 className="mb-6 text-2xl font-bold">Food Fest Admin</h1>

      <div className="mb-6 flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${
              tab === t.id
                ? 'border-orange-400/60 bg-orange-500/15 text-orange-200'
                : 'border-white/10 bg-white/[0.02] text-white/50 hover:border-white/25 hover:text-white/80'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
        >
          {tab === 'stalls' && <StallsTab password={password} pushToast={pushToast} />}
          {tab === 'items' && <ItemsTab password={password} pushToast={pushToast} />}
          {tab === 'orders' && <OrdersTab password={password} pushToast={pushToast} />}
          {tab === 'revenue' && <RevenueTab password={password} />}
        </motion.div>
      </AnimatePresence>

      <div className="fixed bottom-6 right-6 z-50 space-y-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`rounded-lg px-4 py-2.5 text-xs font-semibold shadow-lg ${
              t.tone === 'error' ? 'bg-red-500/90 text-white' : 'bg-orange-400 text-black'
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}

function StallsTab({ password, pushToast }) {
  const [stalls, setStalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ id: '', name: '', description: '', image_url: '', accent_color: '#ff6b35' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/foodfest/stalls', { headers: await headersFor(password) });
    const data = await res.json().catch(() => ({}));
    if (data.success) setStalls(data.data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const create = async (e) => {
    e.preventDefault();
    if (!window.confirm(`Add new stall "${form.name || form.id}"?`)) return;
    setSaving(true);
    const res = await fetch('/api/admin/foodfest/stalls', {
      method: 'POST',
      headers: await headersFor(password),
      body: JSON.stringify(form),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!data.success) return pushToast(data.message || 'Failed to add stall.', 'error');
    pushToast('Stall added.');
    setForm({ id: '', name: '', description: '', image_url: '', accent_color: '#ff6b35' });
    load();
  };

  const patch = async (id, fields, confirmMsg) => {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    const res = await fetch('/api/admin/foodfest/stalls', {
      method: 'PATCH',
      headers: await headersFor(password),
      body: JSON.stringify({ id, ...fields }),
    });
    const data = await res.json().catch(() => ({}));
    if (!data.success) return pushToast(data.message || 'Failed to save.', 'error');
    pushToast('Saved.');
    load();
  };

  const remove = async (id) => {
    if (!window.confirm(`Delete stall "${id}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/foodfest/stalls?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: await headersFor(password),
    });
    const data = await res.json().catch(() => ({}));
    if (!data.success) return pushToast(data.message || 'Failed to remove.', 'error');
    pushToast('Stall removed.');
    load();
  };

  return (
    <div className="space-y-6">
      <form onSubmit={create} className="grid grid-cols-1 gap-2 rounded-xl border border-white/10 bg-white/[0.02] p-4 sm:grid-cols-2">
        <p className="col-span-full text-xs font-bold uppercase tracking-[0.2em] text-orange-300">Add Stall</p>
        <Input placeholder="id (slug, e.g. momo-mania)" value={form.id} onChange={(v) => setForm({ ...form, id: v })} />
        <Input placeholder="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
        <Input placeholder="Image URL" value={form.image_url} onChange={(v) => setForm({ ...form, image_url: v })} />
        <Input placeholder="Accent color (#hex)" value={form.accent_color} onChange={(v) => setForm({ ...form, accent_color: v })} />
        <Textarea
          className="sm:col-span-2"
          placeholder="Description"
          value={form.description}
          onChange={(v) => setForm({ ...form, description: v })}
        />
        <button type="submit" disabled={saving} className="sm:col-span-2 rounded-full bg-orange-400 px-6 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-black disabled:opacity-50">
          {saving ? 'Adding…' : 'Add Stall'}
        </button>
      </form>

      {loading ? (
        <p className="text-white/40">Loading…</p>
      ) : (
        <div className="space-y-3">
          {stalls.map((stall) => (
            <StallRow key={stall.id} stall={stall} onPatch={patch} onRemove={remove} />
          ))}
        </div>
      )}
    </div>
  );
}

function StallRow({ stall, onPatch, onRemove }) {
  const [form, setForm] = useState({ name: stall.name, description: stall.description || '', image_url: stall.image_url || '' });
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full" style={{ background: stall.accent_color }} />
          <p className="font-bold">{stall.id}</p>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${stall.is_open ? 'bg-green-500/20 text-green-300' : 'bg-white/10 text-white/40'}`}>
            {stall.is_open ? 'Open' : 'Closed'}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onPatch(stall.id, { is_open: !stall.is_open }, `${stall.is_open ? 'Close' : 'Open'} stall "${stall.id}"?`)}
            className="rounded-full border border-white/15 px-3 py-1 text-[10px] font-bold uppercase"
          >
            {stall.is_open ? 'Close' : 'Open'}
          </button>
          <button onClick={() => onRemove(stall.id)} className="rounded-full border border-red-500/40 px-3 py-1 text-[10px] font-bold uppercase text-red-300">
            Delete
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Input value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="Name" />
        <Input value={form.image_url} onChange={(v) => setForm({ ...form, image_url: v })} placeholder="Image URL" />
        <Textarea className="sm:col-span-2" value={form.description} onChange={(v) => setForm({ ...form, description: v })} placeholder="Description" />
      </div>
      <button
        onClick={() => onPatch(stall.id, form, `Save changes to stall "${stall.id}"?`)}
        className="mt-2 rounded-full border border-orange-400/50 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-orange-300"
      >
        Save
      </button>
    </div>
  );
}

function ItemsTab({ password, pushToast }) {
  const [stalls, setStalls] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ stall_id: '', name: '', description: '', price: FOODFEST_TICKETS[0].price });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const [stallsRes, itemsRes] = await Promise.all([
      fetch('/api/admin/foodfest/stalls', { headers: await headersFor(password) }),
      fetch('/api/admin/foodfest/items', { headers: await headersFor(password) }),
    ]);
    const [stallsData, itemsData] = await Promise.all([stallsRes.json(), itemsRes.json()]);
    if (stallsData.success) setStalls(stallsData.data || []);
    if (itemsData.success) setItems(itemsData.data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const create = async (e) => {
    e.preventDefault();
    if (!form.stall_id) return pushToast('Pick a stall first.', 'error');
    if (!window.confirm(`Add new item "${form.name}"?`)) return;
    setSaving(true);
    const res = await fetch('/api/admin/foodfest/items', {
      method: 'POST',
      headers: await headersFor(password),
      body: JSON.stringify({ ...form, price: Number(form.price) }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!data.success) return pushToast(data.message || 'Failed to add item.', 'error');
    pushToast('Item added.');
    setForm({ stall_id: form.stall_id, name: '', description: '', price: FOODFEST_TICKETS[0].price });
    load();
  };

  const patch = async (id, fields, confirmMsg) => {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    const res = await fetch('/api/admin/foodfest/items', {
      method: 'PATCH',
      headers: await headersFor(password),
      body: JSON.stringify({ id, ...fields }),
    });
    const data = await res.json().catch(() => ({}));
    if (!data.success) return pushToast(data.message || 'Failed to save.', 'error');
    pushToast('Saved.');
    load();
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this item? This cannot be undone.')) return;
    const res = await fetch(`/api/admin/foodfest/items?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: await headersFor(password),
    });
    const data = await res.json().catch(() => ({}));
    if (!data.success) return pushToast(data.message || 'Failed to remove.', 'error');
    pushToast('Item removed.');
    load();
  };

  return (
    <div className="space-y-6">
      <form onSubmit={create} className="grid grid-cols-1 gap-2 rounded-xl border border-white/10 bg-white/[0.02] p-4 sm:grid-cols-2">
        <p className="col-span-full text-xs font-bold uppercase tracking-[0.2em] text-orange-300">Add Item</p>
        <Select value={form.stall_id} onChange={(v) => setForm({ ...form, stall_id: v })} placeholder="Select stall">
          {stalls.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </Select>
        <Select value={form.price} onChange={(v) => setForm({ ...form, price: v })}>
          {FOODFEST_TICKETS.map((t) => (
            <option key={t.price} value={t.price}>₹{t.price}</option>
          ))}
        </Select>
        <Input placeholder="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
        <Textarea className="sm:col-span-2" placeholder="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
        <button type="submit" disabled={saving} className="sm:col-span-2 rounded-full bg-orange-400 px-6 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-black disabled:opacity-50">
          {saving ? 'Adding…' : 'Add Item'}
        </button>
      </form>

      {loading ? (
        <p className="text-white/40">Loading…</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <ItemRow key={item.id} item={item} onPatch={patch} onRemove={remove} />
          ))}
        </div>
      )}
    </div>
  );
}

function ItemRow({ item, onPatch, onRemove }) {
  const [form, setForm] = useState({ name: item.name, description: item.description || '', price: item.price });
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="font-bold">{item.name}</p>
          <p className="text-xs text-white/40">stall: {item.stall_id} · ticket: {item.ticket_id}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onPatch(item.id, { is_available: !item.is_available }, `Mark "${item.name}" as ${item.is_available ? 'hidden' : 'available'}?`)}
            className="rounded-full border border-white/15 px-3 py-1 text-[10px] font-bold uppercase"
          >
            {item.is_available ? 'Available' : 'Hidden'}
          </button>
          <button onClick={() => onRemove(item.id)} className="rounded-full border border-red-500/40 px-3 py-1 text-[10px] font-bold uppercase text-red-300">
            Delete
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Input value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="Name" />
        <Select value={form.price} onChange={(v) => setForm({ ...form, price: Number(v) })}>
          {FOODFEST_TICKETS.map((t) => (
            <option key={t.price} value={t.price}>₹{t.price}</option>
          ))}
        </Select>
        <Textarea className="sm:col-span-2" value={form.description} onChange={(v) => setForm({ ...form, description: v })} placeholder="Description" />
      </div>
      <button
        onClick={() => onPatch(item.id, form, `Save changes to "${item.name}"?`)}
        className="mt-2 rounded-full border border-orange-400/50 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-orange-300"
      >
        Save
      </button>
    </div>
  );
}

const ORDER_STAGES = [
  { id: 'pending', label: 'Placed', icon: '🧾', color: '#facc15' },
  { id: 'preparing', label: 'Preparing', icon: '👨‍🍳', color: '#fb923c' },
  { id: 'ready', label: 'Ready', icon: '🔔', color: '#4ade80' },
  { id: 'completed', label: 'Picked Up', icon: '✅', color: '#94a3b8' },
];

// Fixed palette, one shade per stall (max 12 stalls) — chosen to stay clear
// of the order-stage colors above (yellow/orange/green/gray) and the site's
// orange theme accent, so stall color and status color never look alike.
const STALL_COLORS = [
  '#a78bfa', // violet
  '#38bdf8', // sky
  '#f472b6', // pink
  '#5eead4', // turquoise
  '#818cf8', // indigo
  '#f87171', // red
  '#c084fc', // purple
  '#60a5fa', // blue
  '#fb7185', // rose
  '#e879f9', // fuchsia
  '#93c5fd', // light blue
  '#fca5a5', // coral
];

function OrdersTab({ password, pushToast }) {
  const [orders, setOrders] = useState([]);
  const [stalls, setStalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('active');

  const load = async () => {
    const [ordersRes, stallsRes] = await Promise.all([
      fetch('/api/admin/foodfest/orders', { headers: await headersFor(password) }),
      fetch('/api/admin/foodfest/stalls', { headers: await headersFor(password) }),
    ]);
    const [ordersData, stallsData] = await Promise.all([ordersRes.json().catch(() => ({})), stallsRes.json().catch(() => ({}))]);
    if (ordersData.success) setOrders(ordersData.data || []);
    if (stallsData.success) setStalls(stallsData.data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // Poll so newly placed orders show up on their own — no manual refresh needed.
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const colorForStall = (stallId) => {
    const index = stalls.findIndex((s) => s.id === stallId);
    return index >= 0 ? STALL_COLORS[index % STALL_COLORS.length] : '#94a3b8';
  };

  const setStatus = async (id, order_status, confirmMsg) => {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    const res = await fetch('/api/admin/foodfest/orders', {
      method: 'PATCH',
      headers: await headersFor(password),
      body: JSON.stringify({ id, order_status }),
    });
    const data = await res.json().catch(() => ({}));
    if (!data.success) return pushToast(data.message || 'Failed to update.', 'error');
    pushToast(`Order marked "${order_status}".`);
    load();
  };

  if (loading) return <p className="text-white/40">Loading…</p>;

  const visible = filter === 'active' ? orders.filter((o) => o.order_status !== 'completed') : orders;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {['active', 'all'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] ${
              filter === f ? 'border-orange-400/60 bg-orange-500/15 text-orange-200' : 'border-white/10 text-white/50'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {visible.map((order) => {
          const stageIndex = ORDER_STAGES.findIndex((s) => s.id === order.order_status);
          const stage = ORDER_STAGES[stageIndex] || ORDER_STAGES[0];
          const isDone = order.order_status === 'completed' || order.order_status === 'ready';
          const primaryStallId = order.items?.[0]?.stall_id;
          const accent = colorForStall(primaryStallId);
          return (
            <div
              key={order.id}
              className="rounded-2xl border p-4 shadow-[0_6px_20px_rgba(0,0,0,0.25)] transition-transform hover:-translate-y-0.5"
              style={{ borderColor: `${accent}44`, background: `linear-gradient(135deg, ${accent}14, rgba(255,255,255,0.02))` }}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: accent }} />
                  <p className="truncate font-bold">{order.name || order.email || 'Guest'}</p>
                </div>
                <span
                  className="flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
                  style={{ background: `${stage.color}22`, color: stage.color }}
                >
                  {stage.label}
                </span>
              </div>
              <p className="mb-2 truncate text-xs text-white/50">
                {order.email} · {order.phone}
                {order.cns_id && <> · CNS ID: <span className="text-white/70">{order.cns_id}</span></>}
              </p>
              <ul className="mb-2 space-y-0.5 text-sm text-white/70">
                {(order.items || []).map((it, i) => (
                  <li key={i} className="flex justify-between gap-2">
                    <span className="truncate">{it.qty}× {it.name}</span>
                    <span className="shrink-0 text-white/50">{it.price === 0 ? 'Free' : `₹${it.price}`}</span>
                  </li>
                ))}
              </ul>
              <p className="mb-3 border-t border-white/10 pt-2 text-sm font-bold">
                Total: {order.amount === 0 ? 'Free' : `₹${order.amount}`}
              </p>
              {!isDone && (
                <button
                  onClick={() =>
                    setStatus(
                      order.id,
                      'ready',
                      `Confirm order (${order.name || order.email || 'Guest'}) is ready for pickup? The customer will then need to confirm takeaway themselves.`
                    )
                  }
                  className="w-full rounded-full bg-green-400 px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-black transition-transform hover:scale-[1.02]"
                >
                  Confirm Order
                </button>
              )}
              {order.order_status === 'ready' && (
                <p className="text-center text-[10px] uppercase tracking-[0.15em] text-white/40">
                  Waiting on customer to confirm takeaway
                </p>
              )}
            </div>
          );
        })}
        {visible.length === 0 && <p className="text-white/40">No orders here.</p>}
      </div>
    </div>
  );
}

function RevenueTab({ password }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const res = await fetch('/api/admin/foodfest/orders', { headers: await headersFor(password) });
      const data = await res.json().catch(() => ({}));
      if (!cancelled && data.success) setOrders(data.data || []);
      if (!cancelled) setLoading(false);
    };
    load();
    // Only this tab's numbers refresh on an interval — not the whole page.
    const interval = setInterval(load, 3000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const paidOrders = orders.filter((o) => o.payment_status === 'paid');
  const byStall = {};
  for (const order of paidOrders) {
    for (const it of order.items || []) {
      const stallId = it.stall_id || 'unknown';
      if (!byStall[stallId]) byStall[stallId] = { revenue: 0, qty: 0 };
      byStall[stallId].revenue += (it.price || 0) * (it.qty || 1);
      byStall[stallId].qty += it.qty || 1;
    }
  }
  const rows = Object.entries(byStall).sort((a, b) => b[1].revenue - a[1].revenue);
  const total = rows.reduce((sum, [, v]) => sum + v.revenue, 0);

  if (loading) return <p className="text-white/40">Loading…</p>;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-orange-400/30 bg-orange-500/10 p-5">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-300">Total Collected</p>
        <p className="mt-1 text-3xl font-black">₹{total}</p>
      </div>
      <div className="space-y-2">
        {rows.map(([stallId, v]) => (
          <div key={stallId} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
            <div>
              <p className="font-bold">{stallId}</p>
              <p className="text-xs text-white/40">{v.qty} item{v.qty !== 1 ? 's' : ''} sold</p>
            </div>
            <p className="text-lg font-black text-orange-300">₹{v.revenue}</p>
          </div>
        ))}
        {rows.length === 0 && <p className="text-white/40">No paid orders yet.</p>}
      </div>
    </div>
  );
}

function Input({ className = '', ...props }) {
  return (
    <input
      {...props}
      onChange={(e) => props.onChange(e.target.value)}
      className={`rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-xs outline-none transition-colors focus:border-orange-500/60 ${className}`}
    />
  );
}

function Textarea({ className = '', ...props }) {
  return (
    <textarea
      {...props}
      onChange={(e) => props.onChange(e.target.value)}
      rows={2}
      className={`rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-xs outline-none transition-colors focus:border-orange-500/60 ${className}`}
    />
  );
}

function Select({ className = '', placeholder, children, ...props }) {
  return (
    <select
      {...props}
      onChange={(e) => props.onChange(e.target.value)}
      className={`rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-xs outline-none transition-colors focus:border-orange-500/60 ${className}`}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {children}
    </select>
  );
}
