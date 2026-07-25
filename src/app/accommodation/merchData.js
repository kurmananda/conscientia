// Hardcoded merch catalogue for the accommodation/merch page. Ticket ids are
// placeholders from src/lib/ticketCatalog.js — swap for real TiQR tickets
// once generated.
import { ADDON_TICKET_MAPPING } from '@/lib/ticketCatalog';

const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];

export const MERCH_ITEMS = [
  {
    id: 'merch-tshirt',
    title: 'Conscientia Tee',
    subtitle: 'Official festival t-shirt',
    price: 599,
    imageFront: '/assets/wsfront.png',
    imageBack: '/assets/wsback.png',
    sizes: SIZES,
    accentColor: '#2dd4bf',
  },
  {
    id: 'merch-hoodie',
    title: 'Conscientia Hoodie',
    subtitle: 'Heavyweight fleece pullover',
    price: 1299,
    imageFront: '/assets/wsfront.png',
    imageBack: '/assets/wsback.png',
    sizes: SIZES,
    accentColor: '#a78bfa',
  },
  {
    id: 'merch-cap',
    title: 'Conscientia Cap',
    subtitle: 'Embroidered logo cap',
    price: 349,
    imageFront: '/assets/wsfront.png',
    imageBack: '/assets/wsback.png',
    sizes: ['One Size'],
    accentColor: '#facc15',
  },
  {
    id: 'merch-tote',
    title: 'Conscientia Tote Bag',
    subtitle: 'Canvas carry-all',
    price: 249,
    imageFront: '/assets/wsfront.png',
    imageBack: '/assets/wsback.png',
    sizes: ['One Size'],
    accentColor: '#38bdf8',
  },
];

export const DELIVERY_FEE = 60;

// Fest dates accommodation/food are booked per-day against.
export const STAY_DATES = [
  { id: '2026-10-30', label: 'Oct 30' },
  { id: '2026-10-31', label: 'Oct 31' },
  { id: '2026-11-01', label: 'Nov 1' },
];

export const FOOD_ADDONS = [
  { id: 'breakfast', label: 'Breakfast', price: 40, description: 'Continental breakfast, served daily.' },
  { id: 'lunch', label: 'Lunch', price: 80, description: 'Full-course lunch with veg/non-veg options.' },
  { id: 'dinner', label: 'Dinner', price: 80, description: 'Evening dinner with veg/non-veg options.' },
];

// Per-day accommodation rate — total charged is this × number of nights
// selected (see STAY_DATES).
export const ACCOMMODATION_PRICE = 450;

export function ticketFor(kind) {
  return ADDON_TICKET_MAPPING[kind];
}
