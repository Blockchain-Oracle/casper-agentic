import { describe, expect, it, vi } from "vitest";

import type { CSPRClickAccountEvent, CSPRClickEventName } from "@/lib/csprclick-browser";
import { bindCSPRClickAccountEvents, requestCSPRClickSignIn } from "@/lib/csprclick-browser-session";

describe("CSPR.click browser session helpers", () => {
  it("binds account events and signs in unsolicited account changes", () => {
    const listeners = new Map<string, ((event?: CSPRClickAccountEvent) => void)>();
    const loadedListeners = new Map<string, () => void>();
    const onChange = vi.fn();
    const signInWithAccount = vi.fn();
    const win = {
      addEventListener: vi.fn((name: "csprclick:loaded", handler: () => void) => loadedListeners.set(name, handler)),
      csprclick: {
        off: vi.fn((name: CSPRClickEventName) => listeners.delete(name)),
        on: vi.fn((name: CSPRClickEventName, handler: (event?: CSPRClickAccountEvent) => void) => {
          listeners.set(name, handler);
        }),
        signInWithAccount,
      },
      removeEventListener: vi.fn((name: "csprclick:loaded") => loadedListeners.delete(name)),
    };

    const cleanup = bindCSPRClickAccountEvents(win, onChange);
    listeners.get("csprclick:signed_in")?.();
    listeners.get("csprclick:unsolicited_account_change")?.({ account: { public_key: "01ab" } });
    cleanup();

    expect(onChange).toHaveBeenCalledTimes(3);
    expect(signInWithAccount).toHaveBeenCalledWith({ public_key: "01ab" });
    expect(win.csprclick.off).toHaveBeenCalledWith("csprclick:signed_in", onChange);
    expect(win.removeEventListener).toHaveBeenCalledWith("csprclick:loaded", expect.any(Function));
  });

  it("refreshes state when CSPR.click loads after the first runtime check", () => {
    const loadedListeners = new Map<string, () => void>();
    const listeners = new Map<string, (event?: CSPRClickAccountEvent) => void>();
    const onChange = vi.fn();
    const win = {
      addEventListener: vi.fn((name: "csprclick:loaded", handler: () => void) => loadedListeners.set(name, handler)),
      csprclick: undefined as undefined | {
        off: (name: CSPRClickEventName) => void;
        on: (name: CSPRClickEventName, handler: (event?: CSPRClickAccountEvent) => void) => void;
      },
      removeEventListener: vi.fn((name: "csprclick:loaded") => loadedListeners.delete(name)),
    };

    const cleanup = bindCSPRClickAccountEvents(win, onChange);
    win.csprclick = {
      off: (name) => listeners.delete(name),
      on: (name, handler) => listeners.set(name, handler),
    };
    loadedListeners.get("csprclick:loaded")?.();
    cleanup();

    expect(onChange).toHaveBeenCalledOnce();
    expect(listeners.has("csprclick:signed_in")).toBe(false);
  });

  it("requests sign-in only when the client exposes signIn", () => {
    const signIn = vi.fn();

    expect(requestCSPRClickSignIn({ signIn })).toEqual({
      message: "CSPR.click sign-in requested",
      status: "requested",
    });
    expect(signIn).toHaveBeenCalledOnce();
    expect(requestCSPRClickSignIn(null)).toEqual({
      message: "CSPR.click sign-in is unavailable",
      status: "unavailable",
    });
  });
});
