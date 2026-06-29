"use client";

import { ChevronDown, KeyRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatTokenAmount } from "@/lib/format-amount";
import type { ApiKeyView } from "@/lib/gateway-api";

export function keyLabel(key?: ApiKeyView) {
  if (!key) return "No key selected";
  return key.name || `${key.prefix}...`;
}

export function FundKeyDropdown({
  keys,
  onSelect,
  selectedKey,
}: {
  keys: ApiKeyView[];
  onSelect: (id: string) => void;
  selectedKey?: ApiKeyView;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" className="h-auto min-h-10 w-full justify-between gap-2 px-3 py-2">
          <span className="flex min-w-0 items-center gap-2 text-left">
            <KeyRound className="size-4 shrink-0 text-casper" />
            <span className="min-w-0">
              <span className="block truncate text-sm">{keyLabel(selectedKey)}</span>
              {selectedKey ? (
                <span className="block font-mono text-[10px] text-ink-3">
                  {formatTokenAmount(selectedKey.available ?? "0")} WCSPR available
                </span>
              ) : null}
            </span>
          </span>
          <ChevronDown className="size-3.5 shrink-0 text-ink-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[min(24rem,calc(100vw-2rem))]">
        <DropdownMenuLabel>Select key</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={selectedKey?.id ?? ""} onValueChange={onSelect}>
          {keys.map((key) => (
            <DropdownMenuRadioItem key={key.id} value={key.id} className="items-start">
              <span className="min-w-0">
                <span className="block truncate">{keyLabel(key)}</span>
                <span className="block font-mono text-[10px] text-muted-foreground">
                  {formatTokenAmount(key.available ?? "0")} WCSPR available
                </span>
              </span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
