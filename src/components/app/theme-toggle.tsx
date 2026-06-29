"use client";

import { useTheme } from "@/components/app/theme-provider";

const MoonIcon = (
  <svg aria-hidden fill="none" height="16" viewBox="0 0 24 24" width="16">
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8" />
  </svg>
);

const SunIcon = (
  <svg aria-hidden fill="none" height="16" viewBox="0 0 24 24" width="16">
    <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.8" />
    <path d="M12 2.5v2.2M12 19.3v2.2M21.5 12h-2.2M4.7 12H2.5M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6M18.7 18.7l-1.6-1.6M6.9 6.9 5.3 5.3" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
  </svg>
);

/**
 * Single global light/dark toggle. Renders BOTH icons and lets CSS show the right
 * one off `:root[data-theme]` (set by next-themes before paint), so there is no
 * mounted-state effect and no hydration mismatch — the moon shows in light (click
 * to go dark), the sun shows in dark.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <button
      aria-label="Toggle light or dark theme"
      className={className ? `themeToggle ${className}` : "themeToggle"}
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      title="Toggle light or dark theme"
      type="button"
    >
      <span className="themeIcon themeIcon--moon">{MoonIcon}</span>
      <span className="themeIcon themeIcon--sun">{SunIcon}</span>
    </button>
  );
}
