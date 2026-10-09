import type { ReactNode } from "react";
import Reveal from "@/frontend/components/Reveal";

interface SectionHeadingProps {
  label: string;
  title: string;
  tone?: "light" | "dark";
  align?: "left" | "center";
  children?: ReactNode;
}

export default function SectionHeading({
  label,
  title,
  tone = "light",
  align = "left",
  children,
}: SectionHeadingProps) {
  const muted = tone === "dark" ? "text-white" : "text-[#1d8a55]";
  const heading = tone === "dark" ? "text-paper" : "text-ink";

  return (
    <div className={align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      <Reveal>
        <p
          className={`font-display text-xs font-medium tracking-[0.25em] uppercase ${muted}`}
        >
          {label}
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
          <div className={`mt-6 text-lg leading-relaxed ${tone === "dark" ? "text-white" : "text-graphite"}`}>
            {children}
          </div>
        </Reveal>
      ) : null}
    </div>
  );
}
