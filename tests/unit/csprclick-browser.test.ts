import { describe, expect, it, vi } from "vitest";

import { signParams, successfulSignature } from "./browser-x402-signing-fixtures";

import {
  CSPRCLICK_SCRIPT_ID,
  CSPRCLICK_SCRIPT_SRC,
  getCSPRClickBrowserState,
  getCSPRClickPublicConfig,
  prepareCSPRClickRuntime,
  requestCSPRClickTypedDataSignature,
  type CSPRClickBrowserWindow,
} from "@/lib/csprclick-browser";

describe("CSPR.click browser adapter boundary", () => {
  it("stays not enabled until a public app id is configured", () => {
    const config = getCSPRClickPublicConfig({
      CSPR_CLOUD_API_KEY: "secret-cspr-cloud-token",
      NEXT_PUBLIC_CSPR_CLICK_APP_NAME: "Casper GW",
    });

    expect(config).toMatchObject({ reason: "missing_app_id", status: "not_enabled" });
    expect(JSON.stringify(config)).not.toContain("secret-cspr-cloud-token");
  });

  it("builds public SDK/UI options from NEXT_PUBLIC values only", () => {
    const config = getCSPRClickPublicConfig({
      NEXT_PUBLIC_CASPER_CHAIN_NAME: "casper-test",
      NEXT_PUBLIC_CSPR_CLICK_APP_ID: "casper-gw-test",
      NEXT_PUBLIC_CSPR_CLICK_APP_NAME: "Casper GW",
      NEXT_PUBLIC_CSPR_CLICK_CONTENT_MODE: "iframe",
      NEXT_PUBLIC_CSPR_CLICK_PROVIDERS: "csprclick-w3a-google, unknown, csprclick-w3a-apple, casper-wallet",
      SECRET_PROVIDER_KEY: "do-not-include",
    });

    expect(config).toMatchObject({
      appId: "casper-gw-test",
      appName: "Casper GW",
      chainName: "casper-test",
      contentMode: "iframe",
      providers: ["csprclick-w3a-google", "csprclick-w3a-apple", "casper-wallet"],
      status: "configured",
    });
    expect(JSON.stringify(config)).not.toContain("do-not-include");
  });

  it("installs CSPR.click runtime options and appends the CDN script once", () => {
    const win = browserWindowDouble();
    const config = getCSPRClickPublicConfig({ NEXT_PUBLIC_CSPR_CLICK_APP_ID: "casper-gw-test" });

    const first = prepareCSPRClickRuntime(win, config);
    const second = prepareCSPRClickRuntime(win, config);

    expect(first).toEqual({ scriptId: CSPRCLICK_SCRIPT_ID, scriptSrc: CSPRCLICK_SCRIPT_SRC, status: "script_appended" });
    expect(second).toEqual({ scriptId: CSPRCLICK_SCRIPT_ID, scriptSrc: CSPRCLICK_SCRIPT_SRC, status: "script_present" });
    expect(win.appendedScripts).toHaveLength(1);
    expect(win.clickSDKOptions).toMatchObject({
      appId: "casper-gw-test",
      contentMode: "iframe",
      providers: ["csprclick-w3a-google", "csprclick-w3a-apple", "casper-wallet", "ledger", "metamask-snap"],
    });
    expect(win.clickUIOptions).toMatchObject({
      rootAppElement: "#app",
      show1ClickModal: true,
      showTopBar: true,
      uiContainer: "csprclick-ui",
    });
  });

  it("prefers the current async active-account API when reading connection state", async () => {
    const getActiveAccount = vi.fn(() => ({ public_key: "01old" }));
    const getActiveAccountAsync = vi.fn().mockResolvedValue({ public_key: "01async" });

    await expect(
      getCSPRClickBrowserState({
        csprclick: {
          getActiveAccount,
          getActiveAccountAsync,
          signIn: vi.fn(),
        },
      }),
    ).resolves.toMatchObject({
      activePublicKey: "01async",
      connected: true,
      status: "connected",
    });
    expect(getActiveAccountAsync).toHaveBeenCalledOnce();
    expect(getActiveAccount).not.toHaveBeenCalled();
  });

  it("does not revive stale sync account state when the async active-account API returns null", async () => {
    await expect(
      getCSPRClickBrowserState({
        csprclick: {
          getActiveAccount: vi.fn(() => ({ public_key: "01stale" })),
          getActiveAccountAsync: vi.fn().mockResolvedValue(null),
          signIn: vi.fn(),
        },
      }),
    ).resolves.toEqual({
      clientAvailable: true,
      connected: false,
      signInAvailable: true,
      status: "client_available",
    });
  });

  it("reports browser state without treating client presence as enabled signing", async () => {
    await expect(getCSPRClickBrowserState({})).resolves.toEqual({
      clientAvailable: false,
      connected: false,
      signInAvailable: false,
      status: "client_unavailable",
    });

    await expect(
      getCSPRClickBrowserState({
        csprclick: {
          getActiveAccount: () => ({ public_key: "01ab" }),
          getActivePublicKey: async () => "01ab",
          signIn: vi.fn(),
        },
      }),
    ).resolves.toEqual({
      activePublicKey: "01ab",
      clientAvailable: true,
      connected: true,
      signInAvailable: true,
      status: "connected",
    });
  });

  it("delegates signTypedData to CSPR.click and normalizes unavailable clients as errors", async () => {
    const signTypedData = vi.fn().mockResolvedValue(successfulSignature);

    await expect(
      requestCSPRClickTypedDataSignature(
        { signTypedData },
        signParams,
        successfulSignature.publicKey,
      ),
    ).resolves.toEqual(successfulSignature);
    expect(signTypedData).toHaveBeenCalledWith(signParams, successfulSignature.publicKey.toLowerCase());

    await expect(requestCSPRClickTypedDataSignature(null, signParams, successfulSignature.publicKey)).resolves.toMatchObject({
      cancelled: false,
      error: "CSPR.click signTypedData is unavailable",
      errorCode: "CSPRCLICK_UNAVAILABLE",
    });
  });

  it("normalizes rejected signTypedData calls instead of throwing", async () => {
    await expect(
      requestCSPRClickTypedDataSignature(
        { signTypedData: vi.fn().mockRejectedValue(new Error("User rejected signing request")) },
        signParams,
        successfulSignature.publicKey,
      ),
    ).resolves.toMatchObject({
      cancelled: true,
      error: "User rejected signing request",
      errorCode: "CSPRCLICK_CANCELLED",
    });

    await expect(
      requestCSPRClickTypedDataSignature(
        { signTypedData: vi.fn().mockRejectedValue(new Error("Provider disconnected")) },
        signParams,
        successfulSignature.publicKey,
      ),
    ).resolves.toMatchObject({
      cancelled: false,
      error: "Provider disconnected",
      errorCode: "CSPRCLICK_SIGN_TYPED_DATA_REJECTED",
    });
  });
});

function browserWindowDouble() {
  type ScriptDouble = { async?: boolean; id: string; src?: string; tagName?: string };
  const elements = new Map<string, ScriptDouble>();
  const appendedScripts: ScriptDouble[] = [];
  const win: CSPRClickBrowserWindow & { appendedScripts: ScriptDouble[] } = {
    appendedScripts,
    document: {
      createElement: (tagName: string) => ({ id: "", tagName: tagName.toUpperCase() }),
      getElementById: (id: string) => elements.get(id) ?? null,
      head: {
        appendChild: (element: ScriptDouble) => {
          elements.set(element.id, element);
          appendedScripts.push(element);
          return element;
        },
      },
    },
  };
  return win;
}
