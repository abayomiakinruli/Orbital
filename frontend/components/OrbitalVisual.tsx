export default function OrbitalVisual() {
  return (
    <div
      aria-hidden="true"
      className="relative mx-auto aspect-square w-full max-w-105 sm:max-w-130"
    >
      <div className="orbit orbit-1" />
      <div className="orbit orbit-2" />
      <div className="orbit orbit-3" />
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Brand-green core, glowing — the black hero behind it makes a
            dark dot invisible, so this replaces the old bg-ink dot. */}
        <div className="h-2.5 w-2.5 rounded-full bg-accent shadow-[0_0_18px_4px_rgba(52,187,120,0.65)]" />
      </div>
    </div>
  );
}
