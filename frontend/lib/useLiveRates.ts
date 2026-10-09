"use client";

import { useEffect, useState } from "react";
import type { PublicRates } from "@/backend/rates";

const REFRESH_MS = 60_000;

// ORBITAL's rates, rendered on the server first and then re-polled so an open
// page keeps up with the rate worker. `pollError` is true while the latest
// refresh failed and the last good rates are still being shown.
export function useLiveRates(initialRates: PublicRates) {
  const [data, setData] = useState(initialRates);
  const [pollError, setPollError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const id = setInterval(async () => {
      try {
        const res = await fetch("/api/rates", { cache: "no-store" });
        if (!res.ok) {
          if (!cancelled) setPollError(true);
          return;
        }
        const next = (await res.json()) as PublicRates;
        if (!cancelled) {
          setData(next);
          setPollError(false);
        }
      } catch {
        // Keep showing the last good rates on a failed refresh.
        if (!cancelled) setPollError(true);
      }
    }, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return { data, pollError };
}
