"use client";

import { useEffect, useState } from "react";

import {
  getCSPRClickBrowserState,
  prepareCSPRClickRuntime,
  type CSPRClickBrowserWindow,
} from "@/lib/csprclick-browser";
import { bindCSPRClickAccountEvents, requestCSPRClickSignIn } from "@/lib/csprclick-browser-session";
import { getCSPRClickClientPublicConfig } from "@/lib/csprclick-client-config";
import {
  browserStateFromClient,
  browserStateFromRuntime,
  initialBrowserSigningState,
  type BrowserSigningState,
} from "./browser-signing-state";

export interface CSPRClickBrowserConnection {
  browserSigningState: BrowserSigningState;
  connectBrowserWallet: () => string;
}

export function useCSPRClickBrowserConnection(onMessage?: (message: string) => void): CSPRClickBrowserConnection {
  const [browserSigningState, setBrowserSigningState] = useState<BrowserSigningState>(initialBrowserSigningState);

  useEffect(() => {
    const browserWindow = window as unknown as CSPRClickBrowserWindow;
    const runtime = prepareCSPRClickRuntime(browserWindow, getCSPRClickClientPublicConfig());
    let disposed = false;

    async function refresh() {
      if (runtime.status === "not_enabled" || runtime.status === "error") {
        if (!disposed) setBrowserSigningState(browserStateFromRuntime(runtime.status));
        return;
      }
      const state = await getCSPRClickBrowserState(browserWindow);
      if (!disposed) setBrowserSigningState(browserStateFromClient(state));
    }

    const cleanup = bindCSPRClickAccountEvents(browserWindow, () => void refresh());
    const timer = window.setTimeout(() => void refresh(), 0);
    return () => {
      disposed = true;
      window.clearTimeout(timer);
      cleanup();
    };
  }, []);

  function connectBrowserWallet() {
    const result = requestCSPRClickSignIn((window as unknown as CSPRClickBrowserWindow).csprclick);
    onMessage?.(result.message);
    return result.message;
  }

  return { browserSigningState, connectBrowserWallet };
}
