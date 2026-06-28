// WCSPR asset glyph — Casper's angle mark in a chip. WCSPR is the only settle-able
// Casper x402 asset, so this is the single token icon for now.
export function TokenIcon({ size = 16 }: { size?: number }) {
  return (
    <span
      title="WCSPR"
      className="inline-flex shrink-0 items-center justify-center rounded-full border border-hairline bg-well"
      style={{ height: size, width: size }}
    >
      <svg viewBox="0 0 24 24" width={size * 0.58} height={size * 0.58} aria-hidden="true">
        <rect x="6.5" y="6.5" width="11" height="11" rx="1.5" transform="rotate(45 12 12)" className="fill-casper" />
      </svg>
    </span>
  );
}
