const FALLBACK_COLORS = ["#33d6ff", "#a855f7", "#f59e0b", "#10b981", "#ec4899", "#6366f1"];

// Groups cards by their `section` field, preserving the order sections
// first appear in the list. To add/rename a section, just set a card's
// `section` (and optionally `sectionColor`) in the data file — no page
// code needs to change.
export function groupBySection(cards) {
  const order = [];
  const bySection = new Map();

  cards.forEach((card) => {
    const key = card.section || "Other";
    if (!bySection.has(key)) {
      bySection.set(key, []);
      order.push(key);
    }
    bySection.get(key).push(card);
  });

  return order.map((section, i) => ({
    section,
    color: bySection.get(section)[0]?.sectionColor || FALLBACK_COLORS[i % FALLBACK_COLORS.length],
    cards: bySection.get(section),
  }));
}
