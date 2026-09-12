'use client';

import { useState } from 'react';
import { FOOD_ADDONS, STAY_DATES } from '../accommodation/merchData';

const LABELS = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', accommodation: 'Accommodation' };

function datesFor(internalId) {
  if (internalId === 'accommodation') return STAY_DATES.map((d) => d.id);
  return FOOD_ADDONS.find((f) => f.id === internalId)?.dates || [];
}

/**
 * Shown once when a user has paid meal/accommodation add-ons whose per-day
 * selection was lost (bookings recorded before day-level tracking existed).
 * Forces exactly `qty` days (nights, for accommodation) picked per item
 * before it can be submitted.
 */
export default function MealDaySelectionModal({ email, items, onDone }) {
  const [selections, setSelections] = useState(() =>
    Object.fromEntries(items.map((i) => [i.booking_uid, []]))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const toggle = (item, dateId) => {
    setSelections((prev) => {
      const current = prev[item.booking_uid] || [];
      const has = current.includes(dateId);
      let next;
      if (has) {
        next = current.filter((d) => d !== dateId);
      } else {
        if (current.length >= item.qty) return prev; // already picked enough
        next = [...current, dateId];
      }
      return { ...prev, [item.booking_uid]: next };
    });
  };

  const allComplete = items.every((i) => (selections[i.booking_uid] || []).length === i.qty);

  const submit = async () => {
    setSaving(true);
    setError('');
    try {
      const resolutions = items.map((i) => ({ booking_uid: i.booking_uid, dates: selections[i.booking_uid] }));
      const res = await fetch('/api/profile/meal-days', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, resolutions }),
      });
      const json = await res.json().catch(() => ({}));
      if (!json.success) throw new Error(json.message || 'Could not save your selection.');
      onDone();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0b0f14] p-6">
        <h3 className="mb-1 text-lg font-bold text-white">Which days did you book?</h3>
        <p className="mb-5 text-sm text-white/50">
          We lost the day-level details for some of your paid meal/accommodation add-ons — you
          already paid for these, we just need to know which days. Pick exactly the number you
          booked for each.
        </p>

        <div className="space-y-5">
          {items.map((item) => {
            const dates = datesFor(item.internal_id);
            const picked = selections[item.booking_uid] || [];
            const unit = item.internal_id === 'accommodation' ? 'night' : 'day';
            return (
              <div key={item.booking_uid}>
                <p className="mb-2 text-sm font-semibold text-white">
                  {LABELS[item.internal_id] || item.internal_id} — pick {item.qty} {unit}
                  {item.qty > 1 ? 's' : ''} ({picked.length}/{item.qty})
                </p>
                <div className="flex flex-wrap gap-2">
                  {dates.map((d) => {
                    const active = picked.includes(d);
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => toggle(item, d)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                          active
                            ? 'border-cyan-400 bg-cyan-400/20 text-cyan-300'
                            : 'border-white/15 text-white/60 hover:border-white/30'
                        }`}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {error && <p className="mt-4 text-xs text-red-300">{error}</p>}

        <button
          type="button"
          disabled={!allComplete || saving}
          onClick={submit}
          className="mt-6 w-full rounded-full bg-cyan-400 px-6 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-black transition-colors hover:bg-white disabled:opacity-40"
        >
          {saving ? 'Saving…' : 'Confirm Days'}
        </button>
      </div>
    </div>
  );
}
