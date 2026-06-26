import type {
  AccountType,
  CsprClickInitOptions,
  ProviderInfo,
  SignTypedDataParams,
  SignTypedDataResult,
} from "@make-software/csprclick-core-types";
import type { ClickUIOptions } from "@make-software/csprclick-core-types/clickui";

import type { CSPRClickSignTypedDataResult } from "./browser-x402-signing";

export const CSPRCLICK_SCRIPT_ID = "csprclick-client";
export const CSPRCLICK_SCRIPT_SRC = "https://cdn.cspr.click/ui/v2.1.0/csprclick-client-2.1.0.js";

// Casper Connect wallets only. Google/Apple social login removed per Abu's
// product decision (2026-06-26): the connect modal offers Casper wallets, not social login.
const EXTENSION_PROVIDERS = ["casper-wallet", "ledger", "metamask-snap"];
const DEFAULT_PROVIDERS = [...EXTENSION_PROVIDERS];
const ALLOWED_PROVIDERS = new Set(DEFAULT_PROVIDERS);

export type CSPRClickPublicConfig =
  | {
      reason: "missing_app_id";
      sdk: { scriptId: string; scriptSrc: string };
      status: "not_enabled";
    }
  | {
      appId: string;
      appName: string;
      chainName: string;
      contentMode: "iframe" | "popup";
      providers: string[];
      sdk: { scriptId: string; scriptSrc: string };
      status: "configured";
      ui: { rootAppElement: string; uiContainer: string };
    };

export type CSPRClickAccount = Partial<Pick<AccountType, "provider" | "providerSupports" | "public_key">>;
export type CSPRClickProviderInfo = Partial<Pick<ProviderInfo, "key" | "name" | "supports" | "version">>;

export type CSPRClickClient = {
  getActiveAccount?: () => CSPRClickAccount | null;
  getActiveAccountAsync?: () => Promise<CSPRClickAccount | null>;
  getActivePublicKey?: () => Promise<string | undefined> | string | undefined;
  getProviderInfo?: (provider?: string) => Promise<CSPRClickProviderInfo | undefined>;
  off?: (eventName: CSPRClickEventName, handler: (event?: CSPRClickAccountEvent) => void) => void;
  on?: (eventName: CSPRClickEventName, handler: (event?: CSPRClickAccountEvent) => void) => void;
  signIn?: () => void;
  signInWithAccount?: (account: CSPRClickAccount) => unknown;
  signTypedData?: (
    params: SignTypedDataParams,
    signingPublicKey: string,
  ) => Promise<CSPRClickSignTypedDataResult | SignTypedDataResult | undefined>;
  switchAccount?: (withProvider?: string, options?: unknown) => Promise<void>;
};

export type CSPRClickEventName =
  | "csprclick:disconnected"
  | "csprclick:signed_in"
  | "csprclick:signed_out"
  | "csprclick:switched_account"
  | "csprclick:unsolicited_account_change";

export type CSPRClickAccountEvent = { account?: CSPRClickAccount };

export type CSPRClickBrowserWindow = {
  addEventListener?: (eventName: "csprclick:loaded", handler: () => void) => void;
  clickSDKOptions?: CsprClickInitOptions;
  clickUIOptions?: ClickUIOptions;
  csprclick?: CSPRClickClient;
  document?: {
    createElement: (tagName: "script") => { async?: boolean; id: string; src?: string; tagName?: string };
    getElementById: (id: string) => unknown;
    head?: { appendChild: (element: { async?: boolean; id: string; src?: string }) => unknown };
  };
  removeEventListener?: (eventName: "csprclick:loaded", handler: () => void) => void;
};

export function getCSPRClickPublicConfig(
  env: Record<string, string | undefined> = process.env,
): CSPRClickPublicConfig {
  const appId = clean(env.NEXT_PUBLIC_CSPR_CLICK_APP_ID);
  const sdk = { scriptId: CSPRCLICK_SCRIPT_ID, scriptSrc: CSPRCLICK_SCRIPT_SRC };
  if (!appId) return { reason: "missing_app_id", sdk, status: "not_enabled" };

  return {
    appId,
    appName: clean(env.NEXT_PUBLIC_CSPR_CLICK_APP_NAME) || "Casper GW",
    chainName: clean(env.NEXT_PUBLIC_CASPER_CHAIN_NAME) || "casper-test",
    contentMode: contentMode(env.NEXT_PUBLIC_CSPR_CLICK_CONTENT_MODE),
    providers: providers(env.NEXT_PUBLIC_CSPR_CLICK_PROVIDERS),
    sdk,
    status: "configured",
    ui: {
      rootAppElement: clean(env.NEXT_PUBLIC_CSPR_CLICK_ROOT_ELEMENT) || "#app",
      uiContainer: clean(env.NEXT_PUBLIC_CSPR_CLICK_UI_CONTAINER) || "csprclick-ui",
    },
  };
}

export function clean(value: string | null | undefined) {
  const text = value?.trim();
  return text || undefined;
}

function providers(value: string | undefined) {
  const parsed = clean(value)
    ?.split(",")
    .map((item) => item.trim())
    .filter((item) => ALLOWED_PROVIDERS.has(item));
  return parsed?.length ? parsed : DEFAULT_PROVIDERS;
}

function contentMode(value: string | undefined): "iframe" | "popup" {
  return value === "popup" ? "popup" : "iframe";
}
