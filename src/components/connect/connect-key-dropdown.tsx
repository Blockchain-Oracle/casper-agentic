"use client";

import { ChevronDown, KeyRound, Loader2 } from "lucide-react";

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
import { formatTokenAmount } from "@/lib/format-amount";
import type { ApiKeyView } from "@/lib/gateway-api";

export function ConnectKeyDropdown({
  creating,
  keys,
  onCreate,
  onSelect,
  selectedKey,
}: {
  creating: boolean;
  keys: ApiKeyView[];
  onCreate: () => void;
  onSelect: (id: string) => void;
  selectedKey?: ApiKeyView;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" className="h-auto min-h-10 justify-between gap-2 px-3 py-2 sm:min-w-56">
          <span className="flex min-w-0 items-center gap-2 text-left">
            <KeyRound className="size-4 shrink-0 text-casper" />
            <span className="min-w-0">
              <span className="block truncate text-sm">{selectedKey?.name ?? "Select key"}</span>
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
      <DropdownMenuContent align="start" className="w-72">
        <DropdownMenuLabel>Use existing key</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={selectedKey?.id ?? ""} onValueChange={onSelect}>
          {keys.map((key) => (
            <DropdownMenuRadioItem key={key.id} value={key.id} className="items-start">
              <span className="min-w-0">
                <span className="block truncate">{key.name}</span>
                <span className="block font-mono text-[10px] text-muted-foreground">
                  {formatTokenAmount(key.available ?? "0")} WCSPR available
                </span>
              </span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={(event) => { event.preventDefault(); onCreate(); }} disabled={creating}>
            {creating ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
            New key
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
