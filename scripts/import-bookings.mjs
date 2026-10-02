// One-time backfill: reads scripts/bookings.tsv (raw export of confirmed TiQR
// bookings) and merges every row into `registrations` the same way the live
// webhook does — per-item entries in `details.items_paid`, ids unioned into
// `workshop_ids`, amounts summed (never overwritten), 0-amount rows kept as
// real paid entries. Safe to re-run: it's idempotent per booking_id.
//
// Only ever appends: a row whose TQ booking_id is already stored anywhere is
// skipped, and so is a row whose email already has a live-recorded item
// (webhook/cart, keyed by TiQR uid instead of TQ id) for the same product.
//
// Usage: node scripts/import-bookings.mjs [path/to/export.tsv] [--dry-run]
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
const getEnv = (k) => (envFile.match(new RegExp(`^${k}=(.*)$`, 'm')) || [])[1]?.trim();
const supabase = createClient(getEnv('NEXT_PUBLIC_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

const DRY_RUN = process.argv.includes('--dry-run');
const TSV_PATH = process.argv.slice(2).find((a) => !a.startsWith('--'));
const SOURCE_TAG = TSV_PATH
  ? `excel_import_${new Date().toISOString().slice(0, 10).replace(/-/g, '_')}`
  : 'excel_import_2026_09_12';

// Event title keyword -> catalog id (from catalog_items, kind=event/workshop).
const EVENT_KEYWORDS = [
  [/escape the upside down/i, 'escapetheupsidedown'],
  [/rc\s*rallycross/i, 'rcrallycross'],
  [/clash royale/i, 'clashroyale'],
  [/cicada/i, 'cicada'],
  [/cansat/i, 'cansat'],
  [/dronetrix/i, 'dronetrix'],
  [/galactic gambit/i, 'gg'],
  [/thrilltopia/i, 'thrilltopia'],
  [/integration bee/i, 'intbee'],
  [/a\s*hogwarts mystery/i, 'ahogwartsmystery'],
  [/arduino hackathon/i, 'arduinohackathon'],
  [/maze solver/i, 'mazesolver'],
  [/rc plane/i, 'rcplane'],
  [/hackorbital team/i, 'hackorbitalteam'],
  [/hackorbital.*individual/i, 'hackorbitalindividual'],
  [/stock odyss/i, 'stockodyssey'],
  [/battle of bots/i, 'battleofbots'],
  [/line follower/i, 'linefollower'],
  [/robo\s*soccer/i, 'robosoccer'],
  [/amphibot/i, 'amphibot'],
  [/space quiz/i, 'spacequiz'],
  [/general quiz/i, 'generalquiz'],
];

// Direct/legacy ticket-type -> internal id. Items not in the current
// catalog (old online-workshop combo tickets from an earlier season) keep
// their original label prefixed `legacy_` so nothing is silently dropped or
// mismapped to the wrong current product.
const DIRECT_MAP = {
  accommodation: 'accommodation',
  'add-on (meal) breakfast': 'breakfast',
  'add-on (meal) lunch': 'lunch',
  'add-on (meal) dinner': 'dinner',
  'merch - tote bag': 'merch-tote',
  'merch - cap': 'merch-cap',
  'merch - tshirt [timefall]': 'merch-tshirt',
  'merch delivery': 'delivery',
  merch: 'merch-legacy',
  cubesat: 'legacy_cubesat',
  launchvehicle: 'legacy_launchVehicle',
  agenticai: 'legacy_agenticAI',
  pythonml: 'legacy_pythonML',
  spacecombo: 'legacy_spaceCombo',
  aicombo: 'legacy_aiCombo',
  'mega combo': 'legacy_megaCombo',
  'summer school': 'legacy_summerSchool',
  'summer school+merch': 'legacy_summerSchoolMerch',
};

const MEAL_IDS = new Set(['breakfast', 'lunch', 'dinner', 'accommodation']);

function mapTicketType(raw) {
  const t = raw.trim();
  const lower = t.toLowerCase();
  if (DIRECT_MAP[lower]) return { id: DIRECT_MAP[lower], title: t };

  // TiQR only ever gave these numbered "(id-N)" labels for pre-fest
  // workshops. The ordinal follows TiQR ticket id order (id-1 = 3140,
  // id-11 = 3150, see the `tickets` table) and the prices confirm it:
  // id-3 is the ₹299 3D CAD ticket, id-5 the ₹199 CubeSat (Grahaa) one.
  const FEST_WORKSHOP_ID_MAP = {
    1: 'astronomy_pc',
    2: 'astroph_pc',
    3: '3dcad_pc',
    4: 'mun_pc',
    5: 'cubesat_pc',
    6: 'aero_pc',
    7: 'quant0to1',
    8: 'robo_pc',
    9: 'rocketry_pc',
    10: 'mod_rocketry',
    11: 'adv_rocketry',
  };
  const workshopIdMatch = t.match(/Workshops-\s*Conscientia 2026\s*\(id-(\d+)\)/i);
  if (workshopIdMatch) {
    const n = Number(workshopIdMatch[1]);
    const id = FEST_WORKSHOP_ID_MAP[n] || `fest_workshop_id_${n}`;
    return { id, title: t };
  }

  if (/^events?\s*-\s*conscientia 2026/i.test(t)) {
    for (const [re, id] of EVENT_KEYWORDS) {
      if (re.test(t)) return { id, title: t };
    }
    const slug = t
      .replace(/events?\s*-\s*conscientia 2026/i, '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
    return { id: `legacy_event_${slug || 'unknown'}`, title: t };
  }

  const slug = lower.replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  return { id: `legacy_${slug}`, title: t };
}

function parseTsv(text) {
  const lines = text.split('\n').filter((l) => l.trim());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split('\t');
    if (cols.length < 10) continue;
    const [email, phone, ticketType, bookingId, bookingTime, status, qty, discount, name, amount] = cols;
    if (!email || status.trim().toLowerCase() !== 'confirmed') continue;
    rows.push({
      email: email.trim().toLowerCase(),
      phone: (phone || '').trim(),
      ticketType: ticketType.trim(),
      bookingId: bookingId.trim(),
      bookingTime: bookingTime.trim(),
      qty: Number(qty) || 1,
      name: (name || '').trim(),
      amount: Number(String(amount || '0').trim()) || 0,
    });
  }
  return rows;
}

async function fetchAllRegistrations() {
  const all = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from('registrations')
      .select('id, email, workshop_ids, details, amount, user_id')
      .range(from, from + 999);
    if (error) throw error;
    all.push(...data);
    if (data.length < 1000) return all;
  }
}

async function main() {
  const tsvUrl = TSV_PATH ? new URL(TSV_PATH, `file://${process.cwd()}/`) : new URL('./bookings.tsv', import.meta.url);
  const rows = parseTsv(fs.readFileSync(tsvUrl, 'utf8'));
  console.log(`Parsed ${rows.length} confirmed rows.`);

  const byEmail = new Map();
  for (const row of rows) {
    const mapped = mapTicketType(row.ticketType);
    if (!byEmail.has(row.email)) byEmail.set(row.email, []);
    byEmail.get(row.email).push({ ...row, ...mapped });
  }

  console.log(`Grouped into ${byEmail.size} unique emails.`);

  // A TQ booking id already stored on *any* row means it was imported before
  // (possibly under a different email) — never add it again.
  const existingRows = await fetchAllRegistrations();
  const regByEmail = new Map(existingRows.map((r) => [String(r.email || '').toLowerCase(), r]));
  const knownBookingIds = new Set();
  for (const r of existingRows) {
    for (const i of r.details?.items_paid || []) if (i.booking_id) knownBookingIds.add(i.booking_id);
  }

  let updated = 0;
  let skippedKnown = 0;
  let skippedLive = 0;
  for (const [email, items] of byEmail.entries()) {
    const existing = regByEmail.get(email) || null;

    const existingIds = Array.isArray(existing?.workshop_ids) ? existing.workshop_ids : [];
    const existingDetails =
      existing?.details && typeof existing.details === 'object' ? existing.details : {};
    const existingItemsPaid = Array.isArray(existingDetails.items_paid)
      ? existingDetails.items_paid
      : [];

    // Items recorded live (no TQ booking_id) can each "absorb" one export
    // row for the same product, so purchases made through the site aren't
    // counted twice. A bare workshop_ids entry is NOT a purchase — being
    // added as someone's teammate writes the event id there without paying.
    const liveClaims = new Map();
    for (const i of existingItemsPaid) {
      if (i.booking_id || !i.internal_id) continue;
      liveClaims.set(i.internal_id, (liveClaims.get(i.internal_id) || 0) + 1);
    }

    const newItemsPaid = [];
    let addedAmount = 0;
    const newIds = [];

    for (const item of items) {
      if (knownBookingIds.has(item.bookingId)) {
        skippedKnown++;
        continue;
      }
      if ((liveClaims.get(item.id) || 0) > 0) {
        liveClaims.set(item.id, liveClaims.get(item.id) - 1);
        skippedLive++;
        console.log(`  skip ${item.bookingId} (${email} ${item.id}): already recorded live`);
        continue;
      }
      newIds.push(item.id);
      addedAmount += item.amount;
      newItemsPaid.push({
        internal_id: item.id,
        title: item.title,
        booking_id: item.bookingId,
        booking_uid: item.bookingId,
        booking_time: item.bookingTime,
        qty: item.qty,
        amount: item.amount,
        name: item.name,
        phone: item.phone,
        source: SOURCE_TAG,
        needs_day_selection: MEAL_IDS.has(item.id) && item.qty > 0,
        dates: [],
      });
    }

    if (newItemsPaid.length === 0) continue; // nothing new for this email

    const finalWorkshopIds = [...new Set([...existingIds, ...newIds])];
    const finalItemsPaid = [...existingItemsPaid, ...newItemsPaid];
    const finalAmount = (existing?.amount || 0) + addedAmount;
    const anyName = items.find((i) => i.name)?.name || '';
    const anyPhone = items.find((i) => i.phone)?.phone || '';

    const details = {
      ...existingDetails,
      items_paid: finalItemsPaid,
      name: existingDetails.name || anyName,
      phone: existingDetails.phone || anyPhone,
    };

    console.log(
      `${DRY_RUN ? '[dry-run] ' : ''}${existing ? '' : '[new] '}${email}: +${newItemsPaid.length} item(s) [${newIds.join(', ')}], +₹${addedAmount} (total ₹${finalAmount})`
    );

    if (!DRY_RUN) {
      // Existing rows: touch only these columns, by primary key, so status,
      // payment fields and the row's original email casing stay as they were.
      const { error } = existing
        ? await supabase
            .from('registrations')
            .update({
              workshop_ids: finalWorkshopIds,
              details,
              amount: finalAmount,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id)
        : await supabase.from('registrations').insert([
            {
              email,
              user_id: null,
              workshop_ids: finalWorkshopIds,
              details,
              amount: finalAmount,
              status: 'confirmed',
              payment_status: 'paid',
              updated_at: new Date().toISOString(),
            },
          ]);
      if (error) {
        console.error(`  ERROR for ${email}:`, error.message);
        continue;
      }
    }
    updated++;
  }

  console.log(`Skipped ${skippedKnown} rows already imported by booking id, ${skippedLive} already recorded live.`);
  console.log(`${DRY_RUN ? 'Would update' : 'Updated'} ${updated} registration rows.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
