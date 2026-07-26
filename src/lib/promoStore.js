import { supabase } from './supabaseClient';

// Two independent promo slots — the homepage "Limited Drop" strip and the
// floating "Exclusive" notification used to share one config row; they now
// have their own rows so each can carry different copy/colors/links.
export const DEFAULT_PROMOS = {
  limited_drop: {
    badge_label: 'Limited drop',
    heading: 'Get official Space Merch',
    description: 'Hoodie-style kit for Conscientia 2026 — limited run, ships to your door.',
    price: '₹599',
    link: '/online-workshops',
    image_front: '/assets/wsfront.png',
    image_back: '/assets/wsback.png',
    accent_color: '#33d6ff',
    secondary_color: '#a855f7',
  },
  exclusive: {
    badge_label: 'Exclusive',
    heading: 'Space Merch',
    description: 'Official Conscientia 2026 kit — add at checkout',
    price: '₹599',
    link: '/online-workshops',
    image_front: '/assets/wsfront.png',
    image_back: '/assets/wsback.png',
    accent_color: '#33d6ff',
    secondary_color: '#a855f7',
  },
};

// Back-compat default for any caller not yet passing an id.
export const DEFAULT_PROMO = DEFAULT_PROMOS.limited_drop;

/** One promo slot ('limited_drop' | 'exclusive') by id. */
export async function getPromo(id = 'limited_drop') {
  const fallback = DEFAULT_PROMOS[id] || DEFAULT_PROMOS.limited_drop;
  const { data, error } = await supabase.from('promo_settings').select('*').eq('id', id).maybeSingle();
  if (error) {
    console.error('[promoStore] getPromo', error);
    return fallback;
  }
  return data ? { ...fallback, ...data } : fallback;
}

/** Both promo slots at once, keyed by id. */
export async function getPromos() {
  const { data, error } = await supabase
    .from('promo_settings')
    .select('*')
    .in('id', ['limited_drop', 'exclusive']);
  if (error) {
    console.error('[promoStore] getPromos', error);
    return DEFAULT_PROMOS;
  }
  const byId = Object.fromEntries((data || []).map((row) => [row.id, row]));
  return {
    limited_drop: { ...DEFAULT_PROMOS.limited_drop, ...(byId.limited_drop || {}) },
    exclusive: { ...DEFAULT_PROMOS.exclusive, ...(byId.exclusive || {}) },
  };
}
