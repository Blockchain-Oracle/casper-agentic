import type { PaymentPayload } from "@x402/core/types";

import { resolveCasperProof } from "./casper-proof";
import { CsprCloudClient } from "./cspr-cloud";
import type { RuntimeConfig } from "./env";
import { callMcpTool } from "./mcp-client";
import { persistAudit, persistCasperProof, persistX402Record, updateAttemptStatus } from "./receipt-store";

export type BrowserCompletionConfig = RuntimeConfig & { csprCloudApiKey: string; payeeAccountHash: string };

export interface ParsedBrowserPaymentCompletionInput {
  args: Record<string, unknown>;
  attemptId: string;
  endpointUrl: string;
  paymentPayload: PaymentPayload;
  toolName: string;
}

export async function failBrowserVerify(
  attemptId: string,
  reason: string,
  config: BrowserCompletionConfig,
  paymentPayload: PaymentPayload,
  requirements: unknown,
  verifyResponse: unknown = { invalidReason: reason, isValid: false },
) {
  await persistX402Record({
    attemptId,
    facilitatorUrl: config.facilitatorUrl,
    paymentPayload,
    paymentRequirements: requirements,
    verifyResponse,
  });
  await updateAttemptStatus(attemptId, "verify_failed", reason);
  await persistAudit(attemptId, "fail", "Browser x402 verify failed", { reason });
  return { attemptId, reason, status: "verify_failed" as const };
}

export async function failBrowserPolicy(attemptId: string, reason: string) {
  await updateAttemptStatus(attemptId, "blocked", reason);
  await persistAudit(attemptId, "block", "Browser payment completion blocked before x402", { reason });
  return { attemptId, reason, status: "blocked" as const };
}

export async function failBrowserSettle(
  attemptId: string,
  reason: string,
  config: BrowserCompletionConfig,
  paymentPayload: PaymentPayload,
  requirements: unknown,
  verifyResponse: unknown,
  settleResponse: unknown,
) {
  await persistX402Record({
    attemptId,
    facilitatorUrl: config.facilitatorUrl,
    paymentPayload,
    paymentRequirements: requirements,
    settleResponse,
    verifyResponse,
  });
  await updateAttemptStatus(attemptId, "settle_failed", reason);
  await persistAudit(attemptId, "fail", "Browser x402 settle failed", { reason });
  return { attemptId, reason, status: "settle_failed" as const };
}

export async function completeBrowserProofAndToolCall(
  input: ParsedBrowserPaymentCompletionInput,
  config: BrowserCompletionConfig,
  asset: string,
  deployHash: string,
) {
  const explorerUrl = `https://testnet.cspr.live/deploy/${deployHash}`;
  const proof = await resolveCasperProof(new CsprCloudClient(config), { asset, deployHash });
  if (!proof.deploy) {
    await persistCasperProof({ attemptId: input.attemptId, deployHash, explorerUrl, proofStatus: "pending_indexing" });
    await updateAttemptStatus(input.attemptId, "raw_proof_unavailable", "Casper proof pending CSPR.cloud indexing");
    await persistAudit(input.attemptId, "warn", "Browser Casper proof pending after settlement", { deployHash });
    return { attemptId: input.attemptId, explorerUrl, status: "raw_proof_unavailable" as const };
  }

  await persistCasperProof({
    attemptId: input.attemptId,
    deploy: proof.deploy,
    deployHash: proof.deploy.deploy_hash,
    explorerUrl,
    ftAction: proof.ftAction,
    proofStatus: proof.deploy.status,
  });

  const result = await callProtectedTool(input);
  if (result.isError) {
    const reason =
      "thrown" in result && result.thrown ? "MCP tool call failed after settlement" : "MCP tool returned an error";
    await updateAttemptStatus(input.attemptId, "upstream_failed", reason, { text: result.text });
    await persistAudit(input.attemptId, "fail", "Browser upstream MCP tool failed after settlement", {
      toolName: input.toolName,
    });
    return { attemptId: input.attemptId, explorerUrl, status: "upstream_failed" as const };
  }

  await updateAttemptStatus(input.attemptId, "settled", undefined, { text: result.text });
  await persistAudit(input.attemptId, "ok", "Browser paid tool call settled with Casper proof", {
    deployHash,
    toolName: input.toolName,
  });
  return { attemptId: input.attemptId, explorerUrl, result: result.result, status: "settled" as const };
}

async function callProtectedTool(input: ParsedBrowserPaymentCompletionInput) {
  try {
    return await callMcpTool(input.endpointUrl, input.toolName, input.args);
  } catch (error) {
    const text = error instanceof Error ? error.message : "MCP tool call failed after settlement";
    return { isError: true, result: null, text, thrown: true };
  }
}
