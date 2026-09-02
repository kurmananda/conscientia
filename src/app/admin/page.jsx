'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  ChevronUp,
  Search,
  ShieldCheck,
  LogOut,
  LogIn,
  Users,
  ListChecks,
  ScrollText,
  BedDouble,
  CalendarClock,
  CalendarCheck2,
  DoorOpen,
  Sparkles,
  Lock,
  UtensilsCrossed,
  ArrowUpDown,
  RefreshCw,
  Layers,
  Pencil,
  QrCode,
} from 'lucide-react';
import { getCatalog } from '@/lib/catalogStore';
import { getPromos, DEFAULT_PROMOS } from '@/lib/promoStore';
import { groupBySection } from '../lib/groupBySection';
import { FOOD_ADDONS, STAY_DATES } from '../accommodation/merchData';
import QrScanner from '../components/QrScanner';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

const ADMIN_HEADER = 'x-admin-callsign';

// Kept fresh by AdminDashboard's auth-state subscription (module-level, same
// pattern as CATALOG below) so every admin fetch can attach the current
// Supabase access token without threading it through every call site. The
// server re-checks this token's is_admin status on every request — the
// callsign header alone is not enough (see src/lib/adminAuth.js).
let ADMIN_TOKEN = null;

function adminHeaders(session, extra = {}) {
  return {
    [ADMIN_HEADER]: session.callsign,
    ...(ADMIN_TOKEN ? { Authorization: `Bearer ${ADMIN_TOKEN}` } : {}),
    ...extra,
  };
}

// Populated once by AdminDashboard's catalog-fetch effect (module-level so
// the module-scope helper functions below — findCatalogItem, paidBuckets —
// don't need the catalog threaded through every call site).
let CATALOG = [];
let WORKSHOP_IDS = new Set();
let EVENT_IDS = new Set();
const FOOD_ADDON_IDS = new Set(FOOD_ADDONS.map((f) => f.id));

function findCatalogItem(id) {
  return CATALOG.find((c) => c.id === String(id));
}

const FOOD_LABELS = Object.fromEntries(FOOD_ADDONS.map((f) => [f.id, f.label]));

// Splits a user's paid ids into separate workshop/event/food buckets with
// readable titles, for showing as distinct fields instead of one lumped
// "Tickets:" string.
function paidBuckets(user) {
  const ids = paidIds(user).map(String);
  const workshops = ids.filter((id) => WORKSHOP_IDS.has(id)).map((id) => findCatalogItem(id)?.title || id);
  const events = ids.filter((id) => EVENT_IDS.has(id)).map((id) => findCatalogItem(id)?.title || id);
  const food = ids.filter((id) => FOOD_ADDON_IDS.has(id)).map((id) => FOOD_LABELS[id] || id);
  return { workshops, events, food };
}

const STAY_DATE_LABELS = Object.fromEntries(STAY_DATES.map((d) => [d.id, d.label]));

function dateSuffix(cartRow) {
  const dates = cartRow?.item_data?.details?.dates;
  if (!Array.isArray(dates) || dates.length === 0) return '';
  const labels = dates.map((d) => STAY_DATE_LABELS[d] || d).join('/');
  return ` (${labels})`;
}

function cartSummary(cartItems) {
  if (!cartItems || cartItems.length === 0) return '—';
  const labels = [];
  for (const c of cartItems) {
    if (FOOD_ADDON_IDS.has(c.item_key)) {
      labels.push(`${FOOD_LABELS[c.item_key] || c.item_key}${dateSuffix(c)}`);
      continue;
    }
    if (c.item_key === 'accommodation') {
      labels.push(`Accommodation${dateSuffix(c)}`);
      continue;
    }
    labels.push(c.item_key);
  }
  return labels.join(', ') || '—';
}

// The TiQR webhook books one line per cart item and writes every paid
// item's id (workshop/event AND accommodation/food/merch/delivery) into
// registrations.workshop_ids once payment_status is 'paid' — despite the
// generic column name, this is the authoritative "what did this person
// actually pay for" list. cart_items, by contrast, is just what's currently
// sitting in someone's cart and may include unpaid/abandoned items, so it
// must never feed the counts/filters/stats below — only a separate
// "in cart" reveal.
function paidIds(user) {
  if (user.registration?.payment_status !== 'paid') return [];
  return Array.isArray(user.registration?.workshop_ids) ? user.registration.workshop_ids : [];
}

function hasEventReg(user) {
  return paidIds(user).some((id) => EVENT_IDS.has(String(id)));
}

function hasWorkshopReg(user) {
  return paidIds(user).some((id) => WORKSHOP_IDS.has(String(id)));
}

function hasAccommodation(user) {
  if (user.accommodation_room || user.accommodation_booked) return true;
  return paidIds(user).some((id) => String(id) === 'accommodation');
}

function hasFood(user) {
  return paidIds(user).some((id) => FOOD_ADDON_IDS.has(String(id)));
}

function foodBreakdown(users) {
  const counts = { breakfast: 0, lunch: 0, dinner: 0 };
  for (const u of users) {
    const ids = paidIds(u).map(String);
    if (ids.includes('breakfast')) counts.breakfast += 1;
    if (ids.includes('lunch')) counts.lunch += 1;
    if (ids.includes('dinner')) counts.dinner += 1;
  }
  return counts;
}

function accommodationStatus(user) {
  if (user.accommodation_booked || paidIds(user).some((id) => String(id) === 'accommodation')) {
    return { label: 'Booked', tone: 'booked' };
  }
  const inCart = (user.cart_items || []).some((c) => c.item_key === 'accommodation');
  if (inCart) return { label: 'In cart, not yet paid', tone: 'pending' };
  return { label: 'Not booked yet', tone: 'none' };
}

// Unpaid/in-progress cart contents — shown separately from the paid summary,
// behind an explicit reveal, never folded into counts or filters.
function inCartSummary(cartItems) {
  return cartSummary(cartItems);
}

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const [session, setSession] = useState(null); // { name, role, callsign }
  const [codeword, setCodeword] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authBusy, setAuthBusy] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthBusy(true);
    try {
      const trimmed = codeword.trim();
      if (!trimmed || !password) {
        setAuthError('Codeword/callsign and password are required.');
        return;
      }
      const { data: authSessionData } = await supabase.auth.getSession();
      const accessToken = authSessionData?.session?.access_token;
      if (!accessToken) {
        setAuthError('You must be signed in with an admin account to access this.');
        return;
      }
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ callsign: trimmed, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        setAuthError(data.message || 'Invalid codeword or password.');
        return;
      }
      const sessionData = { callsign: data.callsign, name: data.name, role: data.role };
      setSession(sessionData);
    } finally {
      setAuthBusy(false);
    }
  };

  if (!session) {
    return (
      <div className="relative min-h-[calc(100dvh-12rem)] overflow-hidden bg-[#030508] text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(6,182,212,0.14),transparent_55%)]" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)',
            backgroundSize: '72px 72px',
          }}
        />
        <div className="relative z-10 mx-auto max-w-sm px-6 pt-32 pb-24">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex items-center gap-2"
          >
            <Lock size={14} className="text-cyan-400" />
            <p className="section-eyebrow">Restricted</p>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="section-heading mb-8 text-3xl"
          >
            Admin Access
          </motion.h1>
          {authLoading ? (
            <p className="text-sm text-white/50">Checking your session…</p>
          ) : !user ? (
            <div className="glass-card space-y-3 rounded-2xl border border-cyan-500/10 p-6 shadow-[0_0_40px_rgba(6,182,212,0.06)]">
              <p className="text-sm text-white/70">
                You need to be signed in with an admin account before the codeword/password will work.
              </p>
              <a href="/login" className="btn-primary block w-full text-center">
                Sign in
              </a>
            </div>
          ) : (
            <motion.form
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              onSubmit={handleLogin}
              className="glass-card space-y-4 rounded-2xl border border-cyan-500/10 p-6 shadow-[0_0_40px_rgba(6,182,212,0.06)]"
            >
              <div>
                <label className="mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-white/40">
                  Codeword / Callsign
                </label>
                <input
                  type="text"
                  required
                  value={codeword}
                  onChange={(e) => setCodeword(e.target.value)}
                  className="w-full rounded-lg border border-white/15 bg-black/40 px-4 py-2.5 text-sm outline-none transition-colors focus:border-cyan-500/60"
                  placeholder="yeah that one..,"
                />

              </div>
              <div>
                <label className="mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-white/40">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-white/15 bg-black/40 px-4 py-2.5 text-sm outline-none transition-colors focus:border-cyan-500/60"
                  placeholder="••••••••"
                />
              </div>
              {authError && (
                <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                  {authError}
                </p>
              )}
              <button type="submit" disabled={authBusy} className="btn-primary w-full">
                {authBusy ? 'Verifying…' : 'Enter'}
              </button>
            </motion.form>
          )}
        </div>
      </div>
    );
  }

  return <AdminDashboard session={session} onLogout={() => setSession(null)} />;
}

const TABS = [
  { key: 'registrants', label: 'Registrants', icon: Users },
  { key: 'checkin', label: 'Check In', icon: QrCode },
  { key: 'catalog', label: 'Catalog', icon: Layers },
  { key: 'tickets', label: 'Tickets', icon: Lock },
  { key: 'promo', label: 'Promo', icon: Sparkles },
  { key: 'logs', label: 'Logs', icon: ScrollText },
  { key: 'admins', label: 'Admins', icon: ShieldCheck },
];

const PROMO_FIELDS = [
  { key: 'badge_label', label: 'Badge Label' },
  { key: 'heading', label: 'Heading' },
  { key: 'price', label: 'Price' },
  { key: 'link', label: 'Link' },
  { key: 'image_front', label: 'Front Image URL' },
  { key: 'image_back', label: 'Back Image URL' },
];

// Fields the catalog edit form can write — kept in sync with
// EDITABLE_FIELDS in /api/admin/catalog/route.js. `id`, price, and any
// ticket/payment-derived data are deliberately absent: catalog item ids are
// also what /src/lib/ticketCatalog.js keys ticket ids off of, so they (and
// price) must never change from this UI.
const CATALOG_TEXT_FIELDS = [
  { key: 'title', label: 'Title' },
  { key: 'subtitle', label: 'Subtitle' },
  { key: 'type', label: 'Type' },
  { key: 'section', label: 'Section' },
  { key: 'section_color', label: 'Section Color', hint: '#33d6ff', color: true },
  { key: 'duration', label: 'Duration (days)' },
  { key: 'seats', label: 'Seats' },
  { key: 'group_size', label: 'Group Size (1 = individual, no team required)' },
  { key: 'eligibility', label: 'Eligibility' },
  { key: 'venue', label: 'Venue' },
  { key: 'event_date', label: 'Date', hint: 'e.g. 12 Mar 2026' },
  { key: 'timing', label: 'Time', hint: 'e.g. 4:00 PM' },
  { key: 'prize_pool', label: 'Prize Pool', hint: 'e.g. ₹50,000' },
  {
    key: 'strike_price',
    label: 'Fake Original Price (marketing only — shown struck through next to the real price)',
    hint: 'e.g. ₹1,499',
  },
  { key: 'image', label: 'Image URL', hint: 'https://…' },
  { key: 'badge_icon', label: 'Badge URL', hint: 'https://… (or an emoji)' },
  { key: 'accent_color', label: 'Accent Color', color: true },
  { key: 'format', label: 'Format' },
  { key: 'certificate', label: 'Certificate' },
  { key: 'brochure_url', label: 'Brochure URL' },
];

// Stored as jsonb arrays in the DB, but edited here as a single plain-text
// block (one line per item) rather than chips — only Coordinator Access
// below needs true multi-value chip editing.
const CATALOG_TEXTAREA_FIELDS = [
  { key: 'description', label: 'Description' },
  { key: 'about_extra', label: 'About (one per line)' },
  { key: 'highlights', label: 'Highlights (one per line)' },
  { key: 'requirements', label: 'Requirements (one per line)' },
  { key: 'tags', label: 'Tags (one per line)' },
];

// Keys within CATALOG_TEXTAREA_FIELDS that the DB stores as a jsonb array —
// split back into an array (one entry per non-empty line) on save.
const TEXTAREA_LIST_KEYS = new Set(['about_extra', 'highlights', 'requirements', 'tags']);

// List-shaped fields, edited as chips (type + Enter to add). Coordinator
// Access is the one field that genuinely needs multiple values.
const CATALOG_LIST_FIELDS = [
  { key: 'access', label: 'Coordinator Access — CNS-ids (never shown publicly; grants /data visibility)' },
];

// Rendered with dedicated color-stop pickers instead of a plain text input.
const CATALOG_COLOR_FIELDS = [
  { key: 'glow_color', label: 'Glow Color' },
  { key: 'foil_gradient', label: 'Foil Gradient' },
];

const FILTERS = [
  { key: 'event', label: 'Has Event', icon: Sparkles, test: hasEventReg },
  { key: 'workshop', label: 'Has Workshop', icon: ListChecks, test: hasWorkshopReg },
  { key: 'food', label: 'Has Food', icon: UtensilsCrossed, test: hasFood },
  { key: 'accommodation', label: 'Has Accommodation', icon: BedDouble, test: hasAccommodation },
];

function AdminDashboard({ session, onLogout }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [tab, setTab] = useState('registrants'); // 'registrants' | 'logs' | 'admins'
  const [activeFilters, setActiveFilters] = useState([]); // ['event','workshop','food','accommodation']
  const [foodSort, setFoodSort] = useState(false);
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState('');
  const [logsLoaded, setLogsLoaded] = useState(false);
  const [logFilter, setLogFilter] = useState('changes'); // 'all' | 'changes' | 'login' | 'logout'
  const [admins, setAdmins] = useState([]);
  const [adminsLoading, setAdminsLoading] = useState(false);
  const [adminsError, setAdminsError] = useState('');
  const [adminsLoaded, setAdminsLoaded] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [catalogReady, setCatalogReady] = useState(false);

  // Refreshed on mount AND every time users reload (see loadUsers below) —
  // otherwise a workshop/event added mid-session stays absent from
  // WORKSHOP_IDS/EVENT_IDS, and a registrant who paid for it shows up with
  // that item silently missing from their Workshops/Events buckets.
  const loadCatalogSets = async () => {
    const [workshops, events] = await Promise.all([getCatalog('workshop'), getCatalog('event')]);
    CATALOG = [...workshops, ...events];
    WORKSHOP_IDS = new Set(workshops.map((c) => String(c.id)));
    EVENT_IDS = new Set(events.map((c) => String(c.id)));
    setCatalogReady(true);
  };

  useEffect(() => {
    loadCatalogSets();
  }, []);

  // Keeps ADMIN_TOKEN current for every admin fetch below — logging out of
  // the underlying Supabase account (or the token expiring/refreshing)
  // updates it immediately, since the server re-verifies it on every call.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      ADMIN_TOKEN = data?.session?.access_token || null;
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, authSession) => {
      ADMIN_TOKEN = authSession?.access_token || null;
    });
    return () => sub?.subscription?.unsubscribe();
  }, []);

  const [catalogItems, setCatalogItems] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState('');
  const [catalogLoaded, setCatalogLoaded] = useState(false);
  const [expandedCatalogId, setExpandedCatalogId] = useState(null);
  const [catalogKindFilter, setCatalogKindFilter] = useState('all'); // 'all' | 'workshop' | 'event'

  const [promos, setPromos] = useState(null);
  const [promoLoaded, setPromoLoaded] = useState(false);

  const loadPromo = async () => {
    const data = await getPromos();
    setPromos(data);
    setPromoLoaded(true);
  };

  useEffect(() => {
    if (tab === 'promo' && !promoLoaded) loadPromo();
  }, [tab, promoLoaded]);

  const [tickets, setTickets] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [ticketsError, setTicketsError] = useState('');
  const [ticketsLoaded, setTicketsLoaded] = useState(false);

  const loadTicketsAdmin = async () => {
    setTicketsLoading(true);
    setTicketsError('');
    try {
      const res = await fetch('/api/admin/tickets', { headers: adminHeaders(session) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        setTicketsError(data.message || 'Failed to load tickets.');
        return;
      }
      setTickets(data.data || []);
      setTicketsLoaded(true);
    } finally {
      setTicketsLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 'tickets' && !ticketsLoaded) loadTicketsAdmin();
  }, [tab, ticketsLoaded]);

  const [toasts, setToasts] = useState([]);
  const pushToast = (message, tone = 'ok') => {
    const id = Date.now() + Math.random();
    setToasts((cur) => [...cur, { id, message, tone }]);
    setTimeout(() => setToasts((cur) => cur.filter((t) => t.id !== id)), 3200);
  };

  const loadCatalog = async () => {
    setCatalogLoading(true);
    setCatalogError('');
    try {
      const res = await fetch('/api/admin/catalog', {
        headers: adminHeaders(session),
        cache: 'no-store',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setCatalogError(data.message || 'Failed to load catalog.');
        return;
      }
      setCatalogItems(data.data || []);
      setCatalogLoaded(true);
    } finally {
      setCatalogLoading(false);
    }
  };

  // Reorders one item within its own kind (workshop/event). sort_order is a
  // plain `integer not null default 0` column, and most rows still sit at
  // that default — a fractional-midpoint swap doesn't work here (ties at 0
  // mean "the neighbor" and "the one beyond it" are often the same value,
  // and a non-integer write is rejected by the column type anyway). Instead,
  // splice the moved item into its new position and renumber the whole
  // kind's list to clean multiples of 10 in that order — always correct
  // regardless of whatever mess the existing values were in.
  const moveCatalogOrder = async (item, dir) => {
    const kindList = catalogItems.filter((c) => c.kind === item.kind && c.title);
    const idx = kindList.findIndex((c) => c.id === item.id);
    const targetIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (idx === -1 || targetIdx < 0 || targetIdx >= kindList.length) return;

    const reordered = kindList.slice();
    const [moved] = reordered.splice(idx, 1);
    reordered.splice(targetIdx, 0, moved);

    const results = await Promise.all(
      reordered.map((c, i) =>
        fetch('/api/admin/catalog', {
          method: 'PATCH',
          headers: adminHeaders(session, { 'Content-Type': 'application/json' }),
          body: JSON.stringify({ id: c.id, kind: c.kind, fields: { sort_order: i * 10 } }),
        }).then((res) => res.json().catch(() => ({})))
      )
    );
    if (results.some((r) => !r.success)) {
      pushToast?.('Failed to reorder — some items may not have saved.', 'error');
    }
    loadCatalog();
  };

  useEffect(() => {
    if (tab === 'catalog' && !catalogLoaded) loadCatalog();
  }, [tab, catalogLoaded]);

  const loadAdmins = async () => {
    setAdminsLoading(true);
    setAdminsError('');
    try {
      const res = await fetch('/api/admin/list', {
        headers: adminHeaders(session),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAdminsError(data.message || 'Failed to load admins.');
        return;
      }
      setAdmins(data.data || []);
      setAdminsLoaded(true);
    } finally {
      setAdminsLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 'admins' && !adminsLoaded) loadAdmins();
  }, [tab, adminsLoaded]);

  const loadLogs = async () => {
    setLogsLoading(true);
    setLogsError('');
    try {
      const res = await fetch('/api/admin/logs', {
        headers: adminHeaders(session),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setLogsError(data.message || 'Failed to load logs.');
        return;
      }
      setLogs(data.data || []);
      setLogsLoaded(true);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 'logs' && !logsLoaded) loadLogs();
  }, [tab, logsLoaded]);

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const [res] = await Promise.all([
        fetch('/api/admin/users', { headers: adminHeaders(session) }),
        loadCatalogSets(),
      ]);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.message || 'Failed to load users.');
        return;
      }
      setUsers(data.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (tab === 'logs') await loadLogs();
      else if (tab === 'admins') await loadAdmins();
      else if (tab === 'catalog') await loadCatalog();
      else await loadUsers();
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/admin/logout', {
        method: 'POST',
        headers: adminHeaders(session, { 'Content-Type': 'application/json' }),
        body: JSON.stringify({ callsign: session.callsign }),
      });
    } catch {
      // ignore network errors — still log the user out locally
    } finally {
      setLoggingOut(false);
      onLogout?.();
    }
  };

  const toggleFilter = (key) => {
    setActiveFilters((prev) => (prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key]));
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = users;
    if (q) {
      list = list.filter((u) =>
        [u.name, u.unique_code, u.phone].some((v) => (v || '').toLowerCase().includes(q))
      );
    }
    if (activeFilters.length > 0) {
      list = list.filter((u) => {
        return activeFilters.every((f) => {
          const filterDef = FILTERS.find((fd) => fd.key === f);
          return filterDef ? filterDef.test(u) : true;
        });
      });
    }
    if (foodSort) {
      list = list
        .map((u, i) => ({ u, i }))
        .sort((a, b) => {
          const af = hasFood(a.u) ? 0 : 1;
          const bf = hasFood(b.u) ? 0 : 1;
          if (af !== bf) return af - bf;
          return a.i - b.i;
        })
        .map(({ u }) => u);
    }
    return list;
  }, [users, search, activeFilters, foodSort]);

  const filterCounts = useMemo(() => {
    const counts = {};
    for (const f of FILTERS) counts[f.key] = users.filter(f.test).length;
    return counts;
  }, [users]);

  const stats = useMemo(() => {
    const food = foodBreakdown(users);
    return {
      workshop: users.filter(hasWorkshopReg).length,
      event: users.filter(hasEventReg).length,
      food: users.filter(hasFood).length,
      foodBreakdown: food,
      accommodation: users.filter(hasAccommodation).length,
    };
  }, [users]);

  const eventFilterActive = activeFilters.includes('event');
  const workshopFilterActive = activeFilters.includes('workshop');
  const groupMode = eventFilterActive || workshopFilterActive;

  const grouped = useMemo(() => {
    if (!groupMode) return null;
    // Build synthetic "cards" — one per (user, workshop_id) pair — then reuse
    // groupBySection against the catalog's section metadata.
    const rows = [];
    for (const u of filtered) {
      const ids = Array.isArray(u.registration?.workshop_ids) ? u.registration.workshop_ids : [];
      if (ids.length === 0) {
        rows.push({ section: 'Unregistered', sectionColor: '#64748b', user: u });
        continue;
      }
      for (const id of ids) {
        const item = findCatalogItem(id);
        rows.push({
          section: item?.section || 'Other',
          sectionColor: item?.sectionColor,
          user: u,
          itemTitle: item?.title || String(id),
        });
      }
    }
    return groupBySection(rows);
  }, [filtered, groupMode]);

  return (
    <div className="relative min-h-[calc(100dvh-12rem)] overflow-hidden bg-[#030508] text-white">
      <div className="pointer-events-none fixed bottom-6 right-6 z-[200] flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.95 }}
              className={`rounded-lg border px-4 py-2 text-xs font-medium shadow-lg backdrop-blur-md ${
                t.tone === 'error'
                  ? 'border-red-500/40 bg-red-500/15 text-red-200'
                  : 'border-cyan-500/40 bg-cyan-500/15 text-cyan-200'
              }`}
            >
              {t.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(6,182,212,0.12),transparent_55%)]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)',
          backgroundSize: '72px 72px',
        }}
      />
      <div className="relative z-10 mx-auto max-w-6xl px-6 pt-28 pb-24">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <p className="section-eyebrow mb-2">Admin Portal</p>
            <h1 className="section-heading text-3xl">
              Welcome, {session.name || session.callsign}
            </h1>
            <p className="mt-1 flex items-center gap-2 text-xs text-white/40">
              <ShieldCheck size={14} className="text-cyan-400" />
              {session.role || 'Admin'}
              <span className="text-white/20">·</span>
              <span className="font-mono text-white/30">{session.callsign}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              title="Refresh"
              aria-label="Refresh"
              className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/25 bg-cyan-500/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300/90 transition-colors hover:border-cyan-400/50 hover:text-cyan-200 disabled:opacity-60"
            >
              <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? 'Refreshing…' : 'Refresh'}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="inline-flex items-center gap-1.5 rounded-full border border-red-500/25 bg-red-500/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-red-300/90 transition-colors hover:border-red-400/50 hover:text-red-200 disabled:opacity-60"
            >
              <LogOut size={13} />
              {loggingOut ? 'Signing out…' : 'Log Out'}
            </button>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-2">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${
                tab === key
                  ? 'border-cyan-400/60 bg-cyan-500/15 text-cyan-200'
                  : 'border-white/10 bg-white/[0.02] text-white/50 hover:border-white/25 hover:text-white/80'
              }`}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {tab === 'checkin' && (
            <motion.div
              key="checkin"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              <CheckInPanel session={session} pushToast={pushToast} users={users} onRefresh={loadUsers} />
            </motion.div>
          )}

          {tab === 'tickets' && (
            <motion.div
              key="tickets"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              <p className="mb-4 text-[10px] uppercase tracking-[0.2em] text-cyan-400/80">
                Read-only — the only place ticket ids exist. Managed directly in Supabase, not this
                portal. Adding a workshop/event row there makes it appear (blank) in the Catalog tab.
              </p>
              {ticketsLoading && <p className="text-sm text-white/40">Loading tickets…</p>}
              {ticketsError && (
                <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                  {ticketsError}
                </p>
              )}
              {!ticketsLoading && !ticketsError && <TicketsTable tickets={tickets} />}
            </motion.div>
          )}

          {tab === 'promo' && (
            <motion.div
              key="promo"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              {!promos ? (
                <p className="text-sm text-white/40">Loading…</p>
              ) : (
                <div className="space-y-6">
                  <div>
                    <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-cyan-400/80">
                      Limited Drop — homepage strip
                    </p>
                    <PromoEditor
                      id="limited_drop"
                      promo={promos.limited_drop}
                      session={session}
                      pushToast={pushToast}
                      onSaved={loadPromo}
                    />
                  </div>
                  <div>
                    <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-cyan-400/80">
                      Exclusive — floating notification
                    </p>
                    <PromoEditor
                      id="exclusive"
                      promo={promos.exclusive}
                      session={session}
                      pushToast={pushToast}
                      onSaved={loadPromo}
                    />
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {tab === 'catalog' && (
            <motion.div
              key="catalog"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="space-y-2"
            >
              <div className="mb-3 flex flex-wrap items-center gap-2">
                {[
                  { key: 'all', label: 'All' },
                  { key: 'workshop', label: 'Workshops' },
                  { key: 'event', label: 'Events' },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setCatalogKindFilter(key)}
                    className={`rounded-full border px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${
                      catalogKindFilter === key
                        ? 'border-cyan-400/60 bg-cyan-500/15 text-cyan-200'
                        : 'border-white/10 bg-white/[0.02] text-white/50 hover:border-white/25 hover:text-white/80'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {catalogLoading && <p className="text-sm text-white/40">Loading catalog…</p>}
              {catalogError && (
                <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                  {catalogError}
                </p>
              )}
              {!catalogLoading && !catalogError && catalogItems.length === 0 && (
                <p className="text-sm text-white/40">No catalog items found.</p>
              )}
              {!catalogLoading &&
                !catalogError &&
                catalogItems
                  .filter((item) => catalogKindFilter === 'all' || item.kind === catalogKindFilter)
                  .map((item) => {
                    const kindList = catalogItems.filter((c) => c.kind === item.kind && c.title);
                    const posInKind = kindList.findIndex((c) => c.id === item.id);
                    return (
                      <CatalogItemRow
                        key={item.id}
                        item={item}
                        session={session}
                        expanded={expandedCatalogId === item.id}
                        onToggle={() =>
                          setExpandedCatalogId((cur) => (cur === item.id ? null : item.id))
                        }
                        onCollapse={() => setExpandedCatalogId(null)}
                        onSaved={loadCatalog}
                        pushToast={pushToast}
                        onMove={item.title ? (dir) => moveCatalogOrder(item, dir) : null}
                        canMoveUp={posInKind > 0}
                        canMoveDown={posInKind !== -1 && posInKind < kindList.length - 1}
                      />
                    );
                  })}
            </motion.div>
          )}

          {tab === 'admins' && (
            <motion.div
              key="admins"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="space-y-2"
            >
              {adminsLoading && <p className="text-sm text-white/40">Loading admins…</p>}
              {adminsError && (
                <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                  {adminsError}
                </p>
              )}
              {!adminsLoading && !adminsError && admins.length === 0 && (
                <p className="text-sm text-white/40">No admins found.</p>
              )}
              {!adminsLoading &&
                !adminsError &&
                admins.map((a) => (
                  <div
                    key={a.callsign}
                    className="glass-card flex items-center justify-between gap-3 rounded-xl p-4 text-xs transition-colors hover:border-cyan-500/20"
                  >
                    <div>
                      <p className="font-semibold text-white">{a.name || 'Unnamed'}</p>
                      <p className="font-mono text-white/40">{a.callsign}</p>
                    </div>
                    <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-[10px] uppercase tracking-wide text-cyan-300">
                      {a.role || 'Admin'}
                    </span>
                  </div>
                ))}
            </motion.div>
          )}

          {tab === 'logs' && (
            <motion.div
              key="logs"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="space-y-2"
            >
              <div className="mb-1 flex flex-wrap gap-2">
                {[
                  { key: 'changes', label: 'Changes' },
                  { key: 'all', label: 'All' },
                  { key: 'login', label: 'Logins' },
                  { key: 'logout', label: 'Logouts' },
                ].map(({ key, label }) => {
                  const count =
                    key === 'all'
                      ? logs.length
                      : key === 'changes'
                      ? logs.filter((l) => l.action?.startsWith('update_')).length
                      : logs.filter((l) => l.action === key).length;
                  const active = logFilter === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setLogFilter(key)}
                      className={`rounded-full border px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.1em] transition-colors ${
                        active
                          ? 'border-cyan-400 bg-cyan-400 text-black shadow-[0_0_0_1px_rgba(34,211,238,0.4)] ring-2 ring-cyan-300/70'
                          : 'border-white/15 bg-white/[0.03] text-white/50 hover:border-white/30 hover:text-white'
                      }`}
                    >
                      {label} ({count})
                    </button>
                  );
                })}
              </div>

              {logsLoading && <p className="text-sm text-white/40">Loading logs…</p>}
              {logsError && (
                <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                  {logsError}
                </p>
              )}
              {!logsLoading && !logsError && logs.length === 0 && (
                <p className="text-sm text-white/40">No admin actions logged yet.</p>
              )}
              {!logsLoading && !logsError && logs.length > 0 && (() => {
                const filteredLogs =
                  logFilter === 'all'
                    ? logs
                    : logFilter === 'changes'
                    ? logs.filter((l) => l.action?.startsWith('update_'))
                    : logs.filter((l) => l.action === logFilter);
                return filteredLogs.length === 0 ? (
                  <p className="text-sm text-white/40">No logs match this filter.</p>
                ) : (
                  filteredLogs.map((log) => <LogRow key={log.id} log={log} />)
                );
              })()}
            </motion.div>
          )}

          {tab === 'registrants' && (
            <motion.div
              key="registrants"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              <div className="mb-6 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
                <StatCard icon={ListChecks} label="Workshops" value={stats.workshop} />
                <StatCard icon={Sparkles} label="Events" value={stats.event} />
                <StatCard
                  icon={UtensilsCrossed}
                  label="Food"
                  value={stats.food}
                  sub={`B ${stats.foodBreakdown.breakfast} · L ${stats.foodBreakdown.lunch} · D ${stats.foodBreakdown.dinner}`}
                />
                <StatCard icon={BedDouble} label="Accommodation" value={stats.accommodation} />
              </div>

              <div className="mb-4 flex flex-wrap items-center gap-3">
                <div className="relative max-w-md flex-1 min-w-[220px]">
                  <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name, unique code, or phone…"
                    className="w-full rounded-lg border border-white/15 bg-black/40 py-2.5 pl-9 pr-4 text-sm outline-none transition-colors focus:border-cyan-500/60"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setFoodSort((v) => !v)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${
                    foodSort
                      ? 'border-cyan-300 bg-cyan-400 text-black shadow-[0_0_18px_rgba(34,211,238,0.55)] ring-2 ring-cyan-300/70'
                      : 'border-white/10 bg-white/[0.02] text-white/50 hover:border-white/25 hover:text-white/80'
                  }`}
                >
                  <ArrowUpDown size={13} />
                  {foodSort ? 'Sort: Food First' : 'Sort: Default'}
                </button>
              </div>

              <div className="mb-6 flex flex-wrap items-center gap-2">
                {FILTERS.map(({ key, label, icon: Icon }) => {
                  const active = activeFilters.includes(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleFilter(key)}
                      className={`chip inline-flex items-center gap-1.5 transition-all ${
                        active
                          ? 'border-cyan-300 bg-cyan-400 text-black font-black shadow-[0_0_18px_rgba(34,211,238,0.55)] ring-2 ring-cyan-300/70'
                          : ''
                      }`}
                    >
                      <Icon size={12} />
                      {label} ({filterCounts[key] ?? 0})
                    </button>
                  );
                })}
                {activeFilters.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveFilters([])}
                    className="text-[10px] uppercase tracking-[0.2em] text-white/30 hover:text-white/60"
                  >
                    Clear filters
                  </button>
                )}
              </div>

              {loading && <p className="text-sm text-white/40">Loading registrants…</p>}
              {error && (
                <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                  {error}
                </p>
              )}

              {!loading && !error && !groupMode && (
                <div className="space-y-2">
                  {filtered.map((u) => (
                    <UserRow
                      key={u.user_id}
                      user={u}
                      session={session}
                      expanded={expanded === u.user_id}
                      onToggle={() => setExpanded(expanded === u.user_id ? null : u.user_id)}
                      onSaved={loadUsers}
                      pushToast={pushToast}
                    />
                  ))}
                  {filtered.length === 0 && (
                    <p className="text-sm text-white/40">No registrants match your search/filters.</p>
                  )}
                </div>
              )}

              {!loading && !error && groupMode && grouped && (
                <div className="space-y-8">
                  {grouped.map((group) => (
                    <div key={group.section}>
                      <h2
                        className="mb-3 font-mono text-xs uppercase tracking-widest"
                        style={{ color: group.color }}
                      >
                        {group.section}
                      </h2>
                      <div className="space-y-2">
                        {group.cards.map((row, i) => (
                          <UserRow
                            key={`${row.user.user_id}-${i}`}
                            user={row.user}
                            session={session}
                            expanded={expanded === `${row.user.user_id}-${i}`}
                            onToggle={() =>
                              setExpanded(
                                expanded === `${row.user.user_id}-${i}` ? null : `${row.user.user_id}-${i}`
                              )
                            }
                            onSaved={loadUsers}
                            pushToast={pushToast}
                            subtitle={row.itemTitle}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="glass-card flex items-center gap-3 rounded-xl border border-white/10 p-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-cyan-500/25 bg-cyan-500/10 text-cyan-300">
        <Icon size={16} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">{label}</p>
        <p className="text-lg font-black leading-tight text-white">{value}</p>
        {sub && <p className="truncate text-[10px] text-white/30">{sub}</p>}
      </div>
    </div>
  );
}

function LogRow({ log }) {
  const isAuth = log.action === 'login' || log.action === 'logout';
  const Icon = log.action === 'login' ? LogIn : log.action === 'logout' ? LogOut : ScrollText;
  return (
    <div
      className={`glass-card rounded-xl p-4 text-xs ${
        isAuth ? 'border-white/10' : 'border-cyan-500/10'
      }`}
    >
      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 font-semibold text-cyan-300">
          <Icon size={12} className={isAuth ? 'text-white/40' : 'text-cyan-400'} />
          {log.admin_name || log.admin_callsign || 'Unknown admin'}
        </span>
        <span className="text-white/30">
          {log.created_at ? new Date(log.created_at).toLocaleString() : '—'}
        </span>
      </div>
      <p className="text-white/60">
        {log.action || 'update'}
        {log.target_email || log.target_user_id ? (
          <>
            {' '}on <span className="text-white/80">{log.target_email || log.target_user_id}</span>
          </>
        ) : null}
      </p>
      {log.changes && (
        <pre className="mt-2 overflow-x-auto rounded-lg bg-black/40 p-2 text-[10px] text-white/40">
          {JSON.stringify(log.changes, null, 2)}
        </pre>
      )}
    </div>
  );
}

function CheckInPanel({ session, pushToast, users, onRefresh }) {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null); // { loading } | { error } | { data, already }
  const [manualCode, setManualCode] = useState('');

  const handleScan = async (code) => {
    setScanning(false);
    setResult({ loading: true });
    try {
      const res = await fetch('/api/admin/checkin', {
        method: 'POST',
        headers: adminHeaders(session, { 'Content-Type': 'application/json' }),
        body: JSON.stringify({ code }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        setResult({ error: json.message || 'No attendee found for that code.' });
        return;
      }
      setResult({ data: json.data, already: !!json.already_checked_in });
      pushToast?.(
        json.already_checked_in
          ? `${json.data.name || json.data.unique_code} was already checked in.`
          : `Checked in ${json.data.name || json.data.unique_code}.`
      );
      if (!json.already_checked_in) onRefresh?.();
    } catch (err) {
      setResult({ error: err.message || 'Something went wrong.' });
    }
  };

  const checkedIn = (users || [])
    .filter((u) => u.checked_in_at)
    .sort((a, b) => new Date(b.checked_in_at) - new Date(a.checked_in_at));

  return (
    <div>
      <p className="mb-4 text-[10px] uppercase tracking-[0.2em] text-cyan-400/80">
        Scan an attendee&apos;s QR to stamp their check-in time — rescanning an already checked-in
        attendee won&apos;t overwrite it.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => {
            setResult(null);
            setScanning(true);
          }}
          className="inline-flex items-center gap-2 rounded-full bg-cyan-400 px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-black hover:bg-white transition-colors"
        >
          <QrCode size={14} /> Scan QR
        </button>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            const code = manualCode.trim();
            if (!code) return;
            setManualCode('');
            handleScan(code);
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value.toUpperCase())}
            placeholder="Enter CNS-id manually"
            className="w-48 rounded-full border border-white/15 bg-black/40 px-4 py-2.5 text-xs font-mono outline-none transition-colors focus:border-cyan-500/60"
          />
          <button
            type="submit"
            disabled={!manualCode.trim()}
            className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/40 bg-cyan-500/10 px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300 transition-colors hover:border-cyan-400/70 hover:bg-cyan-500/20 disabled:opacity-40"
          >
            Check In
          </button>
        </form>
      </div>

      <AnimatePresence>
        {scanning && <QrScanner onScan={handleScan} onClose={() => setScanning(false)} title="Scan Attendee QR" />}
        {result && (
          <CheckInResultModal
            result={result}
            onRescan={() => {
              setResult(null);
              setScanning(true);
            }}
            onClose={() => setResult(null)}
          />
        )}
      </AnimatePresence>

      <div className="mt-8">
        <p className="mb-3 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-cyan-400/80">
          <CalendarCheck2 size={12} /> Checked In ({checkedIn.length})
        </p>
        {checkedIn.length === 0 ? (
          <p className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] px-4 py-6 text-center text-xs text-white/30">
            No one has checked in yet.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.03] text-[10px] uppercase tracking-[0.15em] text-white/40">
                  <th className="px-4 py-2.5 font-semibold">Name</th>
                  <th className="px-4 py-2.5 font-semibold">CNS-id</th>
                  <th className="px-4 py-2.5 font-semibold">Phone</th>
                  <th className="px-4 py-2.5 font-semibold">Check-in Time</th>
                </tr>
              </thead>
              <tbody>
                {checkedIn.map((u) => (
                  <tr key={u.user_id} className="border-b border-white/5 last:border-b-0 hover:bg-white/[0.02]">
                    <td className="px-4 py-2.5 font-semibold text-white/85">{u.name || 'Unnamed'}</td>
                    <td className="px-4 py-2.5 font-mono text-cyan-300">{u.unique_code || '—'}</td>
                    <td className="px-4 py-2.5 text-white/60">{u.phone || '—'}</td>
                    <td className="px-4 py-2.5 text-white/60">{new Date(u.checked_in_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function CheckInResultModal({ result, onRescan, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-6"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        className="w-full max-w-md rounded-2xl border border-white/10 bg-[#050b0f] p-6"
      >
        {result.loading && <p className="text-center text-sm text-white/50">Looking up attendee…</p>}

        {result.error && <p className="mb-4 text-center text-sm text-red-300">{result.error}</p>}

        {result.data && (
          <>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-lg font-bold text-white">{result.data.name || 'Unnamed'}</p>
              <span
                className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.15em] ${
                  result.already ? 'bg-amber-400/15 text-amber-300' : 'bg-cyan-400/15 text-cyan-300'
                }`}
              >
                {result.already ? 'Already Checked In' : 'Checked In Now'}
              </span>
            </div>
            <div className="mb-4 grid grid-cols-1 gap-1.5 text-xs text-white/60 sm:grid-cols-2">
              <p>CNS-id: <span className="text-cyan-300">{result.data.unique_code}</span></p>
              <p>Phone: {result.data.phone || '—'}</p>
              <p>College: {result.data.college || '—'}</p>
              <p>College ID: {result.data.college_id || '—'}</p>
              <p>Aadhaar: {result.data.aadhaar_number || '—'}</p>
              <p>City: {result.data.city || '—'}</p>
              <p>Gender: {result.data.gender || '—'}</p>
              <p>Accommodation: {result.data.accommodation_room || '—'}</p>
              <p className="sm:col-span-2">
                Check-in time:{' '}
                {result.data.checked_in_at ? new Date(result.data.checked_in_at).toLocaleString() : '—'}
              </p>
              <p className="sm:col-span-2">Workshops: {result.data.workshops?.join(', ') || '—'}</p>
              <p className="sm:col-span-2">Events: {result.data.events?.join(', ') || '—'}</p>
              <p className="sm:col-span-2">Merch: {result.data.merch_selection || '—'}</p>
            </div>
          </>
        )}

        <div className="flex gap-2">
          <button
            onClick={onRescan}
            className="flex-1 rounded-full bg-cyan-400 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-black hover:bg-white transition-colors"
          >
            Rescan
          </button>
          <button
            onClick={onClose}
            className="flex-1 rounded-full border border-white/15 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/70 hover:text-white transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function UserRow({ user, session, expanded, onToggle, onSaved, pushToast, subtitle }) {
  const [form, setForm] = useState({
    accommodation_room: user.accommodation_room || '',
  });
  const status = accommodationStatus(user);
  const buckets = paidBuckets(user);
  const eventEntries = paidIds(user)
    .map(String)
    .filter((id) => WORKSHOP_IDS.has(id) || EVENT_IDS.has(id))
    .map((id) => {
      const item = findCatalogItem(id);
      return { id, title: item?.title || id, groupSize: Number(item?.groupSize) || 1 };
    });
  const bookedOrPending = status.tone !== 'none';
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [showCart, setShowCart] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg('');
    try {
      const fields = {
        ...form,
        accommodation_room: form.accommodation_room || null,
      };
      const res = await fetch('/api/admin/profile', {
        method: 'PATCH',
        headers: adminHeaders(session, { 'Content-Type': 'application/json' }),
        body: JSON.stringify({ user_id: user.user_id, fields }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSaveMsg(data.message || 'Save failed.');
        pushToast?.(`Failed to save "${user.name || user.unique_code || user.user_id}": ${data.message || 'unknown error'}`, 'error');
        return;
      }
      setSaveMsg('Saved.');
      pushToast?.(`Saved changes to "${user.name || user.unique_code || user.user_id}".`);
      onSaved?.();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="glass-card overflow-hidden rounded-xl border border-white/10 transition-colors hover:border-cyan-500/20">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{user.name || 'Unnamed'}</p>
          <p className="truncate text-xs text-white/40">
            {user.unique_code || '—'} · {user.phone || '—'}
            {subtitle ? ` · ${subtitle}` : ''}
          </p>
        </div>
        {hasAccommodation(user) && (
          <BedDouble size={13} className="shrink-0 text-cyan-400/70" />
        )}
        <ChevronDown
          size={16}
          className={`shrink-0 text-white/40 transition-transform ${expanded ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-white/10"
          >
            <div className="px-4 py-4">
              <div className="mb-5 grid grid-cols-1 gap-2.5 rounded-lg border border-white/5 bg-white/[0.02] p-3 text-xs text-white/60 sm:grid-cols-2">
                <p>College: {user.college || '—'}</p>
                <p>City: {user.city || '—'}</p>
                <p>Gender: {user.gender || '—'}</p>
                <p>Payment status: {user.registration?.payment_status || '—'}</p>
                <p>
                  Accommodation:{' '}
                  <span
                    className={
                      status.tone === 'booked'
                        ? 'text-cyan-300'
                        : status.tone === 'pending'
                        ? 'text-amber-300'
                        : 'text-white/40'
                    }
                  >
                    {status.label}
                  </span>
                </p>
                <p className="sm:col-span-2">
                  Workshops: {buckets.workshops.join(', ') || '—'}
                </p>
                <p className="sm:col-span-2">
                  Events: {buckets.events.join(', ') || '—'}
                </p>
                <p className="sm:col-span-2">
                  Food: {buckets.food.join(', ') || '—'}
                </p>
                <p className="sm:col-span-2">
                  Merch selection: {user.merch_selection || '—'} <span className="text-white/30">(read-only, set by user)</span>
                </p>
              </div>

              {eventEntries.length > 0 && (
                <div className="mb-5">
                  <p className="mb-2 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-cyan-400/80">
                    <Users size={12} /> Participants
                  </p>
                  <div className="space-y-2">
                    {eventEntries.map((e) => (
                      <ParticipantsPanel
                        key={e.id}
                        eventId={e.id}
                        title={e.title}
                        groupSize={e.groupSize}
                        ownerCode={user.unique_code}
                        session={session}
                        pushToast={pushToast}
                        onSaved={onSaved}
                      />
                    ))}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => setShowCart((v) => !v)}
                className="mb-4 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 hover:text-cyan-300"
              >
                <ChevronDown
                  size={12}
                  className={`transition-transform ${showCart ? 'rotate-180' : ''}`}
                />
                In Cart {(user.cart_items || []).length > 0 ? `(${user.cart_items.length})` : ''}
                <span className="font-normal normal-case tracking-normal text-white/25">
                  — unpaid, not counted in totals
                </span>
              </button>
              <AnimatePresence initial={false}>
                {showCart && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <p className="mb-5 rounded-lg border border-amber-500/15 bg-amber-500/[0.04] p-3 text-xs text-amber-200/70">
                      {inCartSummary(user.cart_items)}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              <p className="mb-2 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-cyan-400/80">
                <BedDouble size={12} /> Accommodation
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1 flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] text-white/40">
                    <DoorOpen size={11} /> Room / Building
                  </label>
                  {bookedOrPending ? (
                    <input
                      type="text"
                      value={form.accommodation_room}
                      onChange={(e) => setForm({ ...form, accommodation_room: e.target.value })}
                      placeholder="Block A · Room 204"
                      className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-xs outline-none transition-colors focus:border-cyan-500/60"
                    />
                  ) : (
                    <p className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] px-3 py-2 text-xs text-white/30">
                      User hasn&apos;t booked accommodation yet
                    </p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1 flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] text-white/40">
                    <CalendarClock size={11} /> Check-in Time
                  </label>
                  <p className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-xs text-white/70">
                    {user.checked_in_at ? (
                      new Date(user.checked_in_at).toLocaleString()
                    ) : (
                      <span className="text-white/30">Not checked in yet — scan their QR in the Check In tab.</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="btn-primary text-[10px] disabled:opacity-60"
                >
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
                {saveMsg && <span className="text-xs text-white/40">{saveMsg}</span>}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Value for `field.key` off the raw catalog_items row, used to seed the
// edit form. This `item` is the raw DB row from /api/admin/catalog (snake_
// case column names throughout) — NOT the camelCase card shape catalogStore.js
// builds for the public event/workshop pages, so field keys map straight to
// `item[key]` with no translation. (There used to be a FIELD_ALIASES map
// here copied from catalogStore.js's camelCase transform — accent_color ->
// accentColor, duration -> Duration, etc. — which meant every one of those
// fields was silently reading a property that doesn't exist on this raw
// shape and always came back blank/undefined, regardless of what was
// actually saved in the DB. List fields come back as arrays; joined with
// newlines for the textarea.
function catalogFieldValue(item, key) {
  const value = item[key];
  if (Array.isArray(value)) return value.join('\n');
  return value ?? '';
}

function catalogFieldArray(item, key) {
  const value = item[key];
  return Array.isArray(value) ? value : [];
}

// Chip-based list editor — replaces the old "one item per line" textarea.
// Type a value, press Enter/comma to add it as a chip; click × to remove.
function TagListInput({ values, onChange, disabled, placeholder }) {
  const [draft, setDraft] = useState('');

  const commit = () => {
    const v = draft.trim();
    if (v) onChange([...values, v]);
    setDraft('');
  };

  return (
    <div
      className={`flex flex-wrap items-center gap-1.5 rounded-lg border border-white/15 bg-black/40 p-2 ${
        disabled ? 'opacity-90' : ''
      }`}
    >
      {values.map((v, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-[11px] text-cyan-200"
        >
          {v}
          {!disabled && (
            <button
              type="button"
              onClick={() => onChange(values.filter((_, idx) => idx !== i))}
              className="text-cyan-300/60 hover:text-cyan-100"
            >
              ×
            </button>
          )}
        </span>
      ))}
      <input
        type="text"
        value={draft}
        disabled={disabled}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            commit();
          } else if (e.key === 'Backspace' && !draft && values.length) {
            onChange(values.slice(0, -1));
          }
        }}
        onBlur={commit}
        placeholder={placeholder}
        className="min-w-[120px] flex-1 bg-transparent px-1 py-1 text-xs text-white outline-none placeholder:text-white/25"
      />
    </div>
  );
}

const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;

function parseRgba(value) {
  const m = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)/i.exec(value || '');
  if (!m) return { hex: '#33d6ff', alpha: 0.5 };
  const toHex = (n) => Number(n).toString(16).padStart(2, '0');
  return {
    hex: `#${toHex(m[1])}${toHex(m[2])}${toHex(m[3])}`,
    alpha: m[4] !== undefined ? Number(m[4]) : 1,
  };
}

function composeRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function parseGradientStops(value) {
  const stops = [...(value || '').matchAll(/#[0-9a-fA-F]{6}/g)].map((m) => m[0]);
  while (stops.length < 3) stops.push(['#0b1c2f', '#123f5d', '#081019'][stops.length]);
  return stops.slice(0, 3);
}

function composeGradient(stops) {
  return `linear-gradient(135deg,${stops.join(',')})`;
}

// Icon-only toggle for the per-field "Skip" control. Off = the field is
// included in the save. Clicking it just makes it glow amber — that's the
// entire "skipped" state, no label needed.
function SkipToggle({ skipped, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!skipped)}
      title={skipped ? 'Skipped — click to include' : 'Click to skip this field'}
      className="inline-flex items-center gap-1.5"
    >
      <span
        className="h-4 w-4 shrink-0 rounded-full border transition-all duration-200"
        style={
          skipped
            ? {
                borderColor: 'rgba(245,158,11,0.7)',
                background: 'rgba(245,158,11,0.35)',
                boxShadow: '0 0 10px 2px rgba(245,158,11,0.8)',
              }
            : {
                borderColor: 'rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.03)',
                boxShadow: 'none',
              }
        }
      />
      <span className={`text-[9px] font-black uppercase tracking-[0.15em] ${skipped ? 'text-amber-300' : 'text-white/30'}`}>
        Skip
      </span>
    </button>
  );
}

const EMPTY_CONTACT = { name: '', role: '', phone: '' };

function CatalogItemRow({ item, session, expanded, onToggle, onCollapse, onSaved, pushToast, onMove, canMoveUp, canMoveDown }) {
  const scalarFields = [...CATALOG_TEXT_FIELDS, ...CATALOG_TEXTAREA_FIELDS, ...CATALOG_COLOR_FIELDS];
  const allFields = [...scalarFields, ...CATALOG_LIST_FIELDS];

  const [form, setForm] = useState(() =>
    Object.fromEntries(scalarFields.map((f) => [f.key, catalogFieldValue(item, f.key)]))
  );
  const [listForm, setListForm] = useState(() =>
    Object.fromEntries(CATALOG_LIST_FIELDS.map((f) => [f.key, catalogFieldArray(item, f.key)]))
  );
  // "Skip" flags used to be pure in-memory UI state — they always started
  // back at all-false, so anything you'd marked skipped looked "unlocked"
  // the moment you reopened the item, whether that was a fresh page load,
  // a different admin session, or even just this item scrolling out of the
  // filtered list and back in. Persisted per item+field in localStorage now,
  // so it actually stays set until you deliberately un-skip it.
  const skipStorageKey = `admin_catalog_skip:${item.id}`;
  const [skip, setSkipState] = useState(() => {
    const defaults = Object.fromEntries([...allFields, { key: 'contacts' }].map((f) => [f.key, false]));
    if (typeof window === 'undefined') return defaults;
    try {
      const saved = JSON.parse(window.localStorage.getItem(skipStorageKey) || '{}');
      return { ...defaults, ...saved };
    } catch {
      return defaults;
    }
  });
  const setSkip = (next) => {
    setSkipState(next);
    try {
      window.localStorage.setItem(skipStorageKey, JSON.stringify(next));
    } catch {
      // localStorage unavailable (private mode, quota, etc.) — skip still
      // works for the current session via React state, just won't persist.
    }
  };
  const [contacts, setContacts] = useState(() =>
    Array.isArray(item.contacts) && item.contacts.length ? item.contacts : [EMPTY_CONTACT]
  );
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  // Snapshot of what was actually loaded from the DB. Saving only ever
  // sends fields whose value has genuinely changed from this — per-item
  // accent/glow/foil colors (and anything else you didn't touch) never get
  // re-submitted, so they can't be clobbered by a save that was only meant
  // to change one other field.
  const initialFormRef = useRef(form);
  const initialListFormRef = useRef(listForm);
  const initialContactsRef = useRef(contacts);

  // This row stays mounted (never remounts) for the whole time the admin
  // panel's Catalog tab is open — collapsing/expanding is just a height
  // animation, not an unmount, and `item` is a brand-new object every time
  // the list re-fetches after any save. Without this, the form's local
  // state was frozen at whatever it saw on the very first render — a fresh
  // page load would show it right, but from then on it would silently
  // drift out of sync with the real DB (edit BGMI, save, and its accent
  // color/eligibility/etc. would keep showing the pre-edit value forever,
  // because nothing ever told this component to re-read `item`). Re-sync
  // every time the row is opened, so what you see is always current.
  useEffect(() => {
    if (!expanded) return;
    const freshForm = Object.fromEntries(scalarFields.map((f) => [f.key, catalogFieldValue(item, f.key)]));
    const freshListForm = Object.fromEntries(CATALOG_LIST_FIELDS.map((f) => [f.key, catalogFieldArray(item, f.key)]));
    const freshContacts = Array.isArray(item.contacts) && item.contacts.length ? item.contacts : [EMPTY_CONTACT];
    setForm(freshForm);
    setListForm(freshListForm);
    setContacts(freshContacts);
    initialFormRef.current = freshForm;
    initialListFormRef.current = freshListForm;
    initialContactsRef.current = freshContacts;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded, item]);

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg('');
    try {
      const fields = {};
      for (const f of scalarFields) {
        if (skip[f.key]) {
          // For every other field, "skip" means leave whatever's in the DB
          // alone. Seats is the odd one out: it's a registration cap, and
          // skipping it is how an admin says "no cap" — so it must actively
          // write null (remaining() in useCapacity.js treats a non-number
          // Seats as Infinity/unlimited), not just leave an old number in
          // place still silently capping signups.
          if (f.key === 'seats') fields.seats = null;
          continue;
        }
        if (form[f.key] === initialFormRef.current[f.key]) continue; // untouched — don't resend
        let value = form[f.key];
        if (f.key === 'duration' || f.key === 'seats') {
          value = value === '' ? null : Number(value);
        } else if (f.key === 'group_size') {
          // Not-null column, defaults to 1 (individual) — unlike seats,
          // an empty box here can't mean "uncapped", so it falls back to 1.
          value = value === '' ? 1 : Math.max(1, Number(value) || 1);
        } else if (TEXTAREA_LIST_KEYS.has(f.key)) {
          value = value
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean);
        }
        fields[f.key] = value;
      }
      for (const f of CATALOG_LIST_FIELDS) {
        if (skip[f.key]) continue;
        if (JSON.stringify(listForm[f.key]) === JSON.stringify(initialListFormRef.current[f.key])) continue;
        fields[f.key] = listForm[f.key];
      }
      if (!skip.contacts) {
        const normalizedContacts = contacts
          .map((c) => ({ name: c.name.trim(), role: c.role.trim(), phone: c.phone.trim() }))
          .filter((c) => c.name || c.role || c.phone);
        if (JSON.stringify(normalizedContacts) !== JSON.stringify(initialContactsRef.current)) {
          fields.contacts = normalizedContacts;
        }
      }

      // Always resend the current skip selection as hidden_fields — this is
      // what actually makes a skipped field disappear from the public
      // events/workshop detail page (see catalogStore.js), so it needs to
      // stay in sync with `skip` on every save, not just when something
      // else also changed.
      fields.hidden_fields = allFields.filter((f) => skip[f.key]).map((f) => f.key);
      if (skip.contacts) fields.hidden_fields.push('contacts');

      const res = await fetch(`/api/admin/catalog`, {
        method: 'PATCH',
        headers: adminHeaders(session, { 'Content-Type': 'application/json' }),
        body: JSON.stringify({ id: item.id, kind: item.kind, fields }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        setSaveMsg(data.message || 'Failed to save.');
        pushToast?.(`Failed to save "${item.title || item.id}": ${data.message || 'unknown error'}`, 'error');
        return;
      }
      setSaveMsg('Saved.');
      pushToast?.(`Saved changes to "${item.title || item.id}".`);
      onSaved?.();
      setTimeout(() => onCollapse?.(), 450);
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    'w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-xs text-white outline-none transition-colors focus:border-cyan-500/60 disabled:text-white disabled:opacity-90';

  const glow = parseRgba(form.glow_color);
  const gradientStops = parseGradientStops(form.foil_gradient);

  return (
    <div className="glass-card overflow-hidden rounded-xl transition-colors hover:border-cyan-500/20">
      <div
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle();
          }
        }}
        className="flex w-full cursor-pointer items-center justify-between gap-3 p-4 text-left"
      >
        <div className="flex items-center gap-3">
          <span
            title={item.accent_color || 'No accent color set'}
            className="h-4 w-4 shrink-0 rounded-full border border-white/20"
            style={{ background: item.accent_color || 'transparent' }}
          />
          <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-[10px] uppercase tracking-wide text-cyan-300">
            {item.kind}
          </span>
          <div>
            <p className="font-semibold text-white">
              {item.title || <span className="italic text-white/30">No content yet — click to add</span>}
            </p>
            <p className="font-mono text-[10px] text-white/40">
              id: {item.id} · price: {item.price} · ticket: {item.ticket_id}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-white/40">
          {onMove && (
            <span className="flex items-center gap-1.5">
              <button
                type="button"
                title="Move up (show earlier)"
                disabled={!canMoveUp}
                onClick={(e) => {
                  e.stopPropagation();
                  onMove('up');
                }}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-white/[0.04] text-white/70 transition-colors hover:border-cyan-400/60 hover:bg-cyan-500/15 hover:text-cyan-300 disabled:opacity-20 disabled:hover:border-white/15 disabled:hover:bg-white/[0.04] disabled:hover:text-white/70"
              >
                <ChevronUp size={20} />
              </button>
              <button
                type="button"
                title="Move down (show later)"
                disabled={!canMoveDown}
                onClick={(e) => {
                  e.stopPropagation();
                  onMove('down');
                }}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-white/[0.04] text-white/70 transition-colors hover:border-cyan-400/60 hover:bg-cyan-500/15 hover:text-cyan-300 disabled:opacity-20 disabled:hover:border-white/15 disabled:hover:bg-white/[0.04] disabled:hover:text-white/70"
              >
                <ChevronDown size={20} />
              </button>
            </span>
          )}
          <Pencil size={13} className="ml-1" />
          <ChevronDown size={16} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/10 p-4">
              <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-white/30">
                ID, price &amp; ticket are locked here — manage them from the Tickets tab
              </p>
              <div className="mb-6 grid grid-cols-3 gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3">
                <div>
                  <label className="mb-1 block text-[10px] uppercase tracking-[0.2em] text-white/40">ID</label>
                  <p className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs text-white/50">
                    {item.id}
                  </p>
                </div>
                <div>
                  <label className="mb-1 block text-[10px] uppercase tracking-[0.2em] text-white/40">Price</label>
                  <p className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs text-white/50">
                    {item.price ?? '—'}
                  </p>
                </div>
                <div>
                  <label className="mb-1 block text-[10px] uppercase tracking-[0.2em] text-white/40">
                    Ticket ID
                  </label>
                  <p className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs text-white/50">
                    {item.ticket_id ?? '—'}
                  </p>
                </div>
              </div>

              <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-cyan-400/80">
                Content fields — the glowing dot skips a field
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {CATALOG_TEXT_FIELDS.map((f) => (
                  <div key={f.key}>
                    <div className="mb-1 flex items-center justify-between">
                      <label className="text-[10px] uppercase tracking-[0.2em] text-white/40">{f.label}</label>
                      <SkipToggle
                        skipped={skip[f.key]}
                        onChange={(val) => setSkip({ ...skip, [f.key]: val })}
                      />
                    </div>
                    {f.color ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={HEX_COLOR_RE.test(form[f.key]) ? form[f.key] : '#33d6ff'}
                          disabled={skip[f.key]}
                          onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                          className="h-9 w-11 shrink-0 cursor-pointer rounded-lg border border-white/15 bg-black/40 p-1 disabled:opacity-40"
                        />
                        <input
                          type="text"
                          value={form[f.key]}
                          disabled={skip[f.key]}
                          onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                          placeholder={f.hint}
                          className={`${inputClass} disabled:opacity-90`}
                        />
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={form[f.key]}
                        disabled={skip[f.key]}
                        onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                        placeholder={f.hint}
                        className={`${inputClass} disabled:opacity-90`}
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Glow Color — hex swatch + alpha slider composing an rgba() string */}
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label className="text-[10px] uppercase tracking-[0.2em] text-white/40">Glow Color</label>
                    <SkipToggle
                      skipped={skip.glow_color}
                      onChange={(val) => setSkip({ ...skip, glow_color: val })}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={glow.hex}
                      disabled={skip.glow_color}
                      onChange={(e) => setForm({ ...form, glow_color: composeRgba(e.target.value, glow.alpha) })}
                      className="h-9 w-11 shrink-0 cursor-pointer rounded-lg border border-white/15 bg-black/40 p-1 disabled:opacity-40"
                    />
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={glow.alpha}
                      disabled={skip.glow_color}
                      onChange={(e) => setForm({ ...form, glow_color: composeRgba(glow.hex, Number(e.target.value)) })}
                      className="w-full disabled:opacity-40"
                    />
                    <span
                      className="h-9 w-9 shrink-0 rounded-lg border border-white/15"
                      style={{ background: form.glow_color }}
                    />
                  </div>
                </div>

                {/* Foil Gradient — 3 hex swatches composing a linear-gradient() string */}
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label className="text-[10px] uppercase tracking-[0.2em] text-white/40">Foil Gradient</label>
                    <SkipToggle
                      skipped={skip.foil_gradient}
                      onChange={(val) => setSkip({ ...skip, foil_gradient: val })}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    {gradientStops.map((stop, i) => (
                      <input
                        key={i}
                        type="color"
                        value={stop}
                        disabled={skip.foil_gradient}
                        onChange={(e) => {
                          const next = [...gradientStops];
                          next[i] = e.target.value;
                          setForm({ ...form, foil_gradient: composeGradient(next) });
                        }}
                        className="h-9 w-11 shrink-0 cursor-pointer rounded-lg border border-white/15 bg-black/40 p-1 disabled:opacity-40"
                      />
                    ))}
                    <span
                      className="h-9 w-full rounded-lg border border-white/15"
                      style={{ background: form.foil_gradient }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3">
                {CATALOG_TEXTAREA_FIELDS.map((f) => (
                  <div key={f.key}>
                    <div className="mb-1 flex items-center justify-between">
                      <label className="text-[10px] uppercase tracking-[0.2em] text-white/40">{f.label}</label>
                      <SkipToggle
                        skipped={skip[f.key]}
                        onChange={(val) => setSkip({ ...skip, [f.key]: val })}
                      />
                    </div>
                    <textarea
                      rows={3}
                      value={form[f.key]}
                      disabled={skip[f.key]}
                      onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                      className={`${inputClass} disabled:opacity-90`}
                    />
                  </div>
                ))}

                {CATALOG_LIST_FIELDS.map((f) => (
                  <div key={f.key}>
                    <div className="mb-1 flex items-center justify-between">
                      <label className="text-[10px] uppercase tracking-[0.2em] text-white/40">{f.label}</label>
                      <SkipToggle
                        skipped={skip[f.key]}
                        onChange={(val) => setSkip({ ...skip, [f.key]: val })}
                      />
                    </div>
                    <TagListInput
                      values={listForm[f.key]}
                      disabled={skip[f.key]}
                      onChange={(vals) => setListForm({ ...listForm, [f.key]: vals })}
                      placeholder="Type and press Enter…"
                    />
                  </div>
                ))}
              </div>

              {/* Contact Details — repeatable name/role/phone rows */}
              <div className="mt-3">
                <div className="mb-1 flex items-center justify-between">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-white/40">Contact Details</label>
                  <SkipToggle
                    skipped={skip.contacts}
                    onChange={(val) => setSkip({ ...skip, contacts: val })}
                  />
                </div>
                <div className={`space-y-2 ${skip.contacts ? 'opacity-90' : ''}`}>
                  {contacts.map((c, i) => (
                    <div key={i} className="grid grid-cols-1 gap-2 sm:grid-cols-[2fr_2fr_2fr_auto]">
                      <input
                        type="text"
                        value={c.name}
                        disabled={skip.contacts}
                        onChange={(e) => {
                          const next = [...contacts];
                          next[i] = { ...next[i], name: e.target.value };
                          setContacts(next);
                        }}
                        placeholder="Name"
                        className={inputClass}
                      />
                      <input
                        type="text"
                        value={c.role}
                        disabled={skip.contacts}
                        onChange={(e) => {
                          const next = [...contacts];
                          next[i] = { ...next[i], role: e.target.value };
                          setContacts(next);
                        }}
                        placeholder="Role"
                        className={inputClass}
                      />
                      <input
                        type="text"
                        value={c.phone}
                        disabled={skip.contacts}
                        onChange={(e) => {
                          const next = [...contacts];
                          next[i] = { ...next[i], phone: e.target.value };
                          setContacts(next);
                        }}
                        placeholder="Phone"
                        className={inputClass}
                      />
                      <button
                        type="button"
                        disabled={skip.contacts}
                        onClick={() => setContacts(contacts.filter((_, idx) => idx !== i))}
                        className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 text-xs text-red-300 transition-colors hover:border-red-400/60 disabled:opacity-40"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    disabled={skip.contacts}
                    onClick={() => setContacts([...contacts, { ...EMPTY_CONTACT }])}
                    className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300 transition-colors hover:border-cyan-400/60 disabled:opacity-40"
                  >
                    + Add Contact
                  </button>
                </div>
              </div>

              {Number(item.group_size) > 1 && (
                <TeamRegistrationsPanel eventId={item.id} groupSize={Number(item.group_size)} session={session} />
              )}

              <div className="mt-5 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="btn-primary text-[10px] disabled:opacity-60"
                >
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
                {saveMsg && <span className="text-xs text-white/40">{saveMsg}</span>}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Per-event participant chips shown inside a registrant's own row. Unlike
// TeamRegistrationsPanel (catalog tab, one event → every team), this is one
// user → every event they're paid for, and lets an admin reassign *any*
// slot — including the leader/payer — to a different CNS-id, for both solo
// (groupSize 1) and team events. Solo events have no event_teams row at
// all, so they're rendered directly from `ownerCode` with no fetch.
function ParticipantsPanel({ eventId, title, groupSize, ownerCode, session, pushToast, onSaved }) {
  const [team, setTeam] = useState(null);
  const [editingCode, setEditingCode] = useState(null);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (groupSize <= 1) return;
    let active = true;
    fetch(`/api/admin/team?eventId=${encodeURIComponent(eventId)}`, {
      headers: adminHeaders(session),
    })
      .then((res) => res.json())
      .then((json) => {
        if (!active || !json.success) return;
        const found = (json.data || []).find(
          (t) => t.leader_unique_code === ownerCode || (t.member_codes || []).includes(ownerCode)
        );
        setTeam(found || null);
      });
    return () => {
      active = false;
    };
  }, [eventId, groupSize, ownerCode, session.callsign]);

  const codes = team
    ? [team.leader_unique_code, ...(team.member_codes || []).filter((c) => c !== team.leader_unique_code)].map(
        (c) => ({ code: c, leader: c === team.leader_unique_code })
      )
    : [{ code: ownerCode, leader: true }];

  const reassign = async (fromCode) => {
    const toCode = draft.trim().toUpperCase();
    if (!toCode) return;
    const isLeader = codes.find((c) => c.code === fromCode)?.leader;
    const warned = window.confirm(
      `Reassign "${title}" from ${fromCode} to ${toCode}?${
        isLeader ? ' This changes who the paying registrant is for this event.' : ''
      } This cannot be undone automatically. Continue?`
    );
    if (!warned) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/reassign-registration', {
        method: 'POST',
        headers: adminHeaders(session, { 'Content-Type': 'application/json' }),
        body: JSON.stringify({ eventId, fromCode, toCode }),
      });
      const json = await res.json();
      if (!json.success) {
        pushToast?.(json.message || 'Failed to reassign.', 'error');
        return;
      }
      pushToast?.(`Reassigned ${fromCode} → ${toCode} for "${title}".`);
      setEditingCode(null);
      setDraft('');
      setTeam(json.data?.team || null);
      onSaved?.();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-lg border border-white/10 bg-black/20 p-2.5">
      <p className="mb-1.5 truncate text-[10px] font-semibold uppercase tracking-[0.15em] text-white/40">{title}</p>
      <div className="flex flex-wrap gap-1.5">
        {codes.map(({ code, leader }) =>
          editingCode === code ? (
            <span key={code} className="flex items-center gap-1">
              <input
                autoFocus
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="New CNS-id"
                className="w-28 rounded-full border border-white/15 bg-black/40 px-2 py-0.5 font-mono text-[10px] text-white outline-none focus:border-cyan-500/60"
              />
              <button
                type="button"
                disabled={saving || !draft.trim()}
                onClick={() => reassign(code)}
                className="text-[10px] font-black uppercase text-cyan-300 hover:underline disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingCode(null);
                  setDraft('');
                }}
                className="text-[10px] text-white/40 hover:text-white/70"
              >
                ×
              </button>
            </span>
          ) : (
            <span
              key={code}
              className="flex items-center gap-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-0.5 font-mono text-[10px] text-cyan-300"
            >
              {code}
              {leader ? ' (paid)' : ''}
              <button
                type="button"
                onClick={() => {
                  setEditingCode(code);
                  setDraft('');
                }}
                className="ml-0.5 text-cyan-300/50 hover:text-white"
                aria-label={`Reassign ${code}`}
              >
                <Pencil size={9} />
              </button>
            </span>
          )
        )}
      </div>
    </div>
  );
}

// Read-only by default (view what each team's registrant supplied); "Edit"
// unlocks chip-editing of exactly `groupSize` CNS-ids for that one team.
function TeamRegistrationsPanel({ eventId, groupSize, session }) {
  const [teams, setTeams] = useState(null);
  const [error, setError] = useState('');

  const load = () => {
    fetch(`/api/admin/team?eventId=${encodeURIComponent(eventId)}`, {
      headers: adminHeaders(session),
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setTeams(json.data);
        else setError(json.message || 'Failed to load teams.');
      })
      .catch((err) => setError(err.message));
  };

  useEffect(load, [eventId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="mt-5 border-t border-white/10 pt-4">
      <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-cyan-400/80">
        Team Registrations — {groupSize} CNS-ids each
      </p>
      {error && <p className="mb-2 text-xs text-red-400">{error}</p>}
      {teams === null ? (
        <p className="text-xs text-white/40">Loading…</p>
      ) : teams.length === 0 ? (
        <p className="text-xs text-white/40">No teams registered for this event yet.</p>
      ) : (
        <div className="space-y-2">
          {teams.map((team) => (
            <TeamRow key={team.id} team={team} groupSize={groupSize} session={session} onSaved={load} />
          ))}
        </div>
      )}
    </div>
  );
}

function TeamRow({ team, groupSize, session, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [codes, setCodes] = useState(team.member_codes || []);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const startEdit = () => {
    setCodes(team.member_codes || []);
    setMsg('');
    setEditing(true);
  };

  const addCode = () => {
    const v = draft.trim().toUpperCase();
    if (v && !codes.includes(v)) setCodes([...codes, v]);
    setDraft('');
  };

  const save = async () => {
    setSaving(true);
    setMsg('');
    try {
      const res = await fetch('/api/admin/team', {
        method: 'PATCH',
        headers: adminHeaders(session, { 'Content-Type': 'application/json' }),
        body: JSON.stringify({ id: team.id, memberCodes: codes }),
      });
      const json = await res.json();
      if (!json.success) {
        setMsg(json.message || 'Failed to save.');
        return;
      }
      setEditing(false);
      onSaved?.();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-lg border border-white/10 bg-black/30 p-3">
      <div className="mb-1.5 flex items-center justify-between">
        <p className="font-mono text-[10px] text-white/40">Leader: {team.leader_unique_code}</p>
        {!editing && (
          <button
            type="button"
            onClick={startEdit}
            className="text-[10px] font-black uppercase tracking-[0.15em] text-cyan-300 hover:underline"
          >
            Edit
          </button>
        )}
      </div>
      {editing ? (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {codes.map((c) => (
              <span
                key={c}
                className="flex items-center gap-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-0.5 font-mono text-[10px] text-cyan-300"
              >
                {c}
                {c !== team.leader_unique_code && (
                  <button type="button" onClick={() => setCodes(codes.filter((x) => x !== c))} className="text-cyan-300/60 hover:text-white">
                    ×
                  </button>
                )}
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addCode();
                }
              }}
              placeholder="CNS-XXXXXX"
              disabled={codes.length >= groupSize}
              className="flex-1 rounded-lg border border-white/15 bg-black/40 px-3 py-1.5 text-xs text-white outline-none focus:border-cyan-500/60 disabled:opacity-40"
            />
            <button
              type="button"
              onClick={addCode}
              disabled={codes.length >= groupSize}
              className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 text-xs text-cyan-300 disabled:opacity-40"
            >
              Add
            </button>
          </div>
          <p className="text-[10px] text-white/30">
            {codes.length} / {groupSize} — must equal exactly {groupSize} to save.
          </p>
          {msg && <p className="text-[10px] text-red-400">{msg}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={save}
              disabled={saving || codes.length !== groupSize}
              className="rounded-full bg-cyan-400 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-black disabled:opacity-40"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-full border border-white/15 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-white/60"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {(team.member_codes || []).map((c) => (
            <span
              key={c}
              className="rounded-full border border-white/15 bg-white/[0.03] px-2.5 py-0.5 font-mono text-[10px] text-white/60"
            >
              {c}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function PromoEditor({ id, promo, session, pushToast, onSaved }) {
  const [form, setForm] = useState({ ...DEFAULT_PROMOS[id], ...promo });
  const [saving, setSaving] = useState(false);

  const inputClass =
    'w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-xs text-white outline-none transition-colors focus:border-cyan-500/60 disabled:text-white disabled:opacity-90';

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/promo', {
        method: 'PATCH',
        headers: adminHeaders(session, { 'Content-Type': 'application/json' }),
        body: JSON.stringify({ id, fields: form }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        pushToast?.(`Failed to save promo: ${data.message || 'unknown error'}`, 'error');
        return;
      }
      pushToast?.(`Saved "${id === 'limited_drop' ? 'Limited Drop' : 'Exclusive'}" promo settings.`);
      onSaved?.();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="glass-card rounded-xl p-4">

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {PROMO_FIELDS.map((f) => (
          <div key={f.key}>
            <label className="mb-1 block text-[10px] uppercase tracking-[0.2em] text-white/40">{f.label}</label>
            <input
              type="text"
              value={form[f.key] || ''}
              onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
              className={inputClass}
            />
          </div>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-[10px] uppercase tracking-[0.2em] text-white/40">Description</label>
          <textarea
            rows={3}
            value={form.description || ''}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className={inputClass}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-[10px] uppercase tracking-[0.2em] text-white/40">Accent Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={/^#[0-9a-fA-F]{6}$/.test(form.accent_color) ? form.accent_color : '#33d6ff'}
                onChange={(e) => setForm({ ...form, accent_color: e.target.value })}
                className="h-9 w-11 shrink-0 cursor-pointer rounded-lg border border-white/15 bg-black/40 p-1"
              />
              <input
                type="text"
                value={form.accent_color || ''}
                onChange={(e) => setForm({ ...form, accent_color: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-[10px] uppercase tracking-[0.2em] text-white/40">Secondary Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={/^#[0-9a-fA-F]{6}$/.test(form.secondary_color) ? form.secondary_color : '#a855f7'}
                onChange={(e) => setForm({ ...form, secondary_color: e.target.value })}
                className="h-9 w-11 shrink-0 cursor-pointer rounded-lg border border-white/15 bg-black/40 p-1"
              />
              <input
                type="text"
                value={form.secondary_color || ''}
                onChange={(e) => setForm({ ...form, secondary_color: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="btn-primary text-[10px] disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save Promo Settings'}
        </button>
      </div>
    </div>
  );
}


function TicketsTable({ tickets }) {
  if (tickets.length === 0) {
    return <p className="text-sm text-white/40">No tickets yet — add rows directly in Supabase.</p>;
  }
  return (
    <div className="glass-card overflow-hidden rounded-xl">
      <div style={{ overflowX: 'auto' }}>
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.02] text-left">
              {['ID', 'Type', 'Cost', 'Ticket ID'].map((h) => (
                <th
                  key={h}
                  className="whitespace-nowrap px-3 py-2.5 text-[10px] uppercase tracking-[0.08em] text-white/40"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tickets.map((t, i) => (
              <tr
                key={t.id}
                className="border-b border-white/5"
                style={{ background: i % 2 === 1 ? 'rgba(255,255,255,0.015)' : 'transparent' }}
              >
                <td className="px-3 py-2 font-mono text-white/70">{t.id}</td>
                <td className="px-3 py-2">
                  <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-0.5 text-[10px] uppercase text-cyan-300">
                    {t.type}
                  </span>
                </td>
                <td className="px-3 py-2 text-white/70">{t.cost || '—'}</td>
                <td className="px-3 py-2 font-mono text-white/70">{t.ticket_id ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
