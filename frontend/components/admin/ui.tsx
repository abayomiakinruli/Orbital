"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { FormState } from "@/app/admin/actions";

// Re-fetches the server-rendered dashboard so numbers stay live.
export function AutoRefresh({ seconds = 30 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => router.refresh(), seconds * 1000);
    return () => clearInterval(id);
  }, [router, seconds]);
  return null;
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
