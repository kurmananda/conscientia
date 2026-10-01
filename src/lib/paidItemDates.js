// Food and accommodation are booked per day. Each paid booking keeps its
// chosen days in registrations.details.items_paid[].dates (ids like
// "2026-10-29"); these helpers turn that into text for lists and Excel.

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2026-10-29" -> "Oct 29". Unrecognised values pass through unchanged. */
export function formatStayDate(dateId) {
  const m = String(dateId).match(/^\d{4}-(\d{2})-(\d{2})$/);
  if (!m) return String(dateId);
  return `${MONTHS[Number(m[1]) - 1] || m[1]} ${Number(m[2])}`;
}

/**
 * Sorted, de-duplicated date labels for one item (e.g. 'lunch',
 * 'accommodation') across every paid booking of it. Also reports whether a
 * booking exists at all, so a paid item with no day chosen yet is visible
 * rather than looking unbooked.
 */
export function paidItemDates(itemsPaid, internalId) {
  const entries = (Array.isArray(itemsPaid) ? itemsPaid : []).filter((it) => it?.internal_id === internalId);
  const ids = [...new Set(entries.flatMap((it) => (Array.isArray(it.dates) ? it.dates : [])))].sort();
  return { booked: entries.length > 0, dates: ids.map(formatStayDate) };
}

/** "Lunch (Oct 30, Oct 31)" / "Lunch (date not chosen)" / "Lunch". */
export function labelWithDates(label, itemsPaid, internalId) {
  const { booked, dates } = paidItemDates(itemsPaid, internalId);
  if (dates.length) return `${label} (${dates.join(', ')})`;
  return booked ? `${label} (date not chosen)` : label;
}
