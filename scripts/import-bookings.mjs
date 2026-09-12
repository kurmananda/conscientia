// One-time backfill: reads scripts/bookings.tsv (raw export of confirmed TiQR
// bookings) and merges every row into `registrations` the same way the live
// webhook does — per-item entries in `details.items_paid`, ids unioned into
// `workshop_ids`, amounts summed (never overwritten), 0-amount rows kept as
// real paid entries. Safe to re-run: it's idempotent per booking_id.
//
// Usage: node scripts/import-bookings.mjs [--dry-run]
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
const getEnv = (k) => (envFile.match(new RegExp(`^${k}=(.*)$`, 'm')) || [])[1]?.trim();
const supabase = createClient(getEnv('NEXT_PUBLIC_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

const DRY_RUN = process.argv.includes('--dry-run');

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
  // workshops; the real catalog id behind each ordinal is now known.
  const FEST_WORKSHOP_ID_MAP = {
    1: 'astronomy_pc',
    2: 'astroph_pc',
    3: 'cubesat_pc',
    4: '3dcad_pc',
    5: 'mun_pc',
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

async function main() {
  const raw = fs.readFileSync(new URL('./bookings.tsv', import.meta.url), 'utf8');
  const rows = parseTsv(raw);
  console.log(`Parsed ${rows.length} confirmed rows.`);

  const byEmail = new Map();
  for (const row of rows) {
    const mapped = mapTicketType(row.ticketType);
    if (!byEmail.has(row.email)) byEmail.set(row.email, []);
    byEmail.get(row.email).push({ ...row, ...mapped });
  }

  console.log(`Grouped into ${byEmail.size} unique emails.`);

  let updated = 0;
  for (const [email, items] of byEmail.entries()) {
    const { data: existing } = await supabase
      .from('registrations')
      .select('workshop_ids, details, amount, user_id')
      .eq('email', email)
      .maybeSingle();

    const existingIds = Array.isArray(existing?.workshop_ids) ? existing.workshop_ids : [];
    const existingDetails =
      existing?.details && typeof existing.details === 'object' ? existing.details : {};
    const existingItemsPaid = Array.isArray(existingDetails.items_paid)
      ? existingDetails.items_paid
      : [];
    const alreadyImportedBookingIds = new Set(
      existingItemsPaid.map((i) => i.booking_id).filter(Boolean)
    );

    const newItemsPaid = [];
    let addedAmount = 0;
    const newIds = [];

    for (const item of items) {
      if (alreadyImportedBookingIds.has(item.bookingId)) continue; // idempotent re-run
      newIds.push(item.id);
      addedAmount += item.amount;
      newItemsPaid.push({
        internal_id: item.id,
        title: item.title,
        booking_id: item.bookingId,
        booking_time: item.bookingTime,
        qty: item.qty,
        amount: item.amount,
        name: item.name,
        phone: item.phone,
        source: 'excel_import_2026_09_12',
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
      `${DRY_RUN ? '[dry-run] ' : ''}${email}: +${newItemsPaid.length} item(s), +₹${addedAmount} (total ₹${finalAmount})`
    );

    if (!DRY_RUN) {
      const { error } = await supabase.from('registrations').upsert(
        [
          {
            email,
            user_id: existing?.user_id || null,
            workshop_ids: finalWorkshopIds,
            details,
            amount: finalAmount,
            status: 'confirmed',
            payment_status: 'paid',
            updated_at: new Date().toISOString(),
          },
        ],
        { onConflict: 'email' }
      );
      if (error) {
        console.error(`  ERROR for ${email}:`, error.message);
        continue;
      }
    }
    updated++;
  }

  console.log(`${DRY_RUN ? 'Would update' : 'Updated'} ${updated} registration rows.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
