"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/components/app/theme-provider";
import { Menu, Moon, Sun } from "lucide-react";

import { AccountDialog } from "@/components/account/account-dialog";
import { ConnectWalletButton } from "@/components/csprclick/connect-wallet-button";
import { BrandMark } from "@/components/site/proof-stamp";
import { Button } from "@/components/ui/button";
import { networkFromChainName } from "@/lib/casper-networks";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/servers", label: "Servers" },
  { href: "/explorer", label: "Explorer" },
  { href: "/register", label: "Register" },
] as const;

/** Public top nav — every Casper GW route is public; sign-in/keys are modals. */
export function SiteNav() {
  const pathname = usePathname();
  // Network is per-deployment (this domain's chain). Direct process.env read so
  // Next inlines it into the client bundle. Mainnet gets the brand accent.
  const network = networkFromChainName(process.env.NEXT_PUBLIC_CASPER_CHAIN_NAME);

  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-surface/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-3 sm:gap-4 sm:px-5">
        <Link href="/" className="flex shrink-0 items-center gap-2 font-display text-[15px] font-bold text-ink">
          <BrandMark size={22} />
          Casper GW
          <span
            className={cn(
              "rounded-sm border px-1.5 py-0.5 font-mono text-[9px] font-medium tracking-widest max-sm:hidden",
              network.isTestnet ? "border-hairline text-ink-3" : "border-casper/50 text-casper",
            )}
          >
            {network.label.toUpperCase()}
          </span>
        </Link>

        <nav className="ml-2 hidden items-center gap-1 md:flex" aria-label="Primary">
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
          <MobileMenu pathname={pathname} />
          <ConnectWalletButton />
          <ThemeToggle />
          <AccountDialog />
        </div>
      </div>
    </header>
  );
}

function MobileMenu({ pathname }: { pathname: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon-sm" variant="ghost" className="md:hidden" aria-label="Open navigation">
          <Menu className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {LINKS.map(({ href, label }) => (
          <DropdownMenuItem key={href} asChild>
            <Link className={cn(pathname.startsWith(href) && "text-ink")} href={href}>
              {label}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
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
