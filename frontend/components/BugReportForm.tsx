"use client";

import { useState, type SubmitEvent } from "react";

// The form on the /report-bug page (linked from the footer). Posts to
// /api/bug-report; reports are listed at /admin/bugs. The page itself
// carries the heading, so this is just the fields.
export default function BugReportForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");

  async function onSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const trap = new FormData(event.currentTarget).get("orbital_hp");
    setState("sending");
    try {
      const res = await fetch("/api/bug-report", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, message, orbital_hp: trap, path: window.location.pathname }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setState("error");
        return;
      }
      setState("done");
      setEmail("");
      setMessage("");
    } catch {
      setError("Something went wrong. Please try again.");
      setState("error");
    }
  }

  return (
    <div aria-live="polite">
      {state === "done" ? (
        <p className="rounded-2xl border border-line-dark p-8 text-lg text-accent" role="status">
          Thanks, your report has been sent to our team.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <label htmlFor="bug-message" className="sr-only">
            What went wrong?
          </label>
          <textarea
            id="bug-message"
            required
            minLength={10}
            maxLength={2000}
            rows={6}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="What went wrong? Include the page and what you were doing."
            className="resize-y rounded-2xl border border-line-dark bg-white/5 px-6 py-4 text-base text-paper placeholder:text-paper/35 focus:border-accent focus:outline-none"
          />
          <div className="flex flex-col gap-3 sm:flex-row">
            <label htmlFor="bug-email" className="sr-only">
              Email address
            </label>
            <input
              id="bug-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="min-w-0 flex-1 rounded-full border border-line-dark bg-white/5 px-6 py-3.5 text-base text-paper placeholder:text-paper/35 focus:border-accent focus:outline-none"
            />
            {/* Honeypot: hidden from people, filled in by bots. Deliberately not
                named like a real field ("company", "website"…), which browser
                autofill would fill in for genuine visitors. */}
            <input
              type="text"
              name="orbital_hp"
              data-1p-ignore
              data-lpignore="true"
              data-form-type="other"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="absolute left-[-9999px] h-0 w-0 opacity-0"
            />
            <button
              type="submit"
              disabled={state === "sending"}
              className="inline-flex items-center justify-center rounded-full bg-accent px-7 py-3.5 text-sm font-medium text-accent-ink transition-colors hover:bg-white disabled:opacity-60"
            >
              {state === "sending" ? "Sending…" : "Submit"}
            </button>
          </div>
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
