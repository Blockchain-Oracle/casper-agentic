import { encodePaymentResponseHeader } from "@x402/core/http";
import type { PaymentRequirements, SettleResponse } from "@x402/core/types";

import { resolveCasperProof } from "./casper-proof";
import { CsprCloudClient } from "./cspr-cloud";
import type { HostedPaidToolCallInput, HostedPaidToolCallOutput } from "./hosted-paid-call";
import type { HostedSettlementConfig } from "./hosted-settlement-config";
import { callMcpTool } from "./mcp-client";
import { persistAudit, persistCasperProof, updateAttemptStatus } from "./receipt-store";

export async function completeSettledHostedCall(
  input: HostedPaidToolCallInput,
  context: {
    attemptId: string;
    config: HostedSettlementConfig;
    requirements: PaymentRequirements;
    settleResponse: SettleResponse;
  },
): Promise<HostedPaidToolCallOutput> {
  const csprCloud = new CsprCloudClient(context.config);
  const explorerUrl = `https://testnet.cspr.live/deploy/${context.settleResponse.transaction}`;
  const proof = await resolveCasperProof(csprCloud, {
    asset: context.requirements.asset,
    deployHash: context.settleResponse.transaction ?? "",
  });
  const paymentResponseHeader = encodePaymentResponseHeader(context.settleResponse);

  if (!proof.deploy) {
    await persistCasperProof({
      attemptId: context.attemptId,
      deployHash: context.settleResponse.transaction,
      explorerUrl,
      proofStatus: "pending_indexing",
    });
    await updateAttemptStatus(context.attemptId, "raw_proof_unavailable", "Casper proof pending CSPR.cloud indexing");
    await persistAudit(context.attemptId, "warn", "Hosted Casper proof pending after settlement", {
      deployHash: context.settleResponse.transaction,
      reason: proof.error,
    });
    return paymentError(
      202,
      -32016,
      "casper proof pending",
      { attemptId: context.attemptId, status: "raw_proof_unavailable" },
      paymentResponseHeader,
    );
  }

  await persistCasperProof({
    attemptId: context.attemptId,
    deploy: proof.deploy,
    deployHash: proof.deploy.deploy_hash,
    explorerUrl,
    ftAction: proof.ftAction,
    proofStatus: proof.deploy.status,
  });

  const upstream = await callProtectedTool(input);
  if (!upstream.response) {
    await updateAttemptStatus(context.attemptId, "upstream_failed", "MCP tool request failed", {
      error: upstream.error,
    });
    await persistAudit(context.attemptId, "fail", "Hosted upstream MCP request failed after settlement", {
      error: upstream.error,
      toolName: input.tool.name,
    });
    return paymentError(
      502,
      -32017,
      "upstream MCP tool failed after settlement",
      { attemptId: context.attemptId, reason: "upstream_request_failed", status: "upstream_failed" },
      paymentResponseHeader,
    );
  }
  const { response } = upstream;
  if (response.isError) {
    await updateAttemptStatus(context.attemptId, "upstream_failed", "MCP tool returned an error", {
      text: response.text,
    });
    await persistAudit(context.attemptId, "fail", "Hosted upstream MCP tool failed after settlement", {
      toolName: input.tool.name,
    });
    return paymentError(
      502,
      -32017,
      "upstream MCP tool failed after settlement",
      { attemptId: context.attemptId, status: "upstream_failed" },
      paymentResponseHeader,
    );
  }

  await updateAttemptStatus(context.attemptId, "settled", undefined, { text: response.text });
  await persistAudit(context.attemptId, "ok", "Hosted paid tool call settled with Casper proof", {
    deployHash: context.settleResponse.transaction,
    toolName: input.tool.name,
  });
  return {
    attemptId: context.attemptId,
    kind: "success",
    paymentResponseHeader,
    result: response.result,
  };
}

async function callProtectedTool(input: HostedPaidToolCallInput) {
  try {
    return { response: await callMcpTool(input.endpoint.source.endpointUrl, input.tool.name, input.args) };
  } catch (error) {
    return { error: publicErrorMessage(error) };
  }
}

function paymentError(
  status: number,
  code: number,
  message: string,
  data: Record<string, unknown>,
  paymentResponseHeader?: string,
): HostedPaidToolCallOutput {
  return { code, data, kind: "error", message, paymentResponseHeader, status };
}

function publicErrorMessage(error: unknown) {
  return (error instanceof Error ? error.message : "request failed").slice(0, 160);
}
