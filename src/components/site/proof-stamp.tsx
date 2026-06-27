import { cn } from "@/lib/utils";

/** Compact brand mark (the proof-stamp distilled): a red ring + the Casper angle
 * mark. Used as the nav symbol and favicon — the logo IS the proof motif. */
export function BrandMark({ size = 22, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={cn("text-casper", className)} aria-hidden>
      <circle cx="12" cy="12" r="10.5" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.5" />
      <circle cx="12" cy="12" r="7.6" fill="none" stroke="currentColor" strokeWidth="0.6" opacity="0.35" />
      <rect x="7.6" y="7.6" width="8.8" height="8.8" transform="rotate(45 12 12)" fill="none" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

/**
 * The Proof-Print signature: a circular halftone "settlement seal" in Casper red.
 * Static brand form here (a logo/marker); the P6 settle animation will stamp it
 * with a real deploy hash. Deterministic geometry — safe for SSR (no random).
 */
export function ProofStamp({
  size = 96,
  hash,
  label = "CASPER · SETTLED ·",
  muted = false,
  className,
}: {
  size?: number;
  hash?: string;
  label?: string;
  muted?: boolean;
  className?: string;
}) {
  const id = hash ? `pp-${hash.slice(0, 8)}` : "pp-mark";
  const arc = hash ? `· ${hash.slice(0, 6)}…${hash.slice(-6)} ·` : "· PROOF ON SETTLE ·";

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      role="img"
      aria-label={hash ? `Settlement seal ${hash}` : "Casper settlement seal"}
      className={cn(muted ? "text-ink-3/40" : "text-casper", className)}
      style={{ transform: "rotate(-4deg)" }}
    >
      <defs>
        <pattern id={`${id}-halftone`} width="4.4" height="4.4" patternUnits="userSpaceOnUse">
          <circle cx="2.2" cy="2.2" r="1.05" fill="currentColor" />
        </pattern>
        <radialGradient id={`${id}-fade`}>
          <stop offset="0%" stopColor="white" stopOpacity="1" />
          <stop offset="62%" stopColor="white" stopOpacity="0.85" />
          <stop offset="100%" stopColor="white" stopOpacity="0.15" />
        </radialGradient>
        <mask id={`${id}-mask`}>
          <circle cx="50" cy="50" r="36" fill={`url(#${id}-fade)`} />
          {/* knock out the center angle-mark + a clear band for the inner text */}
          <circle cx="50" cy="50" r="20" fill="black" />
        </mask>
        <path id={`${id}-top`} d="M50,50 m-30,0 a30,30 0 1,1 60,0" fill="none" />
        <path id={`${id}-bot`} d="M50,50 m-26,0 a26,26 0 1,0 52,0" fill="none" />
      </defs>

      {/* halftone ink field */}
      <circle cx="50" cy="50" r="36" fill={`url(#${id}-halftone)`} mask={`url(#${id}-mask)`} style={{ mixBlendMode: "multiply" }} />

      {/* double ring */}
      <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" strokeWidth="1.4" opacity={muted ? 0.4 : 0.9} />
      <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="0.6" opacity={muted ? 0.3 : 0.6} />

      {/* arc text — mono "proof voice" */}
      <text fill="currentColor" fontSize="5.2" fontFamily="var(--font-mono)" letterSpacing="1.1" fontWeight={600}>
        <textPath href={`#${id}-top`} startOffset="50%" textAnchor="middle">{label}</textPath>
      </text>
      <text fill="currentColor" fontSize="4.2" fontFamily="var(--font-mono)" letterSpacing="0.8" opacity={0.8}>
        <textPath href={`#${id}-bot`} startOffset="50%" textAnchor="middle">{arc}</textPath>
      </text>

      {/* center angle mark (Casper rotated square) */}
      <rect x="42" y="42" width="16" height="16" transform="rotate(45 50 50)" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
