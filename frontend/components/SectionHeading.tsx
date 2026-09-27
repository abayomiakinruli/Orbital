import type { ReactNode } from "react";
import Reveal from "@/frontend/components/Reveal";

interface SectionHeadingProps {
  index: string;
  label: string;
  title: string;
  tone?: "light" | "dark";
  align?: "left" | "center";
  children?: ReactNode;
}

export default function SectionHeading({
  index,
  label,
  title,
  tone = "light",
  align = "left",
  children,
}: SectionHeadingProps) {
  const muted = tone === "dark" ? "text-paper/50" : "text-graphite";
  const heading = tone === "dark" ? "text-paper" : "text-ink";

  return (
    <div className={align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      <Reveal>
        <p
          className={`font-display text-xs font-medium tracking-[0.25em] uppercase ${muted}`}
        >
          {index} / {label}
        </p>
      </Reveal>
      <Reveal delayMs={80}>
        <h2
          className={`mt-5 font-display text-4xl font-medium tracking-tight text-balance sm:text-5xl lg:text-6xl ${heading}`}
        >
          {title}
        </h2>
      </Reveal>
      {children ? (
        <Reveal delayMs={160}>
          <div className={`mt-6 text-lg leading-relaxed ${tone === "dark" ? "text-paper/70" : "text-graphite"}`}>
            {children}
          </div>
        </Reveal>
      ) : null}
    </div>
  );
}
