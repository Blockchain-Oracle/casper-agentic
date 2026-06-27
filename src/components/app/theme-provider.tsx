"use client";

import { ThemeProvider as NextThemeProvider } from "next-themes";

/**
 * One global light/dark theme for the whole app (Abu's "one theme everywhere"
 * decision). next-themes writes `data-theme` on <html>; base.css maps that to the
 * v3 palette. Default dark — the operator app's intended look — with no flash on
 * load and persistence across reloads/tabs. The toggle lives in every header.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemeProvider
      attribute="data-theme"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      {children}
    </NextThemeProvider>
  );
}
