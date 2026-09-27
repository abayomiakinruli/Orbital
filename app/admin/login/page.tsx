"use client";

import { useActionState } from "react";
import { login } from "@/app/admin/actions";
import { inputClass } from "@/components/admin/ui";

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, {});
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
      <h1 className="font-display text-2xl font-semibold text-ink">
        ORBITAL Admin
      </h1>
      <p className="mt-1 text-sm text-graphite">
        Sign in to view your company dashboard.
      </p>
      <form action={action} className="mt-6 space-y-3">
        <label className="block text-sm text-ink" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoFocus
          autoComplete="current-password"
          className={inputClass}
        />
        {state.error && (
          <p role="alert" className="text-sm text-red-700">
            {state.error}
          </p>
        )}
        <button
          disabled={pending}
          className="w-full rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper hover:bg-accent hover:text-accent-ink disabled:opacity-50"
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}
