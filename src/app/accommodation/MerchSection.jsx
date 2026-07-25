'use client';

import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ShoppingCart, Minus, Plus, Truck, Ruler, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import useProfile from '../hooks/useProfile';
import { MERCH_ITEMS, DELIVERY_FEE, ticketFor } from './merchData';

function QtyStepper({ qty, onChange, label }) {
  const [flash, setFlash] = useState(false);
  const bump = (delta) => {
    setFlash(true);
    setTimeout(() => setFlash(false), 300);
    onChange(Math.max(1, qty + delta));
  };
  return (
    <div className="flex items-center gap-2 rounded-full border border-white/10 px-2 py-1">
      <motion.button
        type="button"
        whileTap={{ scale: 0.9 }}
        onClick={() => bump(-1)}
        className="rounded-full p-1 text-slate-300 hover:text-white"
        aria-label={`Decrease ${label || 'quantity'}`}
      >
        <Minus size={14} />
      </motion.button>
      <span
        className={`w-8 rounded text-center text-sm transition-colors duration-300 ${
          flash ? 'bg-cyan-400/30 text-cyan-200' : ''
        }`}
      >
        {qty}
      </span>
      <motion.button
        type="button"
        whileTap={{ scale: 0.9 }}
        onClick={() => bump(1)}
        className="rounded-full p-1 text-slate-300 hover:text-white"
        aria-label={`Increase ${label || 'quantity'}`}
      >
        <Plus size={14} />
      </motion.button>
    </div>
  );
}

function MerchDialog({ item, profile, onClose, onConfirm }) {
  const [qty, setQty] = useState(1);
  const [size, setSize] = useState(item.sizes[0]);
  const [wantsDelivery, setWantsDelivery] = useState(null); // null | true | false
  const [addressSubmitted, setAddressSubmitted] = useState(false);
  const [address, setAddress] = useState({
    houseNumber: '',
    laneName: '',
    landmark: '',
    city: '',
    pincode: '',
  });

  useEffect(() => {
    if (profile?.address && !address.houseNumber && !address.laneName) {
      // Best-effort prefill: put the saved freeform address into the first
      // field and leave the rest for the user to confirm/split.
      setAddress((prev) => ({ ...prev, houseNumber: profile.address }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.address]);

  const canSubmitDelivery =
    address.houseNumber.trim() &&
    address.laneName.trim() &&
    address.city.trim() &&
    /^\d{4,8}$/.test(address.pincode.trim());

  const handleAddressSubmit = (e) => {
    e.preventDefault();
    if (!canSubmitDelivery) return;
    setAddressSubmitted(true);
  };

  const handleConfirm = () => {
    if (wantsDelivery && !addressSubmitted) return;
    onConfirm({
      qty,
      size,
      delivery: wantsDelivery ? address : null,
    });
  };

  const readyToConfirm = wantsDelivery === false || (wantsDelivery === true && addressSubmitted);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[150] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm sm:p-6"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.97 }}
          transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="glass-card w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl p-5 sm:p-7"
        >
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-cyan-400/90 mb-1">
                {item.title}
              </p>
              <h2 className="text-xl font-bold text-white">Configure Your Order</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1 text-white/40 hover:text-white"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* Quantity */}
          <div className="mb-5">
            <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-white/40">Quantity</p>
            <QtyStepper qty={qty} onChange={setQty} label={item.title} />
          </div>

          {/* Size + size chart */}
          <div className="mb-5">
            <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-white/40">Size</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {item.sizes.map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={size === s}
                  onClick={() => setSize(s)}
                  className={`chip cursor-pointer transition-colors ${
                    size === s
                      ? 'border-cyan-400/70 bg-cyan-400/15 text-cyan-300'
                      : 'hover:border-white/30 hover:text-white'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="rounded-xl border border-white/10 bg-black/30 p-3">
              <div className="mb-2 flex items-center gap-2 text-xs text-slate-400">
                <Ruler size={14} className="text-cyan-400" />
                Not sure of your size? Check the chart below.
              </div>
              <div className="relative h-40 w-full overflow-hidden rounded-lg">
                <Image
                  src="/assets/merch-size-guide.png"
                  alt="Merch size guide"
                  fill
                  className="object-contain"
                  sizes="400px"
                />
              </div>
            </div>
          </div>

          {/* Delivery */}
          <div className="mb-5">
            <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-white/40">Delivery</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setWantsDelivery(true);
                  setAddressSubmitted(false);
                }}
                className={wantsDelivery === true ? 'btn-primary text-[10px]' : 'btn-secondary text-[10px]'}
              >
                <Truck size={14} /> Yes, deliver (+₹{DELIVERY_FEE})
              </button>
              <button
                type="button"
                onClick={() => {
                  setWantsDelivery(false);
                  setAddressSubmitted(false);
                }}
                className={wantsDelivery === false ? 'btn-primary text-[10px]' : 'btn-secondary text-[10px]'}
              >
                No, I&apos;ll collect
              </button>
            </div>

            {wantsDelivery === true && !addressSubmitted && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                onSubmit={handleAddressSubmit}
                className="mt-4 space-y-3"
              >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {[
                    ['houseNumber', 'House Number and Name'],
                    ['laneName', 'Lane Name'],
                    ['landmark', 'Landmark'],
                    ['city', 'City'],
                  ].map(([field, placeholder]) => (
                    <input
                      key={field}
                      type="text"
                      value={address[field]}
                      onChange={(e) =>
                        setAddress((prev) => ({ ...prev, [field]: e.target.value }))
                      }
                      placeholder={placeholder}
                      className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-cyan-400/60"
                    />
                  ))}
                  <input
                    type="text"
                    inputMode="numeric"
                    value={address.pincode}
                    onChange={(e) =>
                      setAddress((prev) => ({
                        ...prev,
                        pincode: e.target.value.replace(/\D/g, ''),
                      }))
                    }
                    placeholder="Pincode"
                    className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-cyan-400/60"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!canSubmitDelivery}
                  className="btn-secondary w-full text-[10px] disabled:opacity-50"
                >
                  Save Address
                </button>
              </motion.form>
            )}

            {wantsDelivery === true && addressSubmitted && (
              <p className="mt-3 text-xs text-cyan-300">
                Address saved for this order — {address.houseNumber}, {address.laneName}
                {address.landmark ? `, ${address.landmark}` : ''}, {address.city} {address.pincode}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={!readyToConfirm}
            className="btn-primary w-full disabled:opacity-50"
          >
            <ShoppingCart size={14} /> Add to Cart
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}

function MerchCard({ item, onSelect }) {
  const { hasItem } = useCart();
  const inCart = MERCH_SIZES(item).some((s) => hasItem(`merch:${item.id}:${s}`));

  return (
    <div className="glass-card rounded-2xl p-6 flex flex-col">
      <div className="relative mb-5 flex h-40 w-full items-center justify-center">
        <motion.div
          whileHover={{ rotate: -3, scale: 1.05 }}
          className="relative h-28 w-24 overflow-hidden rounded-xl border border-white/10 bg-black/30 shadow-lg"
        >
          <Image src={item.imageFront} alt={`${item.title} front`} fill className="object-cover" sizes="96px" />
        </motion.div>
        <motion.div
          whileHover={{ rotate: 3, scale: 1.05 }}
          className="relative -ml-6 mt-6 h-28 w-24 overflow-hidden rounded-xl border border-white/10 bg-black/30 shadow-lg"
        >
          <Image src={item.imageBack} alt={`${item.title} back`} fill className="object-cover" sizes="96px" />
        </motion.div>
      </div>
      <h3 className="text-base font-semibold">{item.title}</h3>
      <p className="text-xs text-slate-400">{item.subtitle}</p>
      <p className="mt-1 text-sm font-semibold" style={{ color: item.accentColor }}>
        &#8377;{item.price}
      </p>

      <div className="mt-4">
        <button
          onClick={() => onSelect(item)}
          className="btn-primary w-full text-[10px]"
        >
          {inCart ? <Check size={14} /> : <ShoppingCart size={14} />}
          {inCart ? 'Add Another' : 'Select'}
        </button>
      </div>
    </div>
  );
}

function MERCH_SIZES(item) {
  return item.sizes;
}

export default function MerchSection() {
  const { user } = useAuth();
  const { addItem, hasItem } = useCart();
  const { profile, save } = useProfile();
  const router = useRouter();
  const [activeItem, setActiveItem] = useState(null);

  const handleSelect = (item) => {
    if (!user) {
      router.push('/login?redirect=/accommodation');
      return;
    }
    setActiveItem(item);
  };

  const handleConfirm = async ({ qty, size, delivery }) => {
    const item = activeItem;
    const cartKey = `merch:${item.id}:${size}`;
    addItem({
      key: cartKey,
      id: item.id,
      kind: 'merch',
      ticketId: ticketFor(item.id),
      title: `${item.title} (${size})`,
      subtitle: item.subtitle,
      priceLabel: `₹${item.price}`,
      unitPrice: item.price,
      accentColor: item.accentColor,
      qty,
    });

    if (delivery && !hasItem('delivery')) {
      addItem({
        key: 'delivery',
        id: 'delivery',
        kind: 'addon',
        ticketId: ticketFor('delivery'),
        title: 'Delivery',
        subtitle: 'Flat delivery fee (once per order)',
        priceLabel: `₹${DELIVERY_FEE}`,
        unitPrice: DELIVERY_FEE,
        qty: 1,
        details: delivery,
      });

      if (!profile?.address) {
        const combined = [delivery.houseNumber, delivery.laneName, delivery.landmark, delivery.city, delivery.pincode]
          .filter(Boolean)
          .join(', ');
        if (combined) save({ address: combined });
      }
    }

    setActiveItem(null);
  };

  return (
    <section className="mb-14">
      <p className="section-eyebrow mb-2">Merch</p>
      <h2 className="section-heading mb-6 text-2xl sm:text-3xl">
        Gear up for Time Fall
      </h2>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8">
        {MERCH_ITEMS.map((item) => (
          <MerchCard key={item.id} item={item} onSelect={handleSelect} />
        ))}
      </div>

      {activeItem && (
        <MerchDialog
          item={activeItem}
          profile={profile}
          onClose={() => setActiveItem(null)}
          onConfirm={handleConfirm}
        />
      )}
    </section>
  );
}
