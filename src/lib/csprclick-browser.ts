import type { CSPRClickSignTypedDataParams, CSPRClickSignTypedDataResult } from "./browser-x402-signing";
import type { ClickUIOptions } from "@make-software/csprclick-core-types/clickui";
import {
  clean,
  CSPRCLICK_SCRIPT_ID,
  CSPRCLICK_SCRIPT_SRC,
  type CSPRClickBrowserWindow,
  type CSPRClickClient,
  type CSPRClickPublicConfig,
} from "./csprclick-browser-config";
import {
  csprClickProviderInfo,
  csprClickProviderSupportsTypedData,
  normalizeCSPRClickSupports,
} from "./csprclick-provider-info";
import { getCSPRClickProviderCapabilities } from "./csprclick-provider-capabilities";

export type {
  CSPRClickAccount,
  CSPRClickAccountEvent,
  CSPRClickBrowserWindow,
  CSPRClickClient,
  CSPRClickEventName,
  CSPRClickProviderInfo,
  CSPRClickPublicConfig,
} from "./csprclick-browser-config";
export { CSPRCLICK_SCRIPT_ID, CSPRCLICK_SCRIPT_SRC, getCSPRClickPublicConfig } from "./csprclick-browser-config";

export function prepareCSPRClickRuntime(windowLike: CSPRClickBrowserWindow, config: CSPRClickPublicConfig) {
  if (config.status !== "configured") return { reason: config.reason, status: "not_enabled" as const };
  const documentLike = windowLike.document;
  if (!documentLike?.head) return { reason: "document_unavailable", status: "error" as const };

  const uiOptions: ClickUIOptions = {
    accountMenuItems: ["AccountCardMenuItem", "CopyHashMenuItem", "BuyCSPRMenuItem"],
    defaultTheme: "light",
    rootAppElement: config.ui.rootAppElement,
    show1ClickModal: true,
    showTopBar: true,
    uiContainer: config.ui.uiContainer,
  };
  windowLike.clickUIOptions = uiOptions;
  windowLike.clickSDKOptions = {
    appId: config.appId,
    appName: config.appName,
    chainName: config.chainName,
    contentMode: config.contentMode,
    providers: config.providers,
  };

  if (documentLike.getElementById(CSPRCLICK_SCRIPT_ID)) return runtimeStatus("script_present");
  const script = documentLike.createElement("script");
  script.id = CSPRCLICK_SCRIPT_ID;
  script.src = CSPRCLICK_SCRIPT_SRC;
  script.async = true;
  documentLike.head.appendChild(script);
  return runtimeStatus("script_appended");
}

export async function getCSPRClickBrowserState(
  windowLike: Pick<CSPRClickBrowserWindow, "csprclick">,
  providerKeys: string[] = [],
) {
  const client = windowLike.csprclick;
  if (!client) {
    return {
      clientAvailable: false,
      connected: false,
      providerCapabilities: [],
      signInAvailable: false,
      signTypedDataAvailable: false,
      status: "client_unavailable" as const,
    };
  }

  const activeAccount = await getActiveAccount(client);
  const activePublicKey = clean((await getActivePublicKey(client)) ?? activeAccount?.public_key);
  const provider = await getProviderInfo(client, activeAccount?.provider);
  const providerSupports = normalizeCSPRClickSupports(provider?.supports ?? activeAccount?.providerSupports);
  const providerSupportsTypedData = csprClickProviderSupportsTypedData(providerSupports);
  const providerInfo = csprClickProviderInfo({
    accountProvider: activeAccount?.provider,
    provider,
    supports: providerSupports,
  });
  const providerCapabilities = await getCSPRClickProviderCapabilities(client, providerKeys);

  if (!activePublicKey) {
    return {
      clientAvailable: true,
      connected: false,
      provider: providerInfo,
      providerCapabilities,
      providerSupportsTypedData,
      signInAvailable: Boolean(client.signIn),
      signTypedDataAvailable: Boolean(client.signTypedData),
      status: "client_available" as const,
    };
  }

  return {
    activePublicKey: activePublicKey.toLowerCase(),
    clientAvailable: true,
    connected: true,
    provider: providerInfo,
    providerCapabilities,
    providerSupportsTypedData,
    signInAvailable: Boolean(client.signIn),
    signTypedDataAvailable: Boolean(client.signTypedData),
    status: "connected" as const,
  };
}

export async function requestCSPRClickTypedDataSignature(
  client: CSPRClickClient | null | undefined,
  params: CSPRClickSignTypedDataParams,
  signingPublicKey: string | null | undefined,
): Promise<CSPRClickSignTypedDataResult> {
  const publicKey = clean(signingPublicKey)?.toLowerCase();
  if (!client?.signTypedData || !publicKey) return unavailableResult();
  try {
    return (await client.signTypedData(params, publicKey)) ?? {
      cancelled: false,
      digest: null,
      error: "CSPR.click signTypedData returned no result",
      errorCode: "CSPRCLICK_EMPTY_RESULT",
      publicKey: null,
      signatureHex: null,
    };
  } catch (error) {
    return rejectedResult(error);
  }
}

async function getActiveAccount(client: CSPRClickClient) {
  try {
    if (client.getActiveAccountAsync) return await client.getActiveAccountAsync();
    return client.getActiveAccount?.() ?? null;
  } catch {
    return client.getActiveAccount?.() ?? null;
  }
}

async function getActivePublicKey(client: CSPRClickClient) {
  try {
    return await client.getActivePublicKey?.();
  } catch {
    return undefined;
  }
}

async function getProviderInfo(client: CSPRClickClient, provider?: string) {
  try {
    return await client.getProviderInfo?.(provider);
  } catch {
    return undefined;
  }
}

function runtimeStatus(status: "script_appended" | "script_present") {
  return { scriptId: CSPRCLICK_SCRIPT_ID, scriptSrc: CSPRCLICK_SCRIPT_SRC, status };
}

function unavailableResult(): CSPRClickSignTypedDataResult {
  return {
    cancelled: false,
    digest: null,
    error: "CSPR.click signTypedData is unavailable",
    errorCode: "CSPRCLICK_UNAVAILABLE",
    publicKey: null,
    signatureHex: null,
  };
}

function rejectedResult(error: unknown): CSPRClickSignTypedDataResult {
  const message = errorMessage(error);
  const cancelled = /cancel|reject|denied|declined/i.test(message);
  return {
    cancelled,
    digest: null,
    error: message,
    errorCode: cancelled ? "CSPRCLICK_CANCELLED" : "CSPRCLICK_SIGN_TYPED_DATA_REJECTED",
    publicKey: null,
    signatureHex: null,
  };
}

function errorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) return error.message.trim();
  if (typeof error === "string" && error.trim()) return error.trim();
  return "CSPR.click signTypedData rejected";
}
