// Hardcoded merch/accommodation/food catalogue for the accommodation page —
// content only. Ticket ids AND prices both live in the database (tickets
// table) — see src/lib/ticketStore.js (getTicketId/getTicketCost).
import { getTicketId, getTicketCost } from '@/lib/ticketStore';

const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];

export const MERCH_ITEMS = [
  {
    id: 'merch-tshirt',
    title: 'Conscientia Tee',
    subtitle: 'Official festival t-shirt',
    imageFront: '/assets/wsfront.png',
    imageBack: '/assets/wsback.png',
    sizes: SIZES,
    accentColor: '#2dd4bf',
  },
  {
    id: 'merch-hoodie',
    title: 'Conscientia Hoodie',
    subtitle: 'Heavyweight fleece pullover',
    imageFront: '/assets/wsfront.png',
    imageBack: '/assets/wsback.png',
    sizes: SIZES,
    accentColor: '#a78bfa',
  },
  {
    id: 'merch-cap',
    title: 'Conscientia Cap',
    subtitle: 'Embroidered logo cap',
    imageFront: '/assets/wsfront.png',
    imageBack: '/assets/wsback.png',
    sizes: ['One Size'],
    accentColor: '#facc15',
  },
  {
    id: 'merch-tote',
    title: 'Conscientia Tote Bag',
    subtitle: 'Canvas carry-all',
    imageFront: '/assets/wsfront.png',
    imageBack: '/assets/wsback.png',
    sizes: ['One Size'],
    accentColor: '#38bdf8',
  },
];

// Fest dates accommodation/food are booked per-day against.
export const STAY_DATES = [
  { id: '2026-10-30', label: 'Oct 30' },
  { id: '2026-10-31', label: 'Oct 31' },
  { id: '2026-11-01', label: 'Nov 1' },
];

export const FOOD_ADDONS = [
  { id: 'breakfast', label: 'Breakfast', description: 'Continental breakfast, served daily.' },
  { id: 'lunch', label: 'Lunch', description: 'Full-course lunch with veg/non-veg options.' },
  { id: 'dinner', label: 'Dinner', description: 'Evening dinner with veg/non-veg options.' },
];

export async function ticketFor(kind) {
  return getTicketId(kind);
}

export async function priceFor(kind) {
  return getTicketCost(kind);
}
