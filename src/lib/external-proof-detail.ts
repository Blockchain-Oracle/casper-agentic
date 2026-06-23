import type { CsprCloudDeploy, CsprCloudFTAction } from "@/server/cspr-cloud";
import type { KeyValueRow, Receipt, ReceiptDetail } from "./types";

interface ExternalProofInput {
  deploy: CsprCloudDeploy;
  explorerUrl: string;
  ftActions: CsprCloudFTAction[];
  network: string;
  paymentAsset: string;
  paymentAssetSymbol: string;
}

export function buildExternalProofDetail(input: ExternalProofInput): ReceiptDetail {
  const action = input.ftActions[0];
  const deployHash = input.deploy.deploy_hash;
  const receipt: Receipt = {
    amount: action?.amount ?? "unavailable",
    asset: action ? input.paymentAssetSymbol : "unavailable",
    client: "external-casper-proof",
    hash: deployHash,
    id: deployHash,
    provider: "External Casper deploy",
    reason: "This deploy was resolved from CSPR.cloud, not from Casper GW receipt records.",
    status: "external_proof",
    time: input.deploy.timestamp ?? action?.timestamp ?? "unavailable",
    tool: "unavailable",
    wallet: action?.from_hash ?? "unavailable",
  };

  return {
    receipt,
    gateway: gatewayRows(deployHash),
    policy: unavailableRows("Policy decision", "The deploy did not resolve to a Casper GW receipt."),
    x402: unavailableRows("x402 verify / settle", "No Casper GW x402 facilitator record is attached."),
    casper: casperRows(input, action),
    policyNote: "External Casper proof does not include Casper GW wallet-policy context.",
    x402Note: "External deploy lookup proves chain facts only. It does not prove the x402 resource, facilitator verification, or tool result unless the deploy also matches a Casper GW receipt.",
    casperNote: action
      ? "CSPR.cloud resolved the deploy and a matching payment-token action."
      : "CSPR.cloud resolved the deploy, but no matching configured payment-token action was found.",
  };
}

function gatewayRows(deployHash: string): KeyValueRow[] {
  return [
    { key: "result source", value: "External Casper proof", tone: "primary" },
    { key: "gateway receipt", value: "not found" },
    { key: "deploy hash", value: deployHash, mono: true },
    { key: "provider", value: "unavailable" },
    { key: "tool", value: "unavailable" },
    { key: "client", value: "external lookup", mono: true },
  ];
}

function unavailableRows(layer: string, reason: string): KeyValueRow[] {
  return [
    { key: "layer", value: layer },
    { key: "status", value: "unavailable", tone: "warn" },
    { key: "reason", value: reason },
  ];
}

function casperRows(input: ExternalProofInput, action?: CsprCloudFTAction): KeyValueRow[] {
  return [
    { key: "deploy hash", value: input.deploy.deploy_hash, mono: true },
    { key: "network", value: input.network, mono: true },
    { key: "deploy status", value: input.deploy.status, tone: input.deploy.status === "processed" ? "signal" : "warn" },
    ...(input.deploy.block_height ? [{ key: "block height", value: String(input.deploy.block_height), mono: true }] : []),
    ...(input.deploy.timestamp ? [{ key: "timestamp", value: input.deploy.timestamp, mono: true }] : []),
    { key: "payment asset package", value: input.paymentAsset, mono: true },
    ...(action
      ? [
          { key: "amount", value: action.amount, mono: true },
          { key: "payer", value: action.from_hash ?? "unavailable", mono: true },
          { key: "payee", value: action.to_hash ?? "unavailable", mono: true },
          { key: "token action", value: String(action.ft_action_type_id), mono: true },
        ]
      : [{ key: "payment token action", value: "not found for configured asset", tone: "warn" as const }]),
    { key: "raw proof", value: input.explorerUrl, mono: true },
  ];
}
