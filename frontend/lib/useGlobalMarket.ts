"use client";

import { useEffect, useState } from "react";
import type { GlobalMarket } from "@/backend/market";

const REFRESH_MS = 5 * 60_000;
// The server may still be fetching its first prices when the page renders,
// so an empty ticker asks again sooner.
const EMPTY_RETRY_MS = 5_000;

// Global market prices for the ticker, rendered on the server first and then
// re-polled. A failed refresh keeps the last good prices on screen; `failed`
// is true while the latest attempt brought nothing back.
export function useGlobalMarket(initial: GlobalMarket) {
  const [data, setData] = useState(initial);
  const [failed, setFailed] = useState(false);
  const empty = data.coins.length === 0;

  useEffect(() => {
    let cancelled = false;
    const id = setInterval(async () => {
      try {
        const res = await fetch("/api/market", { cache: "no-store" });
        if (!res.ok) throw new Error(String(res.status));
        const next = (await res.json()) as GlobalMarket;
        if (cancelled) return;
        // Never swap good prices for an empty answer.
        if (next.coins.length > 0) setData(next);
        setFailed(next.coins.length === 0);
      } catch {
        if (!cancelled) setFailed(true);
      }
    }, empty ? EMPTY_RETRY_MS : REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [empty]);

  return { coins: data.coins, stale: data.stale, failed };
}
