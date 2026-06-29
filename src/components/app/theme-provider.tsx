"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

// One global light/dark theme (Abu's "one theme everywhere" decision), default dark.
// The no-flash script lives in the server-rendered <head> (see THEME_NO_FLASH_SCRIPT
// in layout.tsx) so it sets data-theme before paint without React client-rendering a
// <script> — which is what next-themes did and what React 19 warns about.

export type Theme = "light" | "dark";
export const THEME_STORAGE_KEY = "theme";

type ThemeContextValue = { theme: Theme; resolvedTheme: Theme; setTheme: (theme: Theme) => void };
const ThemeContext = createContext<ThemeContextValue | null>(null);

function attributeTheme(): Theme {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
}

// Briefly suppress CSS transitions during the switch (matches next-themes'
// disableTransitionOnChange — avoids a color sweep when toggling).
function withoutTransitions(apply: () => void) {
  const style = document.createElement("style");
  style.appendChild(document.createTextNode("*,*::before,*::after{transition:none!important}"));
  document.head.appendChild(style);
  apply();
  // Force a reflow, then restore transitions on the next frame.
  window.getComputedStyle(document.body);
  window.setTimeout(() => document.head.removeChild(style), 1);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Lazy init reads data-theme (set pre-paint by the head script) so the value is
  // correct from first client render — no setState-in-effect, no flash.
  const [theme, setThemeState] = useState<Theme>(attributeTheme);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === THEME_STORAGE_KEY && (event.newValue === "light" || event.newValue === "dark")) {
        document.documentElement.setAttribute("data-theme", event.newValue);
        document.documentElement.style.colorScheme = event.newValue;
        setThemeState(event.newValue);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setTheme = useCallback((next: Theme) => {
    withoutTransitions(() => {
      document.documentElement.setAttribute("data-theme", next);
      document.documentElement.style.colorScheme = next;
    });
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // storage unavailable (private mode) — in-memory only
    }
    setThemeState(next);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme: theme, setTheme }}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext) ?? { theme: "dark", resolvedTheme: "dark", setTheme: () => {} };
}
