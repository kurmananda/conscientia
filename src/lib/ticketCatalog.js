// The only TiQR tickets that exist right now (created for the online-workshops
// flow). New /workshop and /events catalogue items don't have dedicated TiQR
// tickets yet, so — per instruction — bookings for them are routed through
// these existing tickets as a stand-in until real ones are generated.
export const TICKET_MAPPING = {
  c4: 3050, // QCES + MERCH Combo
  c3: 3049, // Mega Combo
  c1: 3047, // Space Combo
  5: 3042, // Space Merch
  c2: 3048, // AI Combo
  1: 3043, // Cube Sat
  2: 3044, // Launch Vehicle
  3: 3045, // Agentic AI
  4: 3046, // Python ML
  6: 3062, // Summer School
};

// Stand-in tickets for the general /workshop and /events catalogues.
export const DEFAULT_WORKSHOP_TICKET = TICKET_MAPPING['1'];
export const DEFAULT_EVENT_TICKET = TICKET_MAPPING['c1'];
export const DEFAULT_MERCH_TICKET = TICKET_MAPPING['5'];

export function ticketIdForCatalogItem(kind) {
  if (kind === 'event') return DEFAULT_EVENT_TICKET;
  if (kind === 'merch') return DEFAULT_MERCH_TICKET;
  return DEFAULT_WORKSHOP_TICKET;
}
