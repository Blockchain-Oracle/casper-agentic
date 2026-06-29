"use client";

import { ChevronDown, KeyRound, Loader2, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { formatTokenAmount } from "@/lib/format-amount";
import type { ApiKeyView } from "@/lib/gateway-api";

export function PaymentMethodMenu({
  onChange,
  value,
}: {
  onChange: (value: "api-key" | "wallet") => void;
  value: "api-key" | "wallet";
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" className="justify-between gap-2 sm:min-w-44">
          {value === "api-key" ? <KeyRound className="size-4" /> : <Wallet className="size-4" />}
          {value === "api-key" ? "API key" : "Wallet"}
          <ChevronDown className="size-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuRadioGroup value={value} onValueChange={(next) => onChange(next as "api-key" | "wallet")}>
          <DropdownMenuRadioItem value="api-key">API key balance</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="wallet" disabled>Wallet direct (not live yet)</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function ExistingKeyDropdown({
  amount,
  creating,
  keys,
  onCreate,
  onSelect,
  selectedKey,
}: {
  amount: string;
  creating: boolean;
  keys: ApiKeyView[];
  onCreate: () => void;
  onSelect: (id: string) => void;
  selectedKey?: ApiKeyView;
}) {
  const selectedTooLow = selectedKey ? BigInt(selectedKey.available ?? "0") < BigInt(amount) : false;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" className="h-auto min-h-10 justify-between gap-2 px-3 py-2">
          <span className="flex min-w-0 items-center gap-2 text-left">
            <KeyRound className="size-4 shrink-0 text-casper" />
            <span className="min-w-0">
              <span className="block truncate text-sm">{selectedKey?.name ?? "Select API key"}</span>
              {selectedKey ? (
                <span className={`block font-mono text-[10px] ${selectedTooLow ? "text-signal" : "text-ink-3"}`}>
                  {formatTokenAmount(selectedKey.available ?? "0")} WCSPR available
                </span>
              ) : null}
            </span>
          </span>
          <ChevronDown className="size-3.5 shrink-0 text-ink-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72">
        <DropdownMenuLabel>Existing keys</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={selectedKey?.id ?? ""} onValueChange={onSelect}>
          {keys.map((key) => {
            const tooLow = BigInt(key.available ?? "0") < BigInt(amount);
            return (
              <DropdownMenuRadioItem key={key.id} value={key.id} className="items-start">
                <span className="min-w-0">
                  <span className="block truncate">{key.name}</span>
                  <span className={`block font-mono text-[10px] ${tooLow ? "text-signal" : "text-muted-foreground"}`}>
                    {formatTokenAmount(key.available ?? "0")} WCSPR available
                  </span>
                </span>
              </DropdownMenuRadioItem>
            );
          })}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={(event) => { event.preventDefault(); onCreate(); }} disabled={creating}>
            {creating ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
            Create another key
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function KeySelectorSkeleton() {
  return (
    <div className="grid gap-2 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}
