import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getHostedEndpoint: vi.fn(),
  requireOperatorRequest: vi.fn(),
  resolveHostedTool: vi.fn(),
  runHostedServerSignedToolCall: vi.fn(),
}));

vi.mock("@/server/operator-access", () => ({
  isOperatorAccessError: () => false,
  requireOperatorRequest: mocks.requireOperatorRequest,
}));
vi.mock("@/server/hosted-endpoint", () => ({
  getHostedEndpoint: mocks.getHostedEndpoint,
  resolveHostedTool: mocks.resolveHostedTool,
}));
vi.mock("@/server/hosted-server-signed-call", () => ({
  runHostedServerSignedToolCall: mocks.runHostedServerSignedToolCall,
}));

import { POST } from "@/app/api/paid-calls/agent-wallet/route";

function postRequest(body: Record<string, unknown>) {
  return new NextRequest("https://gw.example/api/paid-calls/agent-wallet", {
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
    method: "POST",
  });
}

const validBody = { args: { token_in: "CSPR" }, sourceId: "source-1", toolName: "get_quote", walletId: "wallet-1" };

describe("POST /api/paid-calls/agent-wallet (pay with my agent wallet)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getHostedEndpoint.mockResolvedValue({ source: { name: "CSPR.trade MCP" } });
    mocks.resolveHostedTool.mockReturnValue({ name: "get_quote", paymentRequirements: {} });
  });

  it("server-signs with the selected wallet against the canonical hosted resource", async () => {
    mocks.runHostedServerSignedToolCall.mockResolvedValue({ attemptId: "a1", kind: "success", paymentResponseHeader: "h", result: { ok: true } });

    const response = await POST(postRequest(validBody));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ attemptId: "a1", result: { ok: true }, status: "settled" });
    expect(response.headers.get("x-casper-gw-receipt-id")).toBe("a1");
    const [, walletId] = mocks.runHostedServerSignedToolCall.mock.calls[0];
    expect(walletId).toBe("wallet-1");
    expect(mocks.runHostedServerSignedToolCall.mock.calls[0][0].requestUrl).toBe("https://gw.example/api/mcp/source-1");
  });

  it("surfaces a policy block with its HTTP status", async () => {
    mocks.runHostedServerSignedToolCall.mockResolvedValue({
      attemptId: "a1",
      code: -32014,
      data: { attemptId: "a1", reason: "amount exceeds max per call", status: "blocked" },
      kind: "error",
      message: "spend policy blocked settlement",
      status: 403,
    });

    const response = await POST(postRequest(validBody));

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({ error: "spend policy blocked settlement", reason: "amount exceeds max per call" });
  });

  it("returns 404 when the tool is not found", async () => {
    mocks.resolveHostedTool.mockReturnValue(undefined);
    const response = await POST(postRequest(validBody));
    expect(response.status).toBe(404);
    expect(mocks.runHostedServerSignedToolCall).not.toHaveBeenCalled();
  });

  it("rejects a missing walletId", async () => {
    const response = await POST(postRequest({ ...validBody, walletId: undefined }));
    expect(response.status).toBe(400);
    expect(mocks.getHostedEndpoint).not.toHaveBeenCalled();
  });
});
