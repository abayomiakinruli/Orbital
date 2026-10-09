"use client";

import Link from "next/link";
import { useRef, useState, type MouseEvent, type ReactNode } from "react";

// A link to the Telegram trading bot that first asks the visitor to accept
// the Terms of Service in a popup — every time, not remembered, so no trade
// starts without it.
export default function TermsGateLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [agreed, setAgreed] = useState(false);

  function onTradeClick(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    setAgreed(false);
    dialogRef.current?.showModal();
  }

  function onContinue(event: MouseEvent<HTMLAnchorElement>) {
    if (!agreed) {
      event.preventDefault();
      return;
    }
    dialogRef.current?.close();
  }

  return (
    <>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onTradeClick}
        className={className}
      >
        {children}
      </a>

      <dialog
        ref={dialogRef}
        aria-labelledby="terms-gate-title"
        className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-3xl border border-line-dark bg-ink p-0 text-paper backdrop:bg-black/70 backdrop:backdrop-blur-sm"
      >
        <div className="p-8 sm:p-10">
          <p className="font-display text-xs tracking-[0.25em] text-white uppercase">
            Before you trade
          </p>
          <h2
            id="terms-gate-title"
            className="mt-4 font-display text-3xl font-medium tracking-tight text-paper"
          >
            Accept our Terms of Service
          </h2>
          <p className="mt-4 text-base leading-relaxed text-white">
            Trading with ORBITAL is covered by our{" "}
            <Link
              href="/terms"
              target="_blank"
              className="text-paper underline underline-offset-4 hover:text-accent"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              target="_blank"
              className="text-paper underline underline-offset-4 hover:text-accent"
            >
              Privacy Policy
            </Link>
            . Please read them before continuing to the bot.
          </p>

          <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-2xl border border-line-dark p-4 text-sm leading-relaxed text-white">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-accent)]"
            />
            I have read and agree to the ORBITAL Terms of Service and Privacy Policy.
          </label>

          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="inline-flex items-center justify-center rounded-full border border-line-dark px-6 py-3 text-sm font-medium text-white transition-colors hover:border-paper hover:text-paper"
            >
              Cancel
            </button>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onContinue}
              aria-disabled={!agreed}
              className={`inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-medium transition-colors ${
                agreed
                  ? "bg-accent text-accent-ink hover:bg-white"
                  : "cursor-not-allowed bg-white/10 text-paper/40"
              }`}
            >
              Agree &amp; continue to Telegram
            </a>
          </div>
        </div>
      </dialog>
    </>
  );
}
