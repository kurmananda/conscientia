'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

// Module-level cache keyed by user id, shared across every card instance
// on a listing page so they don't each fire their own request.
const cache = new Map();

function fetchRegisteredIds(userId) {
  if (!cache.has(userId)) {
    cache.set(
      userId,
      fetch(`/api/get-registrations?user_id=${encodeURIComponent(userId)}`)
        .then((res) => res.json())
        .then((json) => {
          const reg = json?.data;
          return reg?.payment_status === 'paid' && Array.isArray(reg.workshop_ids)
            ? reg.workshop_ids
            : [];
        })
        .catch(() => [])
    );
  }
  return cache.get(userId);
}

/** Ids the current user has a paid registration for. */
export default function useMyRegisteredIds() {
  const { user } = useAuth();
  const [ids, setIds] = useState([]);

  useEffect(() => {
    if (!user?.id) {
      setIds([]);
      return;
    }
    let cancelled = false;
    fetchRegisteredIds(user.id).then((data) => {
      if (!cancelled) setIds(data);
    });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  return ids;
}
