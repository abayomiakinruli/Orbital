"use client";

import { useState, type FormEvent } from "react";

// The footer's "Get ORBITAL updates" email box. Posts to /api/subscribe;
// sign-ups are listed at /admin/subscribers.
export default function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const company = new FormData(event.currentTarget).get("company");
    setState("sending");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, company, path: window.location.pathname }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setState("error");
        return;
      }
      setState("done");
      setEmail("");
    } catch {
      setError("Something went wrong. Please try again.");
      setState("error");
    }
  }

  return (
    <div className="max-w-md">
      <p className="font-display text-base font-medium text-paper">Get ORBITAL updates</p>
      <p className="mt-1 text-sm text-paper/50">
        New assets, trading notices and announcements, straight to your inbox.
      </p>

      {state === "done" ? (
        <p className="mt-4 text-sm text-accent" role="status">
          Thanks, you&apos;re on the list.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-2 sm:flex-row">
          <label htmlFor="newsletter-email" className="sr-only">
            Email address
          </label>
          <input
            id="newsletter-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="min-w-0 flex-1 rounded-full border border-line-dark bg-white/5 px-5 py-3 text-sm text-paper placeholder:text-paper/35 focus:border-accent focus:outline-none"
          />
          {/* Honeypot: hidden from people, filled in by bots. */}
          <input
            type="text"
            name="company"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="absolute -left-[9999px] h-0 w-0 opacity-0"
          />
          <button
            type="submit"
            disabled={state === "sending"}
            className="inline-flex items-center justify-center rounded-full bg-accent px-6 py-3 text-sm font-medium text-accent-ink transition-colors hover:bg-white disabled:opacity-60"
          >
            {state === "sending" ? "Subscribing…" : "Subscribe"}
          </button>
        </form>
      )}
      {state === "error" && (
        <p className="mt-2 text-sm text-[#e66767]" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
