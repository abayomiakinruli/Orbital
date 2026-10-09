"use client";

import { useRef, type ReactNode } from "react";

// A button that opens its children in a pop-up (the browser's own <dialog>,
// so Escape closes it and focus stays inside). Used on admin pages to keep a
// list compact: each row or tile is the button, the full editor is inside.
export default function Popup({
  trigger,
  title,
  label,
  className,
  children,
}: {
  trigger: ReactNode;
  title: string;
  // Read out for the button when `trigger` isn't self-explanatory.
  label?: string;
  className?: string;
  children: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        aria-label={label}
        aria-haspopup="dialog"
        onClick={() => dialog.current?.showModal()}
        className={className}
      >
        {trigger}
      </button>
      <dialog
        ref={dialog}
        aria-label={title}
        // A click on the dimmed area outside the panel lands on the dialog itself.
        onClick={(event) => {
          if (event.target === dialog.current) dialog.current.close();
        }}
        className="m-auto w-[min(48rem,calc(100vw-2rem))] rounded-2xl border border-line bg-white p-0 text-ink backdrop:bg-ink/60"
      >
        <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
          <p className="font-display text-sm font-semibold text-ink">{title}</p>
          <button
            type="button"
            aria-label="Close"
            onClick={() => dialog.current?.close()}
            className="flex h-8 w-8 items-center justify-center rounded-full text-graphite transition-colors hover:bg-ink/10 hover:text-ink"
          >
            ✕
          </button>
        </div>
        <div className="max-h-[80vh] overflow-y-auto p-5">{children}</div>
      </dialog>
    </>
  );
}
