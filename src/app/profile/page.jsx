'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import QRCode from 'qrcode';
import { QrCode, ScanLine, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import useProfile from '../hooks/useProfile';
import ProfileAvatar from '../components/ProfileAvatar';
import FetchIntro from '../components/FetchIntro';
import QrScanner from '../components/QrScanner';
import { getCatalog } from '@/lib/catalogStore';
import { supabase } from '@/lib/supabaseClient';

async function authedFetch(url, options = {}) {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}

const GENDER_LABELS = {
  male: 'Male',
  female: 'Female',
  other: 'Other',
};

export default function ProfilePage() {
  const { user, loading, signOut } = useAuth();
  const { items: cartItems, removeItem } = useCart();
  const { profile, loading: profileLoading, save } = useProfile();
  const [registration, setRegistration] = useState(null);
  const [fetching, setFetching] = useState(false);
  const [catalog, setCatalog] = useState([]);

  useEffect(() => {
    let active = true;
    Promise.all([getCatalog('workshop'), getCatalog('event')]).then(([workshops, events]) => {
      if (active) setCatalog([...workshops, ...events]);
    });
    return () => {
      active = false;
    };
  }, []);

  function findCatalogItem(id) {
    return catalog.find((c) => c.id === id);
  }

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    college: '',
    collegeId: '',
    aadhaarNumber: '',
    city: '',
    gender: '',
    address: '',
  });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [scanResult, setScanResult] = useState(null); // { data } | { error }

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
      collegeId: profile.college_id || '',
      aadhaarNumber: profile.aadhaar_number || '',
      city: profile.city || '',
      gender: profile.gender || '',
      address: profile.address || '',
    });
  }, [profile]);

  useEffect(() => {
    // First time in: if mandatory fields are missing, drop straight into
    // edit mode. Must wait on auth resolving too, not just profileLoading —
    // useProfile() reports { profile: null, loading: false } immediately
    // whenever there's no user yet, which is also true for the split
    // second on every reload before the session is restored. Without the
    // `loading`/`user` guard here, that transient null profile looked like
    // "mandatory fields missing" and force-opened edit mode on every reload,
    // even for a fully-filled-out profile.
    if (loading || !user) return;
    if (
      !profileLoading &&
      (!profile ||
        !profile.name ||
        !profile.phone ||
        !profile.college ||
        !profile.college_id ||
        !profile.aadhaar_number ||
        !profile.gender)
    ) {
      setEditing(true);
    }
  }, [loading, user, profileLoading, profile]);

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError('');
    if (
      !form.name.trim() ||
      !form.phone.trim() ||
      !form.college.trim() ||
      !form.collegeId.trim() ||
      !form.aadhaarNumber.trim() ||
      !form.gender
    ) {
      setFormError('Name, phone number, college, college ID, Aadhaar number, and gender are required.');
      return;
    }
    if (!/^\d{12}$/.test(form.aadhaarNumber.trim())) {
      setFormError('Aadhaar number must be exactly 12 digits.');
      return;
    }
    setSaving(true);
    const result = await save({
      name: form.name.trim(),
      phone: form.phone.trim(),
      college: form.college.trim(),
      college_id: form.collegeId.trim(),
      aadhaar_number: form.aadhaarNumber.trim(),
      city: form.city.trim(),
      gender: form.gender || null,
      address: form.address.trim() || null,
    });
    setSaving(false);
    if (result.error) {
      setFormError(result.error);
      return;
    }
    setEditing(false);
  };

  if (loading) {
    return <FetchIntro loading label="Loading Profile" accentColor="#33d6ff" />;
  }

  if (!user) {
    return (
      <ProfileShell>
        <div className="glass-card rounded-2xl p-8 text-center">
          <p className="text-white/60 mb-4">Sign in to see your bookings, tickets, and cart.</p>
          <Link href="/login?redirect=/profile" className="btn-primary">
            Sign In / Create Account
          </Link>
        </div>
      </ProfileShell>
    );
  }

  const bookedIds = Array.isArray(registration?.workshop_ids) ? registration.workshop_ids : [];
  const bookedItems = bookedIds
    .map((raw) => findCatalogItem(String(raw).trim()))
    .filter(Boolean);

  const handleScan = async (code) => {
    setShowScanner(false);
    setScanResult({ loading: true });
    try {
      const res = await authedFetch(`/api/scan?code=${encodeURIComponent(code)}`);
      const json = await res.json();
      if (!json.success) {
        setScanResult({ error: json.message || 'No attendee found for that code.' });
        return;
      }
      setScanResult({ data: json.data });
    } catch (err) {
      setScanResult({ error: err.message || 'Something went wrong looking that code up.' });
    }
  };

  return (
    <ProfileShell>
      <FetchIntro loading={fetching} label="Loading Profile" accentColor="#33d6ff" />
      {/* ── Identity card ─────────────────────────────────────── */}
      <div className="mb-10 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <div className="flex flex-wrap items-center gap-5 mb-6">
          <ProfileAvatar seed={user.id} name={profile?.name} email={user.email} size={80} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-bold text-white">{profile?.name || 'Unnamed Attendee'}</p>
            <p className="truncate text-sm text-white/40">{user.email}</p>
            {profile?.unique_code && (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowQr(true)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3 py-1 font-mono text-xs tracking-[0.15em] text-cyan-300 hover:border-cyan-400/70 hover:bg-cyan-500/20 transition-colors"
                >
                  <QrCode size={13} />
                  {profile.unique_code}
                </button>
                <span className="text-[10px] uppercase tracking-[0.15em] text-white/30">
                  Click to view QR
                </span>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setScanResult(null);
                setShowScanner(true);
              }}
              className="flex items-center gap-1.5 rounded-full border border-white/15 px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/70 hover:border-cyan-400/50 hover:text-cyan-300 transition-colors"
            >
              <ScanLine size={13} /> Scan
            </button>
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
              <Field label="College ID *">
                <input
                  required
                  value={form.collegeId}
                  onChange={(e) => setForm({ ...form, collegeId: e.target.value })}
                  className="w-full rounded-lg border border-white/15 bg-black/40 px-4 py-2.5 text-sm outline-none focus:border-cyan-500/60"
                />
              </Field>
              <Field label="Aadhaar Number *">
                <input
                  required
                  inputMode="numeric"
                  maxLength={12}
                  placeholder="12-digit Aadhaar number"
                  value={form.aadhaarNumber}
                  onChange={(e) => setForm({ ...form, aadhaarNumber: e.target.value.replace(/\D/g, '') })}
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
              <Field label="Gender">
                <select
                  required
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  className="w-full rounded-lg border border-white/15 bg-black/40 px-4 py-2.5 text-sm outline-none focus:border-cyan-500/60"
                >
                  <option value="">Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </Field>
              <Field label="Address (optional)">
                <textarea
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  rows={2}
                  className="w-full rounded-lg border border-white/15 bg-black/40 px-4 py-2.5 text-sm outline-none focus:border-cyan-500/60 sm:col-span-2"
                  placeholder="House no, lane, landmark, city, pincode…"
                />
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
              {profile?.name && profile?.phone && profile?.college && profile?.college_id && profile?.aadhaar_number && (
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
            <Detail label="Email" value={user.email} />
            <Detail label="Phone" value={profile?.phone} />
            <Detail label="College" value={profile?.college} />
            <Detail label="College ID" value={profile?.college_id} />
            <Detail label="Aadhaar Number" value={profile?.aadhaar_number} />
            <Detail label="City" value={profile?.city || '—'} />
            <Detail label="Gender" value={GENDER_LABELS[profile?.gender] || '—'} />
            <Detail label="Address" value={profile?.address || '—'} />
          </div>
        )}
      </div>

      <Section title="Stay & Merch">
        <p className="-mt-2 mb-4 text-xs text-white/40">
          These fields are set by event admins only during check-in/check-out and cannot be edited from your profile.
        </p>
        <div className="glass-card grid gap-4 rounded-2xl p-6 sm:grid-cols-3">
          <StayMerchField
            label="Accommodation"
            value={
              profile?.accommodation_room
                ? profile.accommodation_room
                : profile?.accommodation_booked
                ? 'Booked'
                : null
            }
            adminManaged
          />
          <StayMerchField
            label="Check-in"
            value={
              profile?.accommodation_checkin
                ? new Date(profile.accommodation_checkin).toLocaleString()
                : null
            }
            adminManaged
          />
          <StayMerchField
            label="Check-out"
            value={
              profile?.accommodation_checkout
                ? new Date(profile.accommodation_checkout).toLocaleString()
                : null
            }
            adminManaged
          />
          <StayMerchField label="Merch" value={profile?.merch_selection || null} span />
        </div>
      </Section>

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
          <>
            {registration?.payment_id && (
              <p className="mb-4 text-xs text-white/40">
                Payment ID:{' '}
                <span className="font-mono text-cyan-300/90">{registration.payment_id}</span>
              </p>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              {bookedItems.map((item) => (
                <div key={item.id} className="space-y-2">
                  <TicketCard item={item} status="Confirmed" />
                  <TeamPanel item={item} profile={profile} />
                </div>
              ))}
            </div>
          </>
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

      <AnimatePresence>
        {showQr && profile?.unique_code && (
          <QrCodeModal code={profile.unique_code} onClose={() => setShowQr(false)} />
        )}
        {showScanner && <QrScanner onScan={handleScan} onClose={() => setShowScanner(false)} />}
        {scanResult && (
          <ScanResultModal
            result={scanResult}
            onRescan={() => {
              setScanResult(null);
              setShowScanner(true);
            }}
            onClose={() => setScanResult(null)}
          />
        )}
      </AnimatePresence>
    </ProfileShell>
  );
}

function QrCodeModal({ code, onClose }) {
  const [dataUrl, setDataUrl] = useState('');

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(code, { margin: 1, width: 320, color: { dark: '#031014', light: '#e5faff' } }).then(
      (url) => active && setDataUrl(url)
    );
    return () => {
      active = false;
    };
  }, [code]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0, rotate: -6 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        exit={{ scale: 0.6, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 18 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xs rounded-2xl border border-cyan-500/30 bg-[#050b0f] p-6 text-center"
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full border border-white/15 p-1.5 text-white/60 hover:border-red-400/50 hover:text-red-300 transition-colors"
          aria-label="Close"
        >
          <X size={16} />
        </button>
        <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.3em] text-cyan-400/90">Your CNS-id</p>
        {dataUrl ? (
          <motion.img
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            src={dataUrl}
            alt={`QR code for ${code}`}
            className="mx-auto w-full rounded-xl"
          />
        ) : (
          <div className="mx-auto aspect-square w-full animate-pulse rounded-xl bg-white/5" />
        )}
        <p className="mt-4 font-mono text-sm tracking-[0.15em] text-cyan-300">{code}</p>
      </motion.div>
    </motion.div>
  );
}

function ScanResultModal({ result, onRescan, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#050b0f] p-6"
      >
        {result.loading && <p className="text-center text-sm text-white/50">Looking up attendee…</p>}

        {result.error && (
          <>
            <p className="mb-4 text-center text-sm text-red-300">{result.error}</p>
            <div className="flex gap-2">
              <button onClick={onRescan} className="flex-1 rounded-full bg-cyan-400 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-black hover:bg-white transition-colors">
                Rescan
              </button>
              <button onClick={onClose} className="flex-1 rounded-full border border-white/15 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/70 hover:text-white transition-colors">
                Close
              </button>
            </div>
          </>
        )}

        {result.data && (
          <>
            <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.3em] text-cyan-400/90">Attendee</p>
            <p className="mb-3 text-lg font-bold text-white">{result.data.name || 'Unnamed'}</p>
            <div className="mb-4 space-y-1.5 text-xs text-white/60">
              <p>CNS-id: <span className="text-cyan-300">{result.data.unique_code}</span></p>
              <p>Phone: {result.data.phone || '—'}</p>
              <p>College: {result.data.college || '—'}</p>
              <p>City: {result.data.city || '—'}</p>
              <p>Gender: {GENDER_LABELS[result.data.gender] || '—'}</p>
              <p>Workshops: {result.data.workshops?.join(', ') || '—'}</p>
              <p>Events: {result.data.events?.join(', ') || '—'}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={onRescan} className="flex-1 rounded-full bg-cyan-400 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-black hover:bg-white transition-colors">
                Rescan
              </button>
              <button onClick={onClose} className="flex-1 rounded-full border border-white/15 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/70 hover:text-white transition-colors">
                Close
              </button>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
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

function StayMerchField({ label, value, span, adminManaged }) {
  return (
    <div className={span ? 'sm:col-span-3' : undefined}>
      <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-1">{label}</p>
      {value ? (
        <p className="text-sm text-white">{value}</p>
      ) : adminManaged ? (
        <p className="text-sm text-white/40">To be set by admin</p>
      ) : (
        <Link
          href="/merch"
          className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-[0.15em] text-cyan-400 hover:underline"
        >
          Set up →
        </Link>
      )}
    </div>
  );
}

// Group-size events (item.groupSize > 1) need every teammate's CNS-id
// before the roster is complete. The registrant (leader) enters the other
// codes once here; after that it's locked — only an admin can change it.
function TeamPanel({ item, profile }) {
  const [status, setStatus] = useState(null); // { groupSize, role, team, yourCode }
  const [loading, setLoading] = useState(true);
  const [codes, setCodes] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    authedFetch(`/api/team?eventId=${encodeURIComponent(item.id)}`)
      .then((res) => res.json())
      .then((json) => {
        if (!active) return;
        if (json.success) {
          setStatus(json.data);
          setCodes(Array.from({ length: Math.max(0, (json.data.groupSize || 1) - 1) }, () => ''));
        }
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [item.id]);

  const handleConfirm = async (e) => {
    e.preventDefault();
    setError('');
    if (codes.some((c) => !c.trim())) {
      setError('Fill in every teammate CNS-id.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await authedFetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: item.id, memberCodes: codes }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.message || 'Could not confirm your team.');
        return;
      }
      setStatus((prev) => ({ ...prev, role: 'leader', team: json.data }));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <p className="px-1 text-[11px] text-white/30">Loading team status…</p>;
  }
  if (!status) return null;

  const { role, team, groupSize, yourCode } = status;

  if (groupSize <= 1) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/50">Participants</p>
        <span className="mt-1.5 inline-block rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-0.5 font-mono text-[10px] text-cyan-300">
          {yourCode} (you)
        </span>
      </div>
    );
  }

  if (role === 'leader' && !team?.confirmed) {
    return (
      <form
        onSubmit={handleConfirm}
        className="space-y-2 rounded-xl border border-amber-400/25 bg-amber-400/[0.04] p-3"
      >
        <p className="text-xs font-semibold text-amber-300">
          Complete your team — {groupSize} participants required
        </p>
        <p className="text-[11px] text-white/40">You: {yourCode || profile?.unique_code}</p>
        {codes.map((c, i) => (
          <input
            key={i}
            type="text"
            value={c}
            onChange={(e) => {
              const next = [...codes];
              next[i] = e.target.value.toUpperCase();
              setCodes(next);
            }}
            placeholder={`Teammate ${i + 2} CNS-id (e.g. CNS-AB12CD)`}
            className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-xs text-white outline-none focus:border-cyan-500/60"
          />
        ))}
        {error && <p className="text-[11px] text-red-400">{error}</p>}
        <p className="text-[10px] text-white/30">
          This cannot be changed once confirmed — double-check the CNS-ids before submitting.
        </p>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-cyan-400 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-black transition-colors hover:bg-white disabled:opacity-60"
        >
          {submitting ? 'Confirming…' : 'Confirm Team'}
        </button>
      </form>
    );
  }

  if (team?.confirmed) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/50">
          Team ({team.member_codes.length})
        </p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {team.member_codes.map((code) => (
            <span
              key={code}
              className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-0.5 font-mono text-[10px] text-cyan-300"
            >
              {code}
              {code === yourCode ? ' (you)' : ''}
            </span>
          ))}
        </div>
        <p className="mt-2 text-[10px] text-white/30">
          {role === 'leader'
            ? 'Locked — not editable. Contact an event admin to make changes.'
            : "You're part of this team — not editable by you. Contact an event admin to make changes."}
        </p>
      </div>
    );
  }

  return null;
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
        <p className="truncate text-sm font-bold text-white">
          {item.title}
          {item.qty > 1 && <span className="ml-1.5 text-cyan-300">x{item.qty}</span>}
        </p>
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
