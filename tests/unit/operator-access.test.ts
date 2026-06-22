import { afterEach, describe, expect, it } from "vitest";

import { requireHttpSigningEnabled, requireOperatorRequest } from "@/server/operator-access";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("operator access guard", () => {
  it("requires an operator token before route execution", () => {
    delete process.env.CASPER_GW_OPERATOR_TOKEN;

    expect(() => requireOperatorRequest(new Request("https://example.test"))).toThrow(
      "CASPER_GW_OPERATOR_TOKEN is required",
    );
  });

  it("rejects a request without the matching operator header", () => {
    process.env.CASPER_GW_OPERATOR_TOKEN = "operator-token";

    expect(() => requireOperatorRequest(new Request("https://example.test"))).toThrow(
      "operator access required",
    );
  });

  it("accepts the matching operator header", () => {
    process.env.CASPER_GW_OPERATOR_TOKEN = "operator-token";
    const request = new Request("https://example.test", {
      headers: { "x-casper-gw-operator-token": "operator-token" },
    });

    expect(() => requireOperatorRequest(request)).not.toThrow();
  });

  it("keeps HTTP signing disabled unless explicitly enabled", () => {
    process.env.CASPER_GW_HTTP_SIGNING_ENABLED = "false";
    expect(() => requireHttpSigningEnabled()).toThrow("HTTP signing endpoint is disabled");

    process.env.CASPER_GW_HTTP_SIGNING_ENABLED = "true";
    expect(() => requireHttpSigningEnabled()).not.toThrow();
  });
});
