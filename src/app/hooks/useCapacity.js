'use client';

import { useEffect, useState } from 'react';

// Module-level cache so every card on a listing page shares one fetch
// instead of each firing its own request.
let capacityPromise = null;

function fetchCapacity() {
  if (!capacityPromise) {
    capacityPromise = fetch('/api/capacity')
      .then((res) => res.json())
      .then((json) => json?.counts || {})
      .catch(() => ({}));
  }
  return capacityPromise;
}

/** Returns { counts, remaining(card) } — counts is { [id]: paidCount }. */
export default function useCapacity() {
  const [counts, setCounts] = useState({});

  useEffect(() => {
    let cancelled = false;
    fetchCapacity().then((data) => {
      if (!cancelled) setCounts(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const remaining = (card) => {
    if (!card || typeof card.Seats !== 'number') return Infinity;
    const taken = counts[card.id] || 0;
    return card.Seats - taken;
  };

  return { counts, remaining };
}
