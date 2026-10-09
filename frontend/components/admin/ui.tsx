"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { FormState } from "@/app/admin/actions";

// Re-fetches the server-rendered dashboard every `seconds` so numbers and
// system status stay live, with a visible countdown. The icon spins while a
// refresh is in flight; clicking it refreshes straight away.
export function AutoRefresh({ seconds = 60 }: { seconds?: number }) {
  const router = useRouter();
  const [left, setLeft] = useState(seconds);
  const [refreshing, startRefresh] = useTransition();
  // The countdown lives in a ref so the interval can both tick it and start
  // the refresh from the timer callback itself — a refresh can't be started
  // from inside a state updater, which React runs during render.
  const remaining = useRef(seconds);

  useEffect(() => {
    remaining.current = seconds;
    const id = setInterval(() => {
      remaining.current -= 1;
      if (remaining.current <= 0) {
        remaining.current = seconds;
        startRefresh(() => router.refresh());
      }
      setLeft(remaining.current);
    }, 1000);
    return () => clearInterval(id);
  }, [router, seconds]);

  return (
    <button
      type="button"
      onClick={() => {
        remaining.current = seconds;
        setLeft(seconds);
        startRefresh(() => router.refresh());
      }}
      title="Refresh now"
      aria-label={refreshing ? "Refreshing" : `Refresh now (next automatic refresh in ${left}s)`}
      className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-2.5 py-1 text-xs text-graphite transition-colors hover:border-ink hover:text-ink"
    >
      <svg
        viewBox="0 0 20 20"
        fill="none"
        aria-hidden="true"
        className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`}
      >
        <path
          d="M16.5 10a6.5 6.5 0 1 1-1.9-4.6M16.5 3.5v3.5H13"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="tabular-nums">{refreshing ? "Refreshing…" : `Next check in ${left}s`}</span>
    </button>
  );
}

export const inputClass =
  "w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ink";

// A form wired to a server action with inline success / error feedback.
export function ActionForm({
  action,
  submit,
  className = "",
  children,
}: {
  action: (state: FormState, data: FormData) => Promise<FormState>;
  submit: string;
  className?: string;
  children: React.ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} className={className}>
      {children}
      <div className="flex items-center gap-3">
        <button
          disabled={pending}
          className="rounded-full bg-ink px-5 py-2 text-sm font-medium text-paper transition hover:bg-accent hover:text-accent-ink disabled:opacity-50"
        >
          {pending ? "Saving…" : submit}
        </button>
        {state.error && (
          <p role="alert" className="text-sm text-red-700">
            {state.error}
          </p>
        )}
        {state.ok && <p className="text-sm text-graphite">{state.ok}</p>}
      </div>
    </form>
  );
}
