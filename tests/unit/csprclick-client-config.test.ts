import { afterEach, describe, expect, it } from "vitest";

import { getCSPRClickClientPublicConfig } from "@/lib/csprclick-client-config";

describe("CSPR.click client public config", () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_CASPER_CHAIN_NAME;
    delete process.env.NEXT_PUBLIC_CSPR_CLICK_APP_ID;
    delete process.env.NEXT_PUBLIC_CSPR_CLICK_APP_NAME;
    delete process.env.NEXT_PUBLIC_CSPR_CLICK_CONTENT_MODE;
    delete process.env.NEXT_PUBLIC_CSPR_CLICK_PROVIDERS;
  });

  it("passes explicit NEXT_PUBLIC keys into browser config parsing", () => {
    process.env.NEXT_PUBLIC_CASPER_CHAIN_NAME = "casper-test";
    process.env.NEXT_PUBLIC_CSPR_CLICK_APP_ID = "csprclick-template";
    process.env.NEXT_PUBLIC_CSPR_CLICK_APP_NAME = "Casper GW";
    process.env.NEXT_PUBLIC_CSPR_CLICK_CONTENT_MODE = "iframe";
    process.env.NEXT_PUBLIC_CSPR_CLICK_PROVIDERS = "csprclick-w3a-google,csprclick-w3a-apple,casper-wallet";

    expect(getCSPRClickClientPublicConfig()).toMatchObject({
      appId: "csprclick-template",
      appName: "Casper GW",
      chainName: "casper-test",
      contentMode: "iframe",
      // Google/Apple social-login providers are filtered out (removed by product decision).
      providers: ["casper-wallet"],
      status: "configured",
    });
  });
});
