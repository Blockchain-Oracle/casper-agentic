import { describe, expect, it, vi } from "vitest";

import { signParams, successfulSignature } from "./browser-x402-signing-fixtures";

import {
  CSPRCLICK_SCRIPT_ID,
  CSPRCLICK_SCRIPT_SRC,
  getCSPRClickBrowserState,
  getCSPRClickPublicConfig,
  prepareCSPRClickRuntime,
  requestCSPRClickTypedDataSignature,
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
      NEXT_PUBLIC_CSPR_CLICK_CONTENT_MODE: "popup",
      NEXT_PUBLIC_CSPR_CLICK_PROVIDERS: "casper-wallet, unknown, ledger",
      SECRET_PROVIDER_KEY: "do-not-include",
    });

    expect(config).toMatchObject({
      appId: "casper-gw-test",
      appName: "Casper GW",
      chainName: "casper-test",
      contentMode: "popup",
      providers: ["casper-wallet", "ledger"],
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
    expect(win.clickSDKOptions).toMatchObject({ appId: "casper-gw-test", contentMode: "iframe" });
    expect(win.clickUIOptions).toMatchObject({ rootAppElement: "#root", uiContainer: "csprclick-ui" });
  });

  it("reports browser state without treating client presence as enabled signing", async () => {
    await expect(getCSPRClickBrowserState({})).resolves.toEqual({
      clientAvailable: false,
      connected: false,
      status: "client_unavailable",
    });

    await expect(
      getCSPRClickBrowserState({
        csprclick: {
          getActiveAccount: () => ({ public_key: "01ab" }),
          getActivePublicKey: async () => "01ab",
        },
      }),
    ).resolves.toEqual({
      activePublicKey: "01ab",
      clientAvailable: true,
      connected: true,
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
  const win = {
    appendedScripts,
    clickSDKOptions: undefined as unknown,
    clickUIOptions: undefined as unknown,
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
