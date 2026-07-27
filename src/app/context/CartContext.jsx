'use client';

import { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { parsePriceLabel } from '@/lib/parsePriceLabel';
import { useAuth } from './AuthContext';

const STORAGE_KEY = 'conscientia_cart';
const FOOD_IDS = ['breakfast', 'lunch', 'dinner'];

// Self-heals cart rows that were written before `kind`/`unitPrice` were
// fixed up (e.g. accommodation/food items saved with the old generic
// kind: 'addon', or workshop/event items saved with no unitPrice at all).
// Runs on every load so stale rows already sitting in localStorage or the
// `cart_items` table pick up the fix without the user re-adding anything.
function normalizeItem(item) {
  if (!item) return item;
  let next = item;
  if (next.id === 'accommodation' && next.kind !== 'accommodation') {
    next = { ...next, kind: 'accommodation' };
  } else if (FOOD_IDS.includes(next.id) && next.kind !== 'food') {
    next = { ...next, kind: 'food' };
  }
  if (typeof next.unitPrice !== 'number' && typeof next.priceLabel === 'string') {
    const parsed = parsePriceLabel(next.priceLabel);
    if (parsed !== null) next = { ...next, unitPrice: parsed };
  }
  return next;
}

function normalizeItems(items) {
  return (items || []).map(normalizeItem);
}
const CartContext = createContext({
  items: [],
  addItem: () => {},
  setItem: () => {},
  removeItem: () => {},
  updateQty: () => {},
  clear: () => {},
  hasItem: () => false,
});

function readLocalCart() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeLocalCart(items) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent('cart:updated', { detail: items }));
}

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const syncedForUser = useRef(null);

  // Guest cart: mirror localStorage into state, reacting to other tabs.
  useEffect(() => {
    if (user) return;
    syncedForUser.current = null;
    setItems(normalizeItems(readLocalCart()));
    const onUpdate = (e) => setItems(normalizeItems(e.detail || readLocalCart()));
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY) setItems(normalizeItems(readLocalCart()));
    };
    window.addEventListener('cart:updated', onUpdate);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('cart:updated', onUpdate);
      window.removeEventListener('storage', onStorage);
    };
  }, [user]);

  // On login: push any guest-cart items into Supabase, then load the
  // authoritative remote cart for this account.
  useEffect(() => {
    if (!user || syncedForUser.current === user.id) return;
    syncedForUser.current = user.id;

    (async () => {
      const guestItems = readLocalCart();

      if (guestItems.length > 0) {
        const rows = guestItems.map((item) => ({
          user_id: user.id,
          item_key: item.key,
          item_data: item,
        }));
        await supabase.from('cart_items').upsert(rows, { onConflict: 'user_id,item_key' });
        writeLocalCart([]);
      }

      const { data, error } = await supabase
        .from('cart_items')
        .select('item_data')
        .eq('user_id', user.id);

      if (!error) {
        const rawItems = (data || []).map((row) => row.item_data);
        const normalized = normalizeItems(rawItems);
        setItems(normalized);
        // Persist the healed shape back so this doesn't need to re-run
        // every load, and so downstream reads (e.g. admin views) see it too.
        const staleRows = normalized
          .filter((item, i) => JSON.stringify(item) !== JSON.stringify(rawItems[i]))
          .map((item) => ({ user_id: user.id, item_key: item.key, item_data: item }));
        if (staleRows.length > 0) {
          supabase.from('cart_items').upsert(staleRows, { onConflict: 'user_id,item_key' });
        }
      }
    })();
  }, [user]);

  const addItem = useCallback(
    async (item) => {
      const itemWithQty = { qty: 1, ...item };
      if (user) {
        let merged = null;
        setItems((prev) => {
          const existing = prev.find((i) => i.key === itemWithQty.key);
          if (existing) {
            merged = { ...existing, ...itemWithQty, qty: (existing.qty || 1) + (itemWithQty.qty || 1) };
            return prev.map((i) => (i.key === itemWithQty.key ? merged : i));
          }
          merged = itemWithQty;
          return [...prev, itemWithQty];
        });
        await supabase
          .from('cart_items')
          .upsert(
            [{ user_id: user.id, item_key: itemWithQty.key, item_data: merged }],
            { onConflict: 'user_id,item_key' }
          );
        return;
      }
      const current = readLocalCart();
      const existing = current.find((i) => i.key === itemWithQty.key);
      const next = existing
        ? current.map((i) =>
            i.key === itemWithQty.key
              ? { ...i, ...itemWithQty, qty: (i.qty || 1) + (itemWithQty.qty || 1) }
              : i
          )
        : [...current, itemWithQty];
      writeLocalCart(next);
      setItems(next);
    },
    [user]
  );

  // Full upsert-or-replace for cases addItem/updateQty don't cover — e.g.
  // date-based accommodation/food selections where qty AND other fields
  // (details.dates, priceLabel) all need to change together, not just merge
  // quantities. Always overwrites the existing item_data if the key exists.
  const setItem = useCallback(
    async (item) => {
      const full = { qty: 1, ...item };
      if (user) {
        setItems((prev) => {
          const exists = prev.some((i) => i.key === full.key);
          return exists ? prev.map((i) => (i.key === full.key ? full : i)) : [...prev, full];
        });
        await supabase
          .from('cart_items')
          .upsert([{ user_id: user.id, item_key: full.key, item_data: full }], { onConflict: 'user_id,item_key' });
        return;
      }
      const current = readLocalCart();
      const exists = current.some((i) => i.key === full.key);
      const next = exists ? current.map((i) => (i.key === full.key ? full : i)) : [...current, full];
      writeLocalCart(next);
      setItems(next);
    },
    [user]
  );

  const updateQty = useCallback(
    async (key, qty) => {
      const nextQty = Math.max(1, Number(qty) || 1);
      if (user) {
        let updatedItem = null;
        setItems((prev) =>
          prev.map((i) => {
            if (i.key !== key) return i;
            updatedItem = { ...i, qty: nextQty };
            return updatedItem;
          })
        );
        if (updatedItem) {
          await supabase
            .from('cart_items')
            .upsert(
              [{ user_id: user.id, item_key: key, item_data: updatedItem }],
              { onConflict: 'user_id,item_key' }
            );
        }
        return;
      }
      const current = readLocalCart();
      const next = current.map((i) => (i.key === key ? { ...i, qty: nextQty } : i));
      writeLocalCart(next);
      setItems(next);
    },
    [user]
  );

  const removeItem = useCallback(
    async (key) => {
      if (user) {
        setItems((prev) => prev.filter((i) => i.key !== key));
        await supabase.from('cart_items').delete().eq('user_id', user.id).eq('item_key', key);
        return;
      }
      const next = readLocalCart().filter((i) => i.key !== key);
      writeLocalCart(next);
      setItems(next);
    },
    [user]
  );

  const clear = useCallback(async () => {
    if (user) {
      setItems([]);
      await supabase.from('cart_items').delete().eq('user_id', user.id);
      return;
    }
    writeLocalCart([]);
    setItems([]);
  }, [user]);

  const hasItem = useCallback((key) => items.some((i) => i.key === key), [items]);

  // Every function here is already useCallback'd (identity only changes
  // with `items`), but the context value object itself was still a fresh
  // literal every render — meaning every consumer (every card on a listing
  // page reads this directly, plus again via usePaymentReminder) re-rendered
  // on any CartProvider render at all, not just ones where the cart
  // actually changed. Memoizing the value object fixes that.
  const value = useMemo(
    () => ({ items, addItem, setItem, removeItem, updateQty, clear, hasItem }),
    [items, addItem, setItem, removeItem, updateQty, clear, hasItem]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  return useContext(CartContext);
}
