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
};

const IGNORED_COLUMNS = new Set(['kind', 'sort_order', 'updated_at', 'updated_by']);

// Text columns that are nullable in the DB but must never reach the UI as
// null — every color/gradient string gets concatenated or .replace()'d
// directly in ParallaxCard without a null check.
const TEXT_COLUMNS_DEFAULT_EMPTY = new Set([
  'title', 'subtitle', 'type', 'section', 'section_color',
  'eligibility', 'venue', 'timing', 'image', 'badge_icon',
  'accent_color', 'glow_color', 'foil_gradient', 'description',
  'format', 'certificate', 'brochure_url',
]);

// Every workshop/event's real identity — price, ticket id, and the fact
// that it exists at all — lives in `tickets`, not `catalog_items`. An admin
// adds a new catalog item by inserting a row directly into `tickets`;
// until content is filled in via the admin portal, this produces the blank
// placeholder card below so it still shows up (empty) in the catalog.
function blankContent(ticket) {
  return {
    id: ticket.id,
    kind: ticket.type,
    title: '',
    subtitle: '',
    type: '',
    section: '',
    sectionColor: '',
    Duration: null,
    Seats: null,
    eligibility: '',
    venue: '',
    timing: '',
    image: '',
    badgeIcon: '',
    accentColor: '',
    glowColor: '',
    foilGradient: '',
    description: '',
    aboutExtra: [],
    highlights: [],
    requirements: [],
    format: '',
    certificate: '',
    tags: [],
    brochureUrl: '',
    layout: {},
    contacts: [],
    access: [],
  };
}

function rowToCard(row) {
  const card = {};
  for (const [column, value] of Object.entries(row)) {
    if (IGNORED_COLUMNS.has(column)) continue;
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

  const cards = (tickets || []).map((ticket) =>
    withTicket(contentById[ticket.id] || blankContent(ticket), ticket)
  );

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

  if (!ticket) return null;
  return withTicket(contentRow ? rowToCard(contentRow) : blankContent(ticket), ticket);
}
