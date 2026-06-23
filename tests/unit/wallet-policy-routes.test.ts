import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createSpendPolicy: vi.fn(),
  getAgentWalletRecord: vi.fn(),
  getLatestSpendPolicyForWalletId: vi.fn(),
}));

vi.mock("@/server/spend-policy-store", () => ({
  createSpendPolicy: mocks.createSpendPolicy,
  getLatestSpendPolicyForWalletId: mocks.getLatestSpendPolicyForWalletId,
}));

vi.mock("@/server/wallet-store", () => ({
  getAgentWalletRecord: mocks.getAgentWalletRecord,
}));

const originalEnv = { ...process.env };
const accountHash = "9accddf69417e3a70e0250e99833dbc7236be6299da01034133d0d2bca01481d";
const paymentAsset = "3d80df21ba4ee4d66a2a1f60c32570dd5685e4b279f6538162a5fd1314847c1e";

beforeEach(() => {
  vi.clearAllMocks();
  process.env.CASPER_GW_OPERATOR_TOKEN = "operator-token";
  process.env.CASPER_NETWORK = "casper:casper-test";
  process.env.CASPER_PAYMENT_ASSET_PACKAGE = paymentAsset;
  mocks.getAgentWalletRecord.mockResolvedValue({
    accountHash,
    id: "wallet-1",
    label: "Judge Wallet",
    signingMode: "test-signer",
  });
});

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("wallet policy route", () => {
  it("requires operator access before reading policy", async () => {
    const { GET } = await import("@/app/api/wallets/[id]/policy/route");

    const response = await GET(request("https://gw.test/api/wallets/wallet-1/policy"), {
      params: Promise.resolve({ id: "wallet-1" }),
    });

    expect(response.status).toBe(403);
    expect(mocks.getLatestSpendPolicyForWalletId).not.toHaveBeenCalled();
  });

  it("returns the latest persisted policy for a wallet profile", async () => {
    const { GET } = await import("@/app/api/wallets/[id]/policy/route");
    mocks.getLatestSpendPolicyForWalletId.mockResolvedValue({ id: "policy-1", maxPerCall: "50" });

    const response = await GET(request("https://gw.test/api/wallets/wallet-1/policy", { token: "operator-token" }), {
      params: Promise.resolve({ id: "wallet-1" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mocks.getLatestSpendPolicyForWalletId).toHaveBeenCalledWith("wallet-1");
    expect(body.policy).toEqual({ id: "policy-1", maxPerCall: "50" });
    expect(body.wallet).toEqual({
      accountHash,
      id: "wallet-1",
      label: "Judge Wallet",
      signingMode: "test-signer",
    });
  });

  it("creates policy with server-owned Casper payment scope", async () => {
    const { POST } = await import("@/app/api/wallets/[id]/policy/route");
    mocks.createSpendPolicy.mockResolvedValue({ id: "policy-1", maxPerCall: "50" });

    const response = await POST(
      request("https://gw.test/api/wallets/wallet-1/policy", {
        body: {
          allowedTools: ["get_quote"],
          dailyLimit: "100",
          disabled: false,
          maxPerCall: "50",
          sessionLimit: "80",
        },
        token: "operator-token",
      }),
      { params: Promise.resolve({ id: "wallet-1" }) },
    );

    expect(response.status).toBe(201);
    expect(mocks.createSpendPolicy).toHaveBeenCalledWith({
      allowedAsset: paymentAsset,
      allowedNetwork: "casper:casper-test",
      allowedTools: ["get_quote"],
      dailyLimit: "100",
      disabled: false,
      maxPerCall: "50",
      sessionLimit: "80",
      walletId: "wallet-1",
    });
  });

  it("rejects client-supplied network or asset overrides", async () => {
    const { POST } = await import("@/app/api/wallets/[id]/policy/route");

    const response = await POST(
      request("https://gw.test/api/wallets/wallet-1/policy", {
        body: {
          allowedAsset: "wrong-asset",
          allowedNetwork: "casper:casper-test",
          allowedTools: ["get_quote"],
          maxPerCall: "50",
        },
        token: "operator-token",
      }),
      { params: Promise.resolve({ id: "wallet-1" }) },
    );

    expect(response.status).toBe(400);
    expect(mocks.createSpendPolicy).not.toHaveBeenCalled();
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
