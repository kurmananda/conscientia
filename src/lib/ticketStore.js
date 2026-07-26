import { supabase } from './supabaseClient';

// The single source of truth for every TiQR ticket id in the app —
// workshops, events, addons (food/accommodation/merch/delivery), and the
// online-workshops combo tickets. Nothing is hardcoded locally; every
// checkout path reads its ticket id from this table.
let cache = null;

async function loadAll() {
  if (cache) return cache;
  const { data, error } = await supabase.from('tickets').select('id, ticket_id');
  if (error) {
    console.error('[ticketStore] loadAll', error);
    return {};
  }
  cache = Object.fromEntries((data || []).map((row) => [row.id, row.ticket_id]));
  return cache;
}

/** Ticket id for a single id (e.g. 'accommodation', 'breakfast', 'c1', 'rocket'). */
export async function getTicketId(id) {
  const all = await loadAll();
  return all[id];
}

/** Every ticket id at once, keyed by id — for pages that need several. */
export async function getTicketMap() {
  return loadAll();
}
