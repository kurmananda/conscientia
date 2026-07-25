'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import useProfile from '../hooks/useProfile';
import ProfileAvatar from '../components/ProfileAvatar';
import { workshopCards } from '../workshop/workshopData';
import { eventCards } from '../events/eventsData';

const CATALOG = [...workshopCards, ...eventCards];

const GENDER_LABELS = {
  male: 'Male',
  female: 'Female',
  rather_not_say: 'Neutral',
};

function findCatalogItem(id) {
  return CATALOG.find((c) => c.id === id);
}

export default function ProfilePage() {
  const { user, loading, signOut } = useAuth();
  const { items: cartItems, removeItem } = useCart();
  const { profile, loading: profileLoading, save } = useProfile();
  const [registration, setRegistration] = useState(null);
  const [fetching, setFetching] = useState(false);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', college: '', city: '', gender: '' });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    setFetching(true);
    fetch(`/api/get-registrations?user_id=${encodeURIComponent(user.id)}`)
      .then((res) => res.json())
      .then((json) => setRegistration(json?.data || null))
      .finally(() => setFetching(false));
  }, [user?.id]);

  useEffect(() => {
    if (!profile) return;
    setForm({
      name: profile.name || '',
      phone: profile.phone || '',
      college: profile.college || '',
      city: profile.city || '',
      gender: profile.gender || '',
    });
  }, [profile]);

  useEffect(() => {
    // First time in: if mandatory fields are missing, drop straight into edit mode.
    if (!profileLoading && (!profile || !profile.name || !profile.phone || !profile.college)) {
      setEditing(true);
    }
  }, [profileLoading, profile]);

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.name.trim() || !form.phone.trim() || !form.college.trim()) {
      setFormError('Name, phone number, and college are required.');
      return;
    }
    setSaving(true);
    const result = await save({
      name: form.name.trim(),
      phone: form.phone.trim(),
      college: form.college.trim(),
      city: form.city.trim(),
      gender: form.gender || null,
    });
    setSaving(false);
    if (result.error) {
      setFormError(result.error);
      return;
    }
    setEditing(false);
  };

  if (loading) {
    return <ProfileShell><p className="text-white/50">Loading…</p></ProfileShell>;
  }

  if (!user) {
    return (
      <ProfileShell>
        <p className="text-white/60 mb-6">Sign in to see your bookings, tickets, and cart.</p>
        <Link
          href="/login?redirect=/profile"
          className="inline-flex items-center gap-2 rounded-full bg-cyan-400 px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-black hover:bg-white transition-colors"
        >
          Sign In / Create Account
        </Link>
      </ProfileShell>
    );
  }

  const bookedIds = Array.isArray(registration?.workshop_ids) ? registration.workshop_ids : [];
  const bookedItems = bookedIds
    .map((raw) => findCatalogItem(String(raw).trim()))
    .filter(Boolean);

  return (
    <ProfileShell>
      {/* ── Identity card ─────────────────────────────────────── */}
      <div className="mb-10 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <div className="flex flex-wrap items-center gap-5 mb-6">
          <ProfileAvatar seed={user.id} name={profile?.name} email={user.email} size={80} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-bold text-white">{profile?.name || 'Unnamed Attendee'}</p>
            <p className="truncate text-sm text-white/40">{user.email}</p>
            {profile?.unique_code && (
              <span className="mt-2 inline-block rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3 py-1 font-mono text-xs tracking-[0.15em] text-cyan-300">
                {profile.unique_code}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="rounded-full border border-white/15 px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/70 hover:border-cyan-400/50 hover:text-cyan-300 transition-colors"
              >
                Edit
              </button>
            )}
            <button
              onClick={() => signOut()}
              className="rounded-full border border-white/15 px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/70 hover:border-red-400/50 hover:text-red-300 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>

        {editing ? (
          <form onSubmit={handleSave} className="space-y-4 border-t border-white/10 pt-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full Name *">
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-lg border border-white/15 bg-black/40 px-4 py-2.5 text-sm outline-none focus:border-cyan-500/60"
                />
              </Field>
              <Field label="Phone Number *">
                <input
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full rounded-lg border border-white/15 bg-black/40 px-4 py-2.5 text-sm outline-none focus:border-cyan-500/60"
                />
              </Field>
              <Field label="College Name *">
                <input
                  required
                  value={form.college}
                  onChange={(e) => setForm({ ...form, college: e.target.value })}
                  className="w-full rounded-lg border border-white/15 bg-black/40 px-4 py-2.5 text-sm outline-none focus:border-cyan-500/60"
                />
              </Field>
              <Field label="City (optional)">
                <input
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="w-full rounded-lg border border-white/15 bg-black/40 px-4 py-2.5 text-sm outline-none focus:border-cyan-500/60"
                />
              </Field>
              <Field label="Gender (optional)">
                <select
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  className="w-full rounded-lg border border-white/15 bg-black/40 px-4 py-2.5 text-sm outline-none focus:border-cyan-500/60"
                >
                  <option value="">Prefer not to specify</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="rather_not_say">Neutral</option>
                </select>
              </Field>
            </div>

            {formError && (
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                {formError}
              </p>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-full bg-cyan-400 px-6 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-black hover:bg-white transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save Details'}
              </button>
              {profile?.name && profile?.phone && profile?.college && (
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="rounded-full border border-white/15 px-6 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-white/60 hover:text-white transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        ) : (
          <div className="grid gap-4 border-t border-white/10 pt-6 sm:grid-cols-2">
            <Detail label="Phone" value={profile?.phone} />
            <Detail label="College" value={profile?.college} />
            <Detail label="City" value={profile?.city || '—'} />
            <Detail label="Gender" value={GENDER_LABELS[profile?.gender] || '—'} />
          </div>
        )}
      </div>

      <Section title="Your Tickets">
        {fetching ? (
          <p className="text-white/40 text-sm">Loading tickets…</p>
        ) : bookedItems.length === 0 ? (
          <EmptyState
            message="No confirmed tickets yet."
            linkHref="/workshop"
            linkLabel="Browse Workshops"
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {bookedItems.map((item) => (
              <TicketCard key={item.id} item={item} status="Confirmed" />
            ))}
          </div>
        )}
      </Section>

      <Section title="Your Cart">
        {cartItems.length === 0 ? (
          <EmptyState
            message="Your cart is empty."
            linkHref="/events"
            linkLabel="Browse Events"
          />
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 mb-4">
              {cartItems.map((item) => (
                <TicketCard
                  key={item.key}
                  item={item}
                  status="In Cart"
                  onRemove={() => removeItem(item.key)}
                />
              ))}
            </div>
            <Link
              href="/cart"
              className="inline-flex items-center gap-2 rounded-full bg-cyan-400 px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-black hover:bg-white transition-colors"
            >
              Go to Checkout →
            </Link>
          </>
        )}
      </Section>
    </ProfileShell>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-white/40">
        {label}
      </label>
      {children}
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-1">{label}</p>
      <p className="text-sm text-white">{value || '—'}</p>
    </div>
  );
}

function ProfileShell({ children }) {
  return (
    <div className="relative min-h-[calc(100dvh-12rem)] bg-[#030508] text-white overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(6,182,212,0.12),transparent_55%)]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)',
          backgroundSize: '72px 72px',
        }}
      />
      <div className="relative z-10 mx-auto max-w-4xl px-6 pt-28 pb-24 md:pt-32">
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
          transition={{ delay: 0.05 }}
          className="font-syncopate text-4xl md:text-6xl font-bold uppercase tracking-tighter leading-[0.95] mb-10"
        >
          Profile
        </motion.h1>
        {children}
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="mb-12">
      <h2 className="mb-4 text-[11px] font-black uppercase tracking-[0.25em] text-white/50">
        {title}
      </h2>
      {children}
    </div>
  );
}

function EmptyState({ message, linkHref, linkLabel }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center">
      <p className="text-white/40 text-sm mb-4">{message}</p>
      <Link
        href={linkHref}
        className="text-cyan-400 text-xs font-bold uppercase tracking-[0.2em] hover:underline"
      >
        {linkLabel} →
      </Link>
    </div>
  );
}

function TicketCard({ item, status, onRemove }) {
  const accent = item.accentColor || '#22d3ee';
  return (
    <div
      className="relative overflow-hidden rounded-xl border p-4 flex gap-3"
      style={{ borderColor: `${accent}40`, background: `${accent}0d` }}
    >
      {item.image && (
        <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg">
          <Image src={item.image} alt={item.title} fill className="object-cover" sizes="64px" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-white">{item.title}</p>
        <p className="truncate text-xs text-white/40">{item.subtitle}</p>
        <span
          className="mt-1 inline-block rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide"
          style={{ background: `${accent}22`, color: accent }}
        >
          {status}
        </span>
      </div>
      {onRemove && (
        <button
          onClick={onRemove}
          className="self-start text-white/30 hover:text-red-400 text-xs"
          aria-label="Remove from cart"
        >
          ✕
        </button>
      )}
    </div>
  );
}
