"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";

let firstLoadDone = false;

// Remounts on every navigation, so each new page fades and rises in
// (.page-enter in frontend/styles/globals.css). The first load is left alone:
// the splash and hero already animate it.
export default function Template({ children }: { children: ReactNode }) {
  const [animate] = useState(firstLoadDone);

  useEffect(() => {
    firstLoadDone = true;
  }, []);

  return <div className={animate ? "page-enter" : undefined}>{children}</div>;
}
