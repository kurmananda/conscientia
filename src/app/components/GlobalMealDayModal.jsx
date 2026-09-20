'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import MealDaySelectionModal from './MealDaySelectionModal';

async function authedFetch(url) {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  return fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
}

// Site-wide version of the day-selection nudge: /profile already shows this
// inline (with the rest of a user's paid items for context), so this mounts
// at layout level only to catch every OTHER page — someone can otherwise sit
// on any page all fest without ever visiting /profile and never get asked.
export default function GlobalMealDayModal() {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const [registration, setRegistration] = useState(null);

  useEffect(() => {
    if (!user?.id) return;
    let active = true;
    fetch(`/api/get-registrations?user_id=${encodeURIComponent(user.id)}`)
      .then((res) => res.json())
      .then((json) => active && setRegistration(json?.data || null))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [user?.id]);

  const itemsPaid = Array.isArray(registration?.details?.items_paid)
    ? registration.details.items_paid
    : [];
  const pendingDaySelections = itemsPaid.filter(
    (i) =>
      ['breakfast', 'lunch', 'dinner', 'accommodation'].includes(i.internal_id) &&
      i.needs_day_selection &&
      i.booking_uid
  );

  if (pathname === '/profile' || loading || !user || pendingDaySelections.length === 0) return null;

  return (
    <MealDaySelectionModal
      email={user.email}
      items={pendingDaySelections}
      onDone={async () => {
        const res = await authedFetch(`/api/get-registrations?user_id=${user.id}`);
        const json = await res.json().catch(() => ({}));
        if (json?.success) setRegistration(json.data);
      }}
    />
  );
}
