'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, BedDouble, CalendarDays, CalendarCheck2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { ACCOMMODATION_PRICE, FOOD_ADDONS, STAY_DATES, ticketFor } from './merchData';

function sameDates(a, b) {
  const as = [...(a || [])].sort();
  const bs = [...(b || [])].sort();
  return as.length === bs.length && as.every((d, i) => d === bs[i]);
}

function DatePicker({ selected, onToggle, disabled }) {
  return (
    <div className="flex flex-wrap gap-2.5">
      {STAY_DATES.map((d) => {
        const active = selected.includes(d.id);
        return (
          <motion.button
            key={d.id}
            type="button"
            whileTap={{ scale: 0.9 }}
            whileHover={disabled ? undefined : { scale: 1.04 }}
            disabled={disabled}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggle(d.id);
            }}
            className={`flex min-h-[38px] cursor-pointer select-none items-center gap-1.5 rounded-full border px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.1em] transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              active
                ? 'border-cyan-400 bg-cyan-400/20 text-cyan-300'
                : 'border-white/15 bg-white/[0.03] text-white/60 hover:border-white/30 hover:text-white'
            }`}
          >
            {active ? <CalendarCheck2 size={13} /> : <CalendarDays size={13} />}
            {d.label}
          </motion.button>
        );
      })}
    </div>
  );
}

function ActionButton({ cartDates, selectedDates, onAdd, onUpdate, onRemove, priceEach, label }) {
  const inCart = cartDates.length > 0;
  const dirty = inCart && !sameDates(cartDates, selectedDates);
  const total = priceEach * selectedDates.length;

  if (!inCart) {
    return (
      <button
        type="button"
        onClick={onAdd}
        disabled={selectedDates.length === 0}
        className="btn-primary text-[10px] disabled:opacity-40"
      >
        {selectedDates.length === 0 ? `Select a date` : `Add to Cart — ₹${total}`}
      </button>
    );
  }

  if (selectedDates.length === 0) {
    return (
      <button type="button" onClick={onRemove} className="btn-secondary text-[10px]">
        Remove from Cart
      </button>
    );
  }

  if (dirty) {
    return (
      <button type="button" onClick={onUpdate} className="btn-primary text-[10px]">
        Update Changes — ₹{total}
      </button>
    );
  }

  return (
    <button type="button" onClick={onRemove} className="btn-secondary text-[10px]">
      <Check size={14} /> Added — {label || 'In Cart'}
    </button>
  );
}

function FoodAddon({ addon }) {
  const { user } = useAuth();
  const router = useRouter();
  const { items, setItem, removeItem, hasItem } = useCart();

  const cartItem = items.find((i) => i.key === addon.id);
  const cartDates = cartItem?.details?.dates || (cartItem ? STAY_DATES.map((d) => d.id).slice(0, cartItem.qty || 0) : []);
  const [selected, setSelected] = useState(cartDates);

  const requireAuth = () => {
    if (!user) {
      router.push('/login?redirect=/accommodation');
      return true;
    }
    return false;
  };

  const toggleDate = (dateId) => {
    if (requireAuth()) return;
    setSelected((prev) => (prev.includes(dateId) ? prev.filter((d) => d !== dateId) : [...prev, dateId]));
  };

  const commit = async () => {
    if (requireAuth()) return;
    if (selected.length === 0) {
      if (hasItem(addon.id)) await removeItem(addon.id);
      return;
    }
    const dateLabels = STAY_DATES.filter((d) => selected.includes(d.id)).map((d) => d.label).join(', ');
    await setItem({
      key: addon.id,
      id: addon.id,
      kind: 'food',
      ticketId: ticketFor(addon.id),
      title: addon.label,
      subtitle: `${addon.description} (${dateLabels})`,
      priceLabel: `₹${addon.price}`,
      unitPrice: addon.price,
      qty: selected.length,
      details: { dates: selected },
    });
  };

  const remove = async () => {
    await removeItem(addon.id);
    setSelected([]);
  };

  return (
    <div className="glass-card flex flex-col gap-3 rounded-xl p-4">
      <div>
        <p className="text-sm font-semibold">{addon.label}</p>
        <p className="text-xs text-slate-400">{addon.description}</p>
        <p className="mt-1 text-xs font-semibold text-cyan-300">₹{addon.price} / day</p>
      </div>
      <DatePicker selected={selected} onToggle={toggleDate} />
      <ActionButton
        cartDates={cartDates}
        selectedDates={selected}
        onAdd={commit}
        onUpdate={commit}
        onRemove={remove}
        priceEach={addon.price}
        label={`${selected.length} day${selected.length > 1 ? 's' : ''}`}
      />
    </div>
  );
}

export default function AccommodationBooking() {
  const { user } = useAuth();
  const router = useRouter();
  const { items, setItem, removeItem, hasItem } = useCart();

  const cartAccommodation = items.find((i) => i.key === 'accommodation');
  const cartDates = cartAccommodation?.details?.dates || [];
  const [selected, setSelected] = useState(cartDates);

  const anyFoodInCart = FOOD_ADDONS.some((addon) => hasItem(addon.id));

  const requireAuth = () => {
    if (!user) {
      router.push('/login?redirect=/accommodation');
      return true;
    }
    return false;
  };

  const toggleDate = (dateId) => {
    if (requireAuth()) return;
    setSelected((prev) => (prev.includes(dateId) ? prev.filter((d) => d !== dateId) : [...prev, dateId]));
  };

  const commit = async () => {
    if (requireAuth()) return;
    if (selected.length === 0) {
      if (hasItem('accommodation')) await removeItem('accommodation');
      return;
    }
    const dateLabels = STAY_DATES.filter((d) => selected.includes(d.id)).map((d) => d.label).join(', ');
    await setItem({
      key: 'accommodation',
      id: 'accommodation',
      kind: 'accommodation',
      ticketId: ticketFor('accommodation'),
      title: 'Accommodation',
      subtitle: `Hostel stay — ${dateLabels}`,
      priceLabel: `₹${ACCOMMODATION_PRICE}`,
      unitPrice: ACCOMMODATION_PRICE,
      qty: selected.length,
      details: { dates: selected },
    });
  };

  const remove = async () => {
    await removeItem('accommodation');
    setSelected([]);
  };

  const total = useMemo(() => ACCOMMODATION_PRICE * selected.length, [selected]);
  const inCart = !!cartAccommodation;

  return (
    <section className="mb-12">
      <div className="glass-card flex flex-col gap-4 rounded-xl p-5">
        <div className="flex items-center gap-3">
          <BedDouble size={20} className="text-cyan-300" />
          <div>
            <p className="text-sm font-semibold">Book a bed</p>
            <p className="text-xs text-slate-400">₹{ACCOMMODATION_PRICE} per night — pick your dates below.</p>
          </div>
        </div>

        <DatePicker selected={selected} onToggle={toggleDate} />

        <div className="flex flex-wrap items-center gap-3">
          <ActionButton
            cartDates={cartDates}
            selectedDates={selected}
            onAdd={commit}
            onUpdate={commit}
            onRemove={remove}
            priceEach={ACCOMMODATION_PRICE}
            label={`${selected.length} night${selected.length > 1 ? 's' : ''}`}
          />
          {selected.length > 0 && (
            <span className="text-xs text-white/40">Total: ₹{total}</span>
          )}
        </div>
      </div>

      {inCart && (
        <p className="mt-2 text-[11px] text-slate-500">
          Added to cart — not yet booked. Your stay is confirmed as &quot;Booked&quot; only after payment and admin check-in setup.
        </p>
      )}

      {inCart && !anyFoodInCart && (
        <p className="mt-4 text-[11px] text-amber-300/80">
          Don&apos;t forget to add food for your stay — breakfast, lunch, and dinner options below.
        </p>
      )}

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {FOOD_ADDONS.map((addon) => (
          <FoodAddon key={addon.id} addon={addon} />
        ))}
      </div>
    </section>
  );
}
