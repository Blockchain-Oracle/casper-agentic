"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  getCSPRClickPublicConfig,
  prepareCSPRClickRuntime,
  type CSPRClickAccountEvent,
  type CSPRClickBrowserWindow,
  type CSPRClickClient,
  type CSPRClickEventName,
  type CSPRClickPublicConfig,
} from "@/lib/csprclick-browser";

type CsprClickContextValue = {
  /** lowercased active public key, or undefined when disconnected */
  publicKey: string | undefined;
  /** true once the CDN runtime has fired `csprclick:loaded` */
  ready: boolean;
  /** true while no appId is configured (CSPR.click disabled) */
  disabled: boolean;
  connect: () => void;
  disconnect: () => void;
};

const CsprClickContext = createContext<CsprClickContextValue | null>(null);

// Account events that should re-read the active account. Registered inside the
// `csprclick:loaded` handler — never call SDK methods before that fires.
const ACCOUNT_EVENTS: CSPRClickEventName[] = [
  "csprclick:account_changed",
  "csprclick:signed_in",
  "csprclick:switched_account",
];
const CLEAR_EVENTS: CSPRClickEventName[] = ["csprclick:signed_out", "csprclick:disconnected"];

function readPublicKey(event?: CSPRClickAccountEvent) {
  const account = event?.account ?? event?.detail;
  return account?.public_key?.toLowerCase();
}

export function CsprClickProvider({ children }: { children: React.ReactNode }) {
  const [publicKey, setPublicKey] = useState<string | undefined>();
  const [ready, setReady] = useState(false);
  const clientRef = useRef<CSPRClickClient | null>(null);
  const config = useMemo<CSPRClickPublicConfig>(() => getCSPRClickPublicConfig(), []);
  const disabled = config.status !== "configured";

  // Re-read the active account directly from the SDK (the authoritative read).
  const refreshActiveAccount = useCallback(async (client: CSPRClickClient) => {
    try {
      const account = client.getActiveAccountAsync
        ? await client.getActiveAccountAsync()
        : (client.getActiveAccount?.() ?? null);
      setPublicKey(account?.public_key?.toLowerCase() || undefined);
    } catch {
      // signed-out / not-connected is not a fatal error — treat as disconnected.
      setPublicKey(undefined);
    }
  }, []);

  useEffect(() => {
    if (disabled || typeof window === "undefined") return;
    let mounted = true;
    const win = window as unknown as CSPRClickBrowserWindow & Window;

    // Account-event handler (fires after the modal latches a session).
    const onAccount = (event?: CSPRClickAccountEvent) => {
      const fromEvent = readPublicKey(event);
      if (fromEvent) {
        setPublicKey(fromEvent);
      } else if (clientRef.current) {
        void refreshActiveAccount(clientRef.current);
      }
    };
    const onCleared = () => setPublicKey(undefined);
    const onUnsolicitedAccountChange = (event?: CSPRClickAccountEvent) => {
      const account = event?.account ?? event?.detail;
      if (account) void clientRef.current?.signInWithAccount?.(account);
      onAccount(event);
    };
    let chromeObserver: MutationObserver | null = null;
    const suppressInjectedChrome = () => {
      const root = document.getElementById(config.ui.uiContainer);
      root?.querySelectorAll(".csprclick-top-bar").forEach((node) => {
        const element = node as HTMLElement;
        const container = element.closest('[class*="SettingsContainer"]') as HTMLElement | null;
        const chrome = container ?? element;
        element.style.setProperty("display", "none", "important");
        element.style.setProperty("height", "0", "important");
        element.style.setProperty("overflow", "hidden", "important");
        chrome.style.setProperty("display", "none", "important");
        chrome.style.setProperty("height", "0", "important");
        chrome.style.setProperty("overflow", "hidden", "important");
      });
    };

    const onLoaded = () => {
      const client = win.csprclick;
      if (!client || !mounted) return;
      clientRef.current = client;
      setReady(true);
      if (client.appSettings) client.appSettings.badge_left = null;
      suppressInjectedChrome();
      window.setTimeout(suppressInjectedChrome, 0);
      window.setTimeout(suppressInjectedChrome, 250);
      const root = document.getElementById(config.ui.uiContainer);
      if (root && !chromeObserver) {
        chromeObserver = new MutationObserver(suppressInjectedChrome);
        chromeObserver.observe(root, { childList: true, subtree: true });
      }
      ACCOUNT_EVENTS.forEach((name) => client.off?.(name, onAccount));
      CLEAR_EVENTS.forEach((name) => client.off?.(name, onCleared));
      client.off?.("csprclick:unsolicited_account_change", onUnsolicitedAccountChange);
      ACCOUNT_EVENTS.forEach((name) => client.on?.(name, onAccount));
      CLEAR_EVENTS.forEach((name) => client.on?.(name, onCleared));
      client.on?.("csprclick:unsolicited_account_change", onUnsolicitedAccountChange);
      // Re-hydrate an already-connected session on refresh.
      void refreshActiveAccount(client);
    };

    win.addEventListener?.("csprclick:loaded", onLoaded);

    // Idempotent: prepareCSPRClickRuntime dedupes the script by id.
    prepareCSPRClickRuntime(win, config);
    // If the script already loaded before we attached the listener, catch up.
    if (win.csprclick) onLoaded();

    return () => {
      mounted = false;
      win.removeEventListener?.("csprclick:loaded", onLoaded);
      const client = clientRef.current;
      chromeObserver?.disconnect();
      ACCOUNT_EVENTS.forEach((name) => client?.off?.(name, onAccount));
      CLEAR_EVENTS.forEach((name) => client?.off?.(name, onCleared));
      client?.off?.("csprclick:unsolicited_account_change", onUnsolicitedAccountChange);
    };
  }, [config, disabled, refreshActiveAccount]);

  const connect = useCallback(() => {
    clientRef.current?.signIn?.();
  }, []);

  // Identity-only: clearing state + switchAccount(undefined) returns to the
  // wallet-select modal; there is no protocol "disconnect" we hold here.
  const disconnect = useCallback(() => {
    const client = clientRef.current;
    setPublicKey(undefined);
    if (client?.signOut) {
      void client.signOut();
      return;
    }
    void client?.disconnect?.();
  }, []);

  const value = useMemo<CsprClickContextValue>(
    () => ({ connect, disconnect, disabled, publicKey, ready }),
    [connect, disconnect, disabled, publicKey, ready],
  );

  return <CsprClickContext.Provider value={value}>{children}</CsprClickContext.Provider>;
}

export function useCsprClick() {
  const ctx = useContext(CsprClickContext);
  if (!ctx) throw new Error("useCsprClick must be used within <CsprClickProvider>");
  return ctx;
}
