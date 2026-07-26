import { supabase } from './supabaseClient';

// The single source of truth for every TiQR ticket id AND price in the
// app — workshops, events, addons (food/accommodation/merch/delivery), and
// the online-workshops combo tickets. Nothing is hardcoded locally; every
// checkout path reads its ticket id and cost from this table.
let cache = null;

function parseCost(raw) {
  if (raw == null) return null;
  const n = Number(String(raw).replace(/[^\d.]/g, ''));
  return Number.isFinite(n) ? n : null;
}

async function loadAll() {
  if (cache) return cache;
  const { data, error } = await supabase.from('tickets').select('id, ticket_id, cost');
  if (error) {
    console.error('[ticketStore] loadAll', error);
    return {};
  }
  cache = Object.fromEntries(
    (data || []).map((row) => [row.id, { ticketId: row.ticket_id, cost: parseCost(row.cost) }])
  );
  return cache;
}

/** Ticket id for a single id (e.g. 'accommodation', 'breakfast', 'c1', 'rocket'). */
export async function getTicketId(id) {
  const all = await loadAll();
  return all[id]?.ticketId;
}

/** Every ticket id at once, keyed by id — for pages that need several. */
export async function getTicketMap() {
  const all = await loadAll();
  return Object.fromEntries(Object.entries(all).map(([id, row]) => [id, row.ticketId]));
}

/** Price (as a plain number, e.g. 599) for a single id. */
export async function getTicketCost(id) {
  const all = await loadAll();
  return all[id]?.cost ?? null;
}

/** Every price at once, keyed by id — for pages that need several. */
export async function getCostMap() {
  const all = await loadAll();
  return Object.fromEntries(Object.entries(all).map(([id, row]) => [id, row.cost]));
}
