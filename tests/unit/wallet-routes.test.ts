import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { publicKey } from "./browser-x402-signing-fixtures";

const mocks = vi.hoisted(() => ({
  createAgentWallet: vi.fn(),
  getAgentWalletRecord: vi.fn(),
  getWalletReadiness: vi.fn(),
  listAgentWallets: vi.fn(),
}));

vi.mock("@/server/wallet-store", () => ({
  createAgentWallet: mocks.createAgentWallet,
  getAgentWalletRecord: mocks.getAgentWalletRecord,
  listAgentWallets: mocks.listAgentWallets,
}));

vi.mock("@/server/wallet-readiness", () => ({
  getWalletReadiness: mocks.getWalletReadiness,
}));

const originalEnv = { ...process.env };
const accountHash = "9accddf69417e3a70e0250e99833dbc7236be6299da01034133d0d2bca01481d";

beforeEach(() => {
  vi.clearAllMocks();
  process.env.CASPER_GW_OPERATOR_TOKEN = "operator-token";
  process.env.CSPR_CLOUD_API_KEY = "token";
});

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("wallet profile routes", () => {
  it("requires operator access before listing wallets", async () => {
    const { GET } = await import("@/app/api/wallets/route");

    const response = await GET(request("https://gw.test/api/wallets"));

    expect(response.status).toBe(403);
    expect(mocks.listAgentWallets).not.toHaveBeenCalled();
  });

  it("creates wallet profiles with server network defaults", async () => {
    const { POST } = await import("@/app/api/wallets/route");
    mocks.createAgentWallet.mockResolvedValue({ accountHash, id: "wallet-1", signingMode: "external" });

    const response = await POST(
      request("https://gw.test/api/wallets", {
        body: { accountHash, label: "Judge Wallet", publicKey, signingMode: "external" },
        token: "operator-token",
      }),
    );

    expect(response.status).toBe(201);
    expect(mocks.createAgentWallet).toHaveBeenCalledWith({
      accountHash,
      label: "Judge Wallet",
      network: "casper:casper-test",
      publicKey,
      signingMode: "external",
    });
  });

  it("rejects wallet network overrides in Phase 2", async () => {
    const { POST } = await import("@/app/api/wallets/route");

    const response = await POST(
      request("https://gw.test/api/wallets", {
        body: {
          accountHash,
          label: "Judge Wallet",
          network: "casper:casper-main",
          signingMode: "external",
        },
        token: "operator-token",
      }),
    );

    expect(response.status).toBe(400);
    expect(mocks.createAgentWallet).not.toHaveBeenCalled();
  });
});

describe("wallet readiness route", () => {
  it("resolves persisted wallet ids before querying CSPR.cloud readiness", async () => {
    const { GET } = await import("@/app/api/wallets/[id]/readiness/route");
    mocks.getAgentWalletRecord.mockResolvedValue({
      accountHash,
      id: "wallet-1",
      label: "Judge Wallet",
      signingMode: "external",
    });
    mocks.getWalletReadiness.mockResolvedValue({
      accountHash,
      assetBalance: "7500000000",
      gasBalance: "1000000000",
      network: "casper:casper-test",
      paymentAsset: "3d80df21ba4ee4d66a2a1f60c32570dd5685e4b279f6538162a5fd1314847c1e",
      ready: true,
      reason: "gas and payment asset detected",
    });

    const response = await GET(request("https://gw.test/api/wallets/wallet-1/readiness", { token: "operator-token" }), {
      params: Promise.resolve({ id: "wallet-1" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mocks.getWalletReadiness).toHaveBeenCalledWith(expect.any(Object), accountHash);
    expect(body.wallet).toEqual({ id: "wallet-1", label: "Judge Wallet", signingMode: "external" });
    expect(body.ready).toBe(true);
  });

  it("fails closed when CSPR.cloud API key is missing", async () => {
    const { GET } = await import("@/app/api/wallets/[id]/readiness/route");
    delete process.env.CSPR_CLOUD_API_KEY;

    const response = await GET(request("https://gw.test/api/wallets/wallet-1/readiness", { token: "operator-token" }), {
      params: Promise.resolve({ id: "wallet-1" }),
    });

    expect(response.status).toBe(503);
    expect(mocks.getWalletReadiness).not.toHaveBeenCalled();
  });
});

function request(url: string, init: { body?: unknown; token?: string } = {}) {
  const headers = new Headers();
  if (init.token) headers.set("x-casper-gw-operator-token", init.token);
  if (init.body) headers.set("content-type", "application/json");

  return new NextRequest(url, {
    body: init.body ? JSON.stringify(init.body) : undefined,
    headers,
    method: init.body ? "POST" : "GET",
  });
}
