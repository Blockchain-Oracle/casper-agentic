const COMPACT_AGE = /^(now|\d+\s*(s|m|h|d|mo|y))$/i;

/**
 * Compact relative age for receipt tables and timelines: "12s", "3m", "2h", "5d".
 * Accepts ISO timestamps (from Postgres) and already-compact fixture ages (passed
 * through unchanged). This is what replaces the raw `2026-06-26T10:14:38.270Z`
 * string that was overflowing its column in the explorer.
 *
 * Uses Date.now(), so it is correct only in client render — the explorer renders
 * client-side after a Suspense boundary, so there is no SSR/hydration mismatch.
 */
export function formatAge(value: string | null | undefined): string {
  if (!value) return "—";
  const trimmed = value.trim();
  if (COMPACT_AGE.test(trimmed)) return trimmed;
  const ms = Date.parse(trimmed);
  if (Number.isNaN(ms)) return trimmed;
  const seconds = Math.floor((Date.now() - ms) / 1000);
  if (seconds < 5) return "now";
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo`;
  return `${Math.floor(months / 12)}y`;
}
