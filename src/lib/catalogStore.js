import { supabase } from './supabaseClient';

// catalog_items uses snake_case columns for the handful of fields that
// don't already match the camelCase field names used throughout the UI.
const COLUMN_TO_FIELD = {
  section_color: 'sectionColor',
  duration: 'Duration',
  seats: 'Seats',
  badge_icon: 'badgeIcon',
  accent_color: 'accentColor',
  glow_color: 'glowColor',
  foil_gradient: 'foilGradient',
  about_extra: 'aboutExtra',
  brochure_url: 'brochureUrl',
  prize_pool: 'prizePool',
  event_date: 'eventDate',
  group_size: 'groupSize',
  strike_price: 'strikePrice',
};

const IGNORED_COLUMNS = new Set(['kind', 'sort_order', 'updated_at', 'updated_by', 'hidden_fields']);

// Text columns that are nullable in the DB but must never reach the UI as
// null — every color/gradient string gets concatenated or .replace()'d
// directly in ParallaxCard without a null check.
const TEXT_COLUMNS_DEFAULT_EMPTY = new Set([
  'title', 'subtitle', 'type', 'section', 'section_color',
  'eligibility', 'venue', 'timing', 'image', 'badge_icon',
  'accent_color', 'glow_color', 'foil_gradient', 'description',
  'format', 'certificate', 'brochure_url', 'prize_pool', 'event_date', 'strike_price',
]);

// Every workshop/event's real identity — price, ticket id, and the fact
// that it exists at all — lives in `tickets`, not `catalog_items`. An admin
// adds a new catalog item by inserting a row directly into `tickets`; until
// content is filled in via the admin portal, both getCatalog and
// getCatalogItem below simply exclude it from what the public site can see.

function rowToCard(row) {
  // Fields the admin has toggled "skip" on are meant to be invisible on the
  // public site, not just left alone in the DB — see the admin catalog
  // editor's skip toggle and migration 0019.
  const hidden = new Set(Array.isArray(row.hidden_fields) ? row.hidden_fields : []);
  const card = {};
  for (const [column, value] of Object.entries(row)) {
    if (IGNORED_COLUMNS.has(column)) continue;
    if (hidden.has(column)) continue;
    const resolved = value == null && TEXT_COLUMNS_DEFAULT_EMPTY.has(column) ? '' : value;
    card[COLUMN_TO_FIELD[column] || column] = resolved;
  }
  return card;
}

function withTicket(card, ticket) {
  return { ...card, price: ticket.cost, ticketId: ticket.ticket_id };
}

/** All workshop or event cards, in their configured display order. */
export async function getCatalog(kind) {
  const [{ data: tickets, error: ticketsError }, { data: content, error: contentError }] =
    await Promise.all([
      supabase.from('tickets').select('*').eq('type', kind),
      supabase.from('catalog_items').select('*').eq('kind', kind).order('sort_order', { ascending: true }),
    ]);

  if (ticketsError) console.error('[catalogStore] getCatalog tickets', ticketsError);
  if (contentError) console.error('[catalogStore] getCatalog content', contentError);

  const contentById = Object.fromEntries((content || []).map((row) => [row.id, rowToCard(row)]));
  const contentOrder = (content || []).map((row) => row.id);

  // Tickets with no matching catalog_items row (or an empty title) haven't
  // actually been filled in yet — these used to still render publicly as
  // blank/incomplete placeholder cards ("skipped" content, from the admin's
  // point of view). The public site should only ever show items that are
  // actually finished; the blank-placeholder behavior stays for the admin
  // portal itself (see /api/admin/catalog), which needs to see everything,
  // filled in or not.
  const cards = (tickets || [])
    .filter((ticket) => contentById[ticket.id]?.title)
    .map((ticket) => withTicket(contentById[ticket.id], ticket));

  // Preserve catalog_items' sort_order for items that have content; items
  // that only exist as a bare ticket row (no content yet) go at the end.
  cards.sort((a, b) => {
    const ai = contentOrder.indexOf(a.id);
    const bi = contentOrder.indexOf(b.id);
    if (ai === -1 && bi === -1) return 0;
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  return cards;
}

/** A single workshop or event card by id. */
export async function getCatalogItem(kind, id) {
  const [{ data: ticket, error: ticketError }, { data: contentRow, error: contentError }] =
    await Promise.all([
      supabase.from('tickets').select('*').eq('type', kind).eq('id', id).maybeSingle(),
      supabase.from('catalog_items').select('*').eq('kind', kind).eq('id', id).maybeSingle(),
    ]);

  if (ticketError) console.error('[catalogStore] getCatalogItem ticket', ticketError);
  if (contentError) console.error('[catalogStore] getCatalogItem content', contentError);

  // Same as getCatalog: an item with no content filled in yet (or an empty
  // title) isn't finished, and shouldn't be reachable on the public site
  // even by a direct link to its detail page.
  if (!ticket || !contentRow?.title) return null;
  return withTicket(rowToCard(contentRow), ticket);
}
