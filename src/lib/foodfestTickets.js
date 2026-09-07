/**
 * Fixed price ladder for Food Fest items. Every menu item must be priced at
 * one of these tiers — each maps to one real TIQR ticket created once,
 * ahead of time, in the TIQR dashboard. This means no per-item ticket ever
 * needs creating in the database; admins can only pick a tier, not invent
 * a new price.
 *
 * Fill in the real TIQR ticket id for each tier below before checkout can
 * work end-to-end.
 */
export const FOODFEST_TICKETS = [
  // ₹0 items skip TIQR entirely (see startFoodfestCheckout) — 'FREE' is a
  // sentinel, not a real TIQR ticket id, and is never sent to TIQR.
  { price: 0, ticketId: 'FREE' },
  { price: 25, ticketId: '3244' },
  { price: 40, ticketId: '3245' },
  { price: 50, ticketId: '3246' },
  { price: 60, ticketId: '3247' },
  { price: 70, ticketId: '3248' },
  { price: 80, ticketId: '3249' },
  { price: 100, ticketId: '3250' },
  { price: 120, ticketId: '3251' },
  { price: 150, ticketId: '3252' },
  { price: 180, ticketId: '3253' },
  { price: 200, ticketId: '3254' },
];

export function ticketIdForPrice(price) {
  const tier = FOODFEST_TICKETS.find((t) => t.price === Number(price));
  return tier ? tier.ticketId : null;
}
