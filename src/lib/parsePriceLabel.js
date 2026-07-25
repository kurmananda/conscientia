// Ticket/event/workshop prices are stored as display strings (e.g.
// "₹2,499" or "Free Entry"). This pulls a numeric value out for the cart's
// on-page total — TiQR's own ticket price stays authoritative for the
// actual charge, this is purely informational.
export function parsePriceLabel(label) {
  if (typeof label !== 'string') return null;
  const digits = label.replace(/[^\d.]/g, '');
  if (!digits) return 0; // e.g. "Free Entry"
  const num = parseFloat(digits);
  return Number.isFinite(num) ? num : null;
}
