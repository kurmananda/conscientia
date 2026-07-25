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

  const guard = useCallback(
    (proceed) => {
      if (missingMerch || missingAccommodation) {
        setPendingProceed(() => proceed);
      } else {
        proceed();
      }
    },
    [missingMerch, missingAccommodation]
  );

  const modalProps = {
    open: !!pendingProceed,
    missingMerch,
    missingAccommodation,
    onContinue: () => {
      const proceed = pendingProceed;
      setPendingProceed(null);
      proceed?.();
    },
    onClose: () => setPendingProceed(null),
  };

  return { guard, modalProps };
}
