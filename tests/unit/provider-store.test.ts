import { describe, expect, it } from "vitest";

import {
  normalizeDiscoveredTool,
  normalizeProviderSourceInput,
  normalizeToolPriceInput,
  toProviderSourceView,
} from "@/server/provider-model";

describe("provider store helpers", () => {
  it("normalizes remote MCP sources and keeps credential references server-side", () => {
    const source = normalizeProviderSourceInput({
      authMode: "bearer",
      credentialRef: "vault:providers/cspr-trade",
      endpointUrl: "https://mcp.cspr.trade/mcp",
      name: " CSPR Trade ",
      sourceType: "mcp",
    });

    expect(source).toMatchObject({
      authMode: "bearer",
      credentialRef: "vault:providers/cspr-trade",
      endpointUrl: "https://mcp.cspr.trade/mcp",
      name: "CSPR Trade",
      sourceType: "mcp",
    });

    const view = toProviderSourceView({
      ...source,
      credentialRef: source.credentialRef ?? null,
      createdAt: new Date(),
      id: "source-1",
      updatedAt: new Date(),
    });

    expect(view).toEqual({
      authMode: "bearer",
      credentialConfigured: true,
      endpointUrl: "https://mcp.cspr.trade/mcp",
      id: "source-1",
      name: "CSPR Trade",
      sourceType: "mcp",
    });
    expect(view).not.toHaveProperty("credentialRef");
  });

  it("rejects raw upstream secrets in provider source input", () => {
    expect(() =>
      normalizeProviderSourceInput({
        authMode: "bearer",
        credentialRef: "Bearer raw-token",
        endpointUrl: "https://mcp.cspr.trade/mcp",
        name: "CSPR Trade",
        sourceType: "mcp",
      }),
    ).toThrow("credentialRef must reference server-side credential storage");
  });

  it("rejects credentialed or non-HTTPS provider URLs for remote sources", () => {
    expect(() =>
      normalizeProviderSourceInput({
        endpointUrl: "http://mcp.cspr.trade/mcp",
        name: "CSPR Trade",
        sourceType: "mcp",
      }),
    ).toThrow("provider endpoint must use HTTPS");

    expect(() =>
      normalizeProviderSourceInput({
        endpointUrl: "https://token@mcp.cspr.trade/mcp",
        name: "CSPR Trade",
        sourceType: "mcp",
      }),
    ).toThrow("provider endpoint must not contain credentials");
  });

  it("normalizes discovered MCP tools into draft provider tools", () => {
    expect(
      normalizeDiscoveredTool("source-1", "https://mcp.cspr.trade/mcp", {
        description: "Get a swap quote.",
        inputSchema: { type: "object", properties: { amount: { type: "string" } } },
        name: "get_quote",
      }),
    ).toEqual({
      description: "Get a swap quote.",
      inputSchema: { type: "object", properties: { amount: { type: "string" } } },
      outputSchema: undefined,
      sourceId: "source-1",
      status: "draft",
      upstreamTarget: "https://mcp.cspr.trade/mcp#get_quote",
      name: "get_quote",
    });
  });

  it("validates Casper x402 tool pricing input", () => {
    expect(
      normalizeToolPriceInput({
        amount: "7500000000",
        asset: "3d80df21ba4ee4d66a2a1f60c32570dd5685e4b279f6538162a5fd1314847c1e",
        network: "casper:casper-test",
        payTo: "009accddf69417e3a70e0250e99833dbc7236be6299da01034133d0d2bca01481d",
        toolId: "tool-1",
      }),
    ).toMatchObject({
      amount: "7500000000",
      maxTimeoutSeconds: 900,
      network: "casper:casper-test",
      scheme: "exact",
      toolId: "tool-1",
    });

    expect(() =>
      normalizeToolPriceInput({
        amount: "0",
        asset: "asset",
        network: "casper:casper-test",
        payTo: "payee",
        toolId: "tool-1",
      }),
    ).toThrow("amount must be a positive integer string");
  });
});
