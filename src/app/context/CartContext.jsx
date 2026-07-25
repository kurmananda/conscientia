'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from './AuthContext';

const STORAGE_KEY = 'conscientia_cart';
const CartContext = createContext({
  items: [],
  addItem: () => {},
  removeItem: () => {},
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
    setItems(readLocalCart());
    const onUpdate = (e) => setItems(e.detail || readLocalCart());
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY) setItems(readLocalCart());
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
        setItems((data || []).map((row) => row.item_data));
      }
    })();
  }, [user]);

  const addItem = useCallback(
    async (item) => {
      if (user) {
        setItems((prev) => (prev.some((i) => i.key === item.key) ? prev : [...prev, item]));
        await supabase
          .from('cart_items')
          .upsert(
            [{ user_id: user.id, item_key: item.key, item_data: item }],
            { onConflict: 'user_id,item_key' }
          );
        return;
      }
      const current = readLocalCart();
      if (current.some((i) => i.key === item.key)) return;
      const next = [...current, item];
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

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, clear, hasItem }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
