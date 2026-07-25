"use client";

import { useCallback, useState } from "react";
import { useCart } from "../context/CartContext";

/**
 * Gates a checkout action behind a one-time reminder popup for merch /
 * accommodation, unless the user's cart already has one of each — then it
 * just runs the action straight away.
 */
export default function usePaymentReminder() {
  const { items } = useCart();
  const [pendingProceed, setPendingProceed] = useState(null);

  const missingMerch = !items.some((i) => i.kind === "merch");
  const missingAccommodation = !items.some((i) => i.kind === "accommodation");
  // Only nudge about food if the user has accommodation in the cart —
  // food add-ons are meant to go alongside a stay, not standalone.
  const missingFood = !missingAccommodation && !items.some((i) => i.kind === "food");

  const guard = useCallback(
    (proceed) => {
      if (missingMerch || missingAccommodation || missingFood) {
        setPendingProceed(() => proceed);
      } else {
        proceed();
      }
    },
    [missingMerch, missingAccommodation, missingFood]
  );

  const modalProps = {
    open: !!pendingProceed,
    missingMerch,
    missingAccommodation,
    missingFood,
    onContinue: () => {
      const proceed = pendingProceed;
      setPendingProceed(null);
      proceed?.();
    },
    onClose: () => setPendingProceed(null),
  };

  return { guard, modalProps };
}
