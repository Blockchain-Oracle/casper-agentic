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
export type CSPRClickSendResult = {
  cancelled?: boolean;
  csprCloudTransaction?: { timestamp?: string };
  error?: string;
  errorData?: unknown;
  status?: string;
  transactionHash?: string;
};

export type CSPRClickClient = {
  appSettings?: { badge_left?: unknown };
  disconnect?: () => Promise<void> | void;
  getActiveAccount?: () => CSPRClickAccount | null;
  getActiveAccountAsync?: () => Promise<CSPRClickAccount | null>;
  getActivePublicKey?: () => Promise<string | undefined> | string | undefined;
  getProviderInfo?: (provider?: string) => Promise<CSPRClickProviderInfo | undefined>;
  off?: (eventName: CSPRClickEventName, handler: (event?: CSPRClickAccountEvent) => void) => void;
  on?: (eventName: CSPRClickEventName, handler: (event?: CSPRClickAccountEvent) => void) => void;
  signIn?: () => void;
  signInWithAccount?: (account: CSPRClickAccount) => unknown;
  // Identity-only message signing for owner sign-in (not an x402 payment path).
  signMessage?: (
    message: string,
    signingPublicKey: string,
  ) => Promise<{ cancelled?: boolean; error?: string | null; signatureHex?: string | null } | undefined>;
  signOut?: () => Promise<void> | void;
  signTypedData?: (
    params: SignTypedDataParams,
    signingPublicKey: string,
  ) => Promise<CSPRClickSignTypedDataResult | SignTypedDataResult | undefined>;
  send?: (
    transactionJSON: string | object,
    signingPublicKey: string,
    onStatusUpdate?: (status: string, data: unknown) => void,
    timeout?: number,
  ) => Promise<CSPRClickSendResult | undefined>;
  switchAccount?: (withProvider?: string, options?: unknown) => Promise<void>;
};

export type CSPRClickEventName =
  | "csprclick:account_changed"
  | "csprclick:disconnected"
  | "csprclick:signed_in"
  | "csprclick:signed_out"
  | "csprclick:switched_account"
  | "csprclick:unsolicited_account_change";

// `signed_in` / `switched_account` carry `event.account`; `account_changed`
// carries the account on `event.detail` (matches the reference ClickContext).
export type CSPRClickAccountEvent = { account?: CSPRClickAccount; detail?: CSPRClickAccount };

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

// Next/Turbopack only inlines DIRECT `process.env.NEXT_PUBLIC_*` references into the
// client bundle — an aliased read (`const e = process.env; e.NEXT_PUBLIC_X`) becomes
// undefined on the client, silently falling back to defaults. So build the default env
// from direct member accesses; tests/server still pass an explicit env object.
function publicClickEnv(): Record<string, string | undefined> {
  return {
    NEXT_PUBLIC_CSPR_CLICK_APP_ID: process.env.NEXT_PUBLIC_CSPR_CLICK_APP_ID,
    NEXT_PUBLIC_CSPR_CLICK_APP_ID_TESTNET: process.env.NEXT_PUBLIC_CSPR_CLICK_APP_ID_TESTNET,
    NEXT_PUBLIC_CSPR_CLICK_APP_ID_MAINNET: process.env.NEXT_PUBLIC_CSPR_CLICK_APP_ID_MAINNET,
    NEXT_PUBLIC_CSPR_CLICK_APP_NAME: process.env.NEXT_PUBLIC_CSPR_CLICK_APP_NAME,
    NEXT_PUBLIC_CASPER_CHAIN_NAME: process.env.NEXT_PUBLIC_CASPER_CHAIN_NAME,
    NEXT_PUBLIC_CSPR_CLICK_CONTENT_MODE: process.env.NEXT_PUBLIC_CSPR_CLICK_CONTENT_MODE,
    NEXT_PUBLIC_CSPR_CLICK_PROVIDERS: process.env.NEXT_PUBLIC_CSPR_CLICK_PROVIDERS,
    NEXT_PUBLIC_CSPR_CLICK_ROOT_ELEMENT: process.env.NEXT_PUBLIC_CSPR_CLICK_ROOT_ELEMENT,
    NEXT_PUBLIC_CSPR_CLICK_UI_CONTAINER: process.env.NEXT_PUBLIC_CSPR_CLICK_UI_CONTAINER,
  };
}

// CSPR.click binds one app id to one network. Pick the app id that matches the
// deployment's chain so wallet-connect is always on the same network the gateway
// settles on (Approach A). Per-network ids win; then a single legacy app id; then
// the localhost demo template.
function appIdForChain(env: Record<string, string | undefined>, chainName: string): string {
  const perNetwork = chainName === "casper"
    ? clean(env.NEXT_PUBLIC_CSPR_CLICK_APP_ID_MAINNET)
    : clean(env.NEXT_PUBLIC_CSPR_CLICK_APP_ID_TESTNET);
  return perNetwork || clean(env.NEXT_PUBLIC_CSPR_CLICK_APP_ID) || "csprclick-template";
}

export function getCSPRClickPublicConfig(
  env: Record<string, string | undefined> = publicClickEnv(),
): CSPRClickPublicConfig {
  // The app id follows the deployment's chain (per-network id → single id → demo template),
  // so wallet-connect stays on the same network the gateway settles on.
  const chainName = clean(env.NEXT_PUBLIC_CASPER_CHAIN_NAME) || "casper-test";
  const appId = appIdForChain(env, chainName);
  const sdk = { scriptId: CSPRCLICK_SCRIPT_ID, scriptSrc: CSPRCLICK_SCRIPT_SRC };
  if (!appId) return { reason: "missing_app_id", sdk, status: "not_enabled" };

  return {
    appId,
    appName: clean(env.NEXT_PUBLIC_CSPR_CLICK_APP_NAME) || "Casper GW",
    chainName,
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
