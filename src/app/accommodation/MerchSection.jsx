'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ShoppingCart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { ticketIdForCatalogItem } from '@/lib/ticketCatalog';

const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];

const MERCH_ITEM = {
  id: 'merch-space',
  title: 'Space Merch',
  subtitle: 'Official Conscientia 2026 tee',
  priceLabel: '₹599',
  accentColor: '#2dd4bf',
};

export default function MerchSection() {
  const router = useRouter();
  const { user } = useAuth();
  const { addItem, hasItem } = useCart();
  const [size, setSize] = useState('M');

  const cartKey = `merch:${MERCH_ITEM.id}:${size}`;
  const inCart = hasItem(cartKey);

  const handleAdd = () => {
    if (inCart) return;
    if (!user) {
      router.push('/login?redirect=/accommodation');
      return;
    }
    addItem({
      key: cartKey,
      id: MERCH_ITEM.id,
      kind: 'merch',
      ticketId: ticketIdForCatalogItem('merch'),
      title: `${MERCH_ITEM.title} (${size})`,
      subtitle: MERCH_ITEM.subtitle,
      priceLabel: MERCH_ITEM.priceLabel,
      accentColor: MERCH_ITEM.accentColor,
    });
  };

  return (
    <section className="mb-12">
      <h2 className="mb-5 font-mono text-xs uppercase tracking-widest text-teal-400">
        Merch
      </h2>
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 sm:flex sm:items-center sm:justify-between sm:gap-6">
        <div>
          <h3 className="text-lg font-semibold">{MERCH_ITEM.title}</h3>
          <p className="text-sm text-slate-400">{MERCH_ITEM.subtitle}</p>
          <p className="mt-1 text-sm font-semibold text-teal-400">{MERCH_ITEM.priceLabel}</p>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 sm:mt-0">
          <select
            value={size}
            onChange={(e) => setSize(e.target.value)}
            className="rounded-lg border border-slate-700 bg-black/40 px-3 py-2 text-sm outline-none focus:border-teal-500/60"
          >
            {SIZES.map((s) => (
              <option key={s} value={s}>
                Size {s}
              </option>
            ))}
          </select>
          <button
            onClick={handleAdd}
            disabled={inCart}
            className="inline-flex items-center gap-2 rounded-full bg-teal-400 px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-black transition-colors hover:bg-white disabled:opacity-60"
          >
            {inCart ? <Check size={14} /> : <ShoppingCart size={14} />}
            {inCart ? 'In Cart' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </section>
  );
}
