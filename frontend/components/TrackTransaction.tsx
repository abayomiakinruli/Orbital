"use client";

import { useEffect, useState, type SubmitEvent } from "react";
import Link from "next/link";
import Reveal from "@/frontend/components/Reveal";
import { TrackIllustration } from "@/frontend/components/Illustrations";
import { orbitalConfig } from "@/config/orbital";
import { dbTime } from "@/shared/format";

type TrackedTrade = {
  transaction_id: string;
  side: string;
  asset: string;
  amount: number | null;
  status: string;
  created_at: string;
};

type Result =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "found"; trade: TrackedTrade }
  | { kind: "notFound" }
  | { kind: "error"; message: string };

const STATUS_STYLES: Record<
  string,
  { label: string; className: string; note: string }
> = {
  processing: {
    label: "Processing",
    className: "bg-amber-100 text-amber-900",
    note: "Your transaction has been received and is being processed. You'll be notified on Telegram once it completes.",
  },
  successful: {
    label: "Successful",
    className: "bg-accent text-accent-ink",
    note: "This transaction has been completed. Thank you for trading with ORBITAL.",
  },
  failed: {
    label: "Failed",
    className: "bg-red-100 text-red-900",
    note: "This transaction could not be completed. Please contact ORBITAL support for help.",
  },
};

// created_at is stored as UTC "YYYY-MM-DD HH:MM:SS" (see backend/db.ts).
function formatDate(value: string) {
  const date = new Date(dbTime(value));
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

// `initialId` comes from a /track?id=… link (the bot sends one with each
// confirmation once SITE_URL is set); that ID is looked up straight away.
export default function TrackTransaction({
  initialId = "",
}: {
  initialId?: string;
}) {
  const [id, setId] = useState(initialId);
  const [result, setResult] = useState<Result>(
    initialId ? { kind: "loading" } : { kind: "idle" },
  );

  async function onSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = id.trim();
    if (!value) return;
    setResult({ kind: "loading" });
    await lookup(value);
  }

  async function lookup(value: string) {
    try {
      const res = await fetch(
        `/api/transaction-status?id=${encodeURIComponent(value)}`,
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setResult({
          kind: "error",
          message: data.error ?? "Something went wrong. Please try again.",
        });
      } else if (!data.trade) {
        setResult({ kind: "notFound" });
      } else {
        setResult({ kind: "found", trade: data.trade });
      }
    } catch {
      setResult({
        kind: "error",
        message: "Something went wrong. Please try again shortly.",
      });
    }
  }

  useEffect(() => {
    if (initialId) void lookup(initialId);
    // Only on first load, for the ID in the link.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const status =
    result.kind === "found" ? STATUS_STYLES[result.trade.status] : undefined;

  return (
    // The body of the /track page — it opens the page, so it carries the
    // page's h1 and the top padding that clears the fixed navbar.
    <section id="track" className="bg-charcoal pt-40 pb-28 sm:pt-48 sm:pb-36">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        {/* Heading on the left and the illustration on the right; the search
            bar and its result sit centred underneath. */}
        <div className="flex flex-col gap-14">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:gap-16">
            <div className="max-w-3xl">
              <Reveal>
                <p className="font-display text-xs font-medium tracking-[0.25em] text-white uppercase">
                  Track ID
                </p>
              </Reveal>
              <Reveal delayMs={80}>
                <h1 className="mt-5 font-display text-5xl font-medium tracking-tight text-balance text-paper sm:text-6xl lg:text-7xl">
                  Where&apos;s my transaction?
                </h1>
              </Reveal>
              <Reveal delayMs={160}>
                <p className="mt-6 text-lg leading-relaxed text-white">
                  Paste the ID from your trade confirmation to see its latest
                  status.
                </p>
              </Reveal>
            </div>

            <Reveal from="right" delayMs={160}>
              <TrackIllustration className="mx-auto h-auto w-full max-w-sm" />
            </Reveal>
          </div>

          <Reveal delayMs={120} className="mx-auto w-full max-w-3xl">
            <div className="flex flex-col justify-center">
              <form
                onSubmit={onSubmit}
                className="flex flex-col gap-3 sm:flex-row"
              >
                <label htmlFor="track-id" className="sr-only">
                  Transaction ID
                </label>
                <input
                  id="track-id"
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  placeholder="ORBT-20260927-A1B2C"
                  autoComplete="off"
                  spellCheck={false}
                  className="min-w-0 flex-1 rounded-full border border-line bg-white px-6 py-3.5 font-display text-base uppercase tracking-wide text-ink placeholder:normal-case placeholder:text-graphite/60 focus:border-ink focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={result.kind === "loading" || !id.trim()}
                  className="inline-flex items-center justify-center rounded-full bg-accent px-7 py-3.5 text-sm font-medium text-accent-ink transition-colors hover:bg-white disabled:opacity-50 disabled:hover:bg-accent"
                >
                  {result.kind === "loading" ? "Checking…" : "Track"}
                </button>
              </form>

              <div aria-live="polite" className="mt-6">
                {result.kind === "found" && (
                  <article className="rounded-2xl border border-line bg-white p-8">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className="font-display text-sm tracking-wide text-graphite">
                        {result.trade.transaction_id}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold tracking-[0.15em] uppercase ${
                          status?.className ?? "bg-line text-ink"
                        }`}
                      >
                        {status?.label ?? result.trade.status}
                      </span>
                    </div>
                    <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
                      <div>
                        <dt className="text-graphite">Type</dt>
                        <dd className="mt-1 font-medium text-ink capitalize">
                          {result.trade.side}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-graphite">Asset</dt>
                        <dd className="mt-1 font-medium text-ink">
                          {result.trade.asset}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-graphite">Amount</dt>
                        <dd className="mt-1 font-medium text-ink">
                          {result.trade.amount ?? "N/A"} {result.trade.asset}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-graphite">Date</dt>
                        <dd className="mt-1 font-medium text-ink">
                          {formatDate(result.trade.created_at)}
                        </dd>
                      </div>
                    </dl>
                    {status && (
                      <p className="mt-6 border-t border-line pt-6 text-sm leading-relaxed text-graphite">
                        {status.note}
                      </p>
                    )}
                  </article>
                )}

                {(result.kind === "notFound" || result.kind === "error") && (
                  <div className="rounded-2xl border border-line bg-white p-6 text-sm leading-relaxed text-graphite">
                    <p>
                      {result.kind === "notFound"
                        ? "We couldn't find a transaction with that ID. Please check it and try again."
                        : result.message}
                    </p>
                    <Link
                      href={orbitalConfig.supportPage}
                      className="mt-3 inline-block border-b border-ink pb-0.5 font-medium text-ink"
                    >
                      Contact support
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
