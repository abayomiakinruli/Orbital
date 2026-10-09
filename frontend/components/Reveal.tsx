"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  className?: string;
  delayMs?: number;
  // Direction the content travels in from; sideways entrances move further.
  from?: "up" | "left" | "right";
  style?: CSSProperties;
}

export default function Reveal({ children, className = "", delayMs = 0, from = "up", style }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      // Wait until the element is 80px clear of the bottom edge.
      { rootMargin: "0px 0px -80px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${from === "up" ? "" : `reveal-${from}`} ${visible ? "reveal-visible" : ""} ${className}`}
      style={
        {
          ...style,
          transitionDelay: visible ? `${delayMs}ms` : "0ms",
          // Read by .pop children so they pop in just after their parent.
          "--reveal-delay": `${delayMs}ms`,
        } as CSSProperties
      }
    >
      {children}
    </div>
  );
}
