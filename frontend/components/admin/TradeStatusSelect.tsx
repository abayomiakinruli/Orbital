"use client";

import { useState, useTransition } from "react";
import { setTradeStatus } from "@/app/admin/actions";

// A trade's status, saved the moment a new one is picked (no separate Save
// button to miss), with inline "Saving… / Saved / error" feedback. On an
// error the dropdown snaps back to the last saved status.
export default function TradeStatusSelect({
  id,
  status,
  statuses,
}: {
  id: number;
  status: string;
  statuses: readonly string[];
}) {
  const [value, setValue] = useState(status);
  const [saved, setSaved] = useState(status);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);
  const [pending, startTransition] = useTransition();

  function onChange(next: string) {
    setValue(next);
    setMessage(null);
    startTransition(async () => {
      try {
        const result = await setTradeStatus(id, next);
        if (result.error) {
          setValue(saved);
          setMessage({ text: result.error, error: true });
        } else {
          setSaved(next);
          setMessage({ text: result.ok ?? "Saved ✓" });
        }
      } catch {
        setValue(saved);
        setMessage({ text: "Couldn't save — try again.", error: true });
      }
    });
  }

  return (
    <span className="flex items-center gap-2">
      <select
        value={value}
        disabled={pending}
        onChange={(e) => onChange(e.target.value)}
        aria-label={`Status of trade ${id}`}
        className="rounded-md border border-line bg-white px-2 py-1 text-xs capitalize disabled:opacity-60"
      >
        {statuses.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <span
        aria-live="polite"
        className={`text-xs ${message?.error ? "text-red-700" : "text-graphite"}`}
      >
        {pending ? "Saving…" : message?.text}
      </span>
    </span>
  );
}
