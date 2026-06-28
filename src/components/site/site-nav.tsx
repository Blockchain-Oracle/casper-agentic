"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

import { ApiKeysDialog } from "@/components/keys/api-keys-dialog";
import { BrandMark } from "@/components/site/proof-stamp";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/servers", label: "Servers" },
  { href: "/explorer", label: "Explorer" },
  { href: "/register", label: "Register" },
] as const;

/** Public top nav — every Casper GW route is public; sign-in/keys are modals. */
export function SiteNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-surface/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-5">
        <Link href="/" className="flex items-center gap-2 font-display text-[15px] font-bold text-ink">
          <BrandMark size={22} />
          Casper GW
          <span className="rounded-sm border border-hairline px-1.5 py-0.5 font-mono text-[9px] font-medium tracking-widest text-ink-3">
            TESTNET
          </span>
        </Link>

        <nav className="ml-2 flex items-center gap-1" aria-label="Primary">
          {LINKS.map(({ href, label }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  active ? "text-ink" : "text-ink-3 hover:text-ink",
                )}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <ApiKeysDialog />
        </div>
      </div>
    </header>
  );
}

/** Single global light/dark toggle (next-themes data-theme). Icon visibility is
 * CSS-driven (dark: variant) so there's no hydration flash and no setState effect. */
function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <Button
      size="icon"
      variant="ghost"
      aria-label="Toggle theme"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="text-ink-2"
    >
      <Moon className="size-4 dark:hidden" />
      <Sun className="hidden size-4 dark:block" />
    </Button>
  );
}
