import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({
  buildPaymentRequirements: vi.fn(),
  callMcpTool: vi.fn(),
  createCasperPaymentPayload: vi.fn(),
  discoverMcpTools: vi.fn(),
  getAccount: vi.fn(),
  getConfiguredSignerAddress: vi.fn(),
  getFTOwnerships: vi.fn(),
  getSourceByEndpoint: vi.fn(),
  getToolByName: vi.fn(),
  persistAttempt: vi.fn(),
  persistCasperProof: vi.fn(),
  persistX402Record: vi.fn(),
  resolveCasperProof: vi.fn(),
  settle: vi.fn(),
  supported: vi.fn(),
  updateAttemptStatus: vi.fn(),
  verify: vi.fn(),
}));

vi.mock("@/server/x402-facilitator", () => ({
  X402FacilitatorClient: class {
    settle = m.settle;
    supported = m.supported;
    verify = m.verify;
  },
}));
vi.mock("@/server/cspr-cloud", () => ({
  CsprCloudClient: class {
    getAccount = m.getAccount;
    getFTOwnerships = m.getFTOwnerships;
  },
}));
vi.mock("@/server/mcp-client", () => ({ callMcpTool: m.callMcpTool, discoverMcpTools: m.discoverMcpTools }));
vi.mock("@/server/provider-store", () => ({ getSourceByEndpoint: m.getSourceByEndpoint, getToolByName: m.getToolByName }));
vi.mock("@/server/receipt-store", () => ({
  persistAttempt: m.persistAttempt,
  persistCasperProof: m.persistCasperProof,
  persistX402Record: m.persistX402Record,
  updateAttemptStatus: m.updateAttemptStatus,
}));
vi.mock("@/server/x402-payment", () => ({
  buildPaymentRequirements: m.buildPaymentRequirements,
  createCasperPaymentPayload: m.createCasperPaymentPayload,
  getConfiguredSignerAddress: m.getConfiguredSignerAddress,
}));
vi.mock("@/server/casper-proof", () => ({ resolveCasperProof: m.resolveCasperProof }));
vi.mock("@/server/env", () => ({
  requireIntegrationConfig: () => ({
    casperNetwork: "casper:casper-test",
    facilitatorUrl: "https://facilitator",
    mcpUrl: "https://mcp.cspr.trade/mcp",
    paymentAmount: "5",
    paymentAsset: "asset",
  }),
}));

import { runGatewayPaidCall } from "@/server/live-paid-call";

const ENDPOINT = "https://mcp.cspr.trade/mcp";
const GATEWAY_HASH = "9accddf69417e3a70e0250e99833dbc7236be6299da01034133d0d2bca01481d";
const input = { args: { amount: "10" }, endpointUrl: ENDPOINT, toolName: "get_quote" };

function setDefaults() {
  m.supported.mockResolvedValue({ kinds: [{ network: "casper:casper-test", scheme: "exact" }] });
  m.getSourceByEndpoint.mockResolvedValue({ id: "src-1", name: "CSPR.trade MCP", sourceType: "mcp" });
  m.getToolByName.mockResolvedValue({
    id: "tool-1",
    name: "get_quote",
    price: {
      amount: "5",
      asset: "asset",
      extra: {},
      maxTimeoutSeconds: 900,
      network: "casper:casper-test",
      payTo: "payee",
      scheme: "exact",
      toolId: "tool-1",
    },
    sourceId: "src-1",
    status: "published",
    upstreamTarget: `${ENDPOINT}#get_quote`,
  });
  m.discoverMcpTools.mockResolvedValue([{ name: "get_quote" }]);
  m.getConfiguredSignerAddress.mockReturnValue(`00${GATEWAY_HASH}`);
  m.buildPaymentRequirements.mockReturnValue({ amount: "5", asset: "asset", network: "casper:casper-test" });
  m.getAccount.mockResolvedValue({ account_hash: GATEWAY_HASH, balance: "10000000000" });
  m.getFTOwnerships.mockResolvedValue([{ balance: "10" }]);
  m.createCasperPaymentPayload.mockResolvedValue({
    paymentPayload: { p: 1 },
    paymentRequirements: { amount: "5", asset: "asset", network: "casper:casper-test" },
  });
  m.verify.mockResolvedValue({ isValid: true });
  m.settle.mockResolvedValue({ success: true, transaction: "deploy-1" });
  m.resolveCasperProof.mockResolvedValue({ deploy: { deploy_hash: "deploy-1", status: "processed" }, ftAction: { a: 1 } });
  m.callMcpTool.mockResolvedValue({ isError: false, text: "quote" });
  m.persistAttempt.mockResolvedValue({ id: "attempt-1" });
}

describe("runGatewayPaidCall (gateway-signer settle)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setDefaults();
  });

  it("settles via the gateway wallet and records a Casper deploy", async () => {
    const result = await runGatewayPaidCall(input);
    expect(result.status).toBe("settled");
    if (result.status !== "settled") throw new Error(`expected settled, got ${result.status}`);
    expect(result.explorerUrl).toContain("deploy-1");
    expect(m.verify).toHaveBeenCalledOnce();
    expect(m.settle).toHaveBeenCalledOnce();
    expect(m.persistCasperProof).toHaveBeenCalled();
  });

  it("blocks without paying when the gateway wallet is low on WCSPR", async () => {
    m.getFTOwnerships.mockResolvedValue([{ balance: "1" }]);
    const result = await runGatewayPaidCall(input);
    expect(result.status).toBe("blocked");
    expect(m.verify).not.toHaveBeenCalled();
    expect(m.settle).not.toHaveBeenCalled();
  });

  it("does not settle when verify fails", async () => {
    m.verify.mockResolvedValue({ invalidReason: "expired", isValid: false });
    const result = await runGatewayPaidCall(input);
    expect(result.status).toBe("verify_failed");
    expect(m.settle).not.toHaveBeenCalled();
  });
});
