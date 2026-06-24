import type { CsprCloudFTAction } from "@/server/cspr-cloud";
import type { KeyValueRow, Receipt, ReceiptDetail } from "./types";

interface ExternalActionInput {
  action: CsprCloudFTAction;
  actionPage: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
  network: string;
  paymentAsset: string;
  paymentAssetSymbol: string;
}

export function buildExternalActionDetail(input: ExternalActionInput): ReceiptDetail {
  const { action } = input;
  const receipt: Receipt = {
    amount: action.amount,
    asset: input.paymentAssetSymbol,
    client: "external-wcspr-feed",
    hash: action.deploy_hash,
    id: `external-action:${action.deploy_hash}:${action.transform_idx}`,
    provider: "External WCSPR action",
    reason: "This token action was resolved from CSPR.cloud, not from Casper GW receipt records.",
    status: "external_proof",
    time: action.timestamp,
    tool: "payment token action",
    wallet: action.from_hash ?? action.to_hash ?? "unavailable",
  };

  return {
    receipt,
    gateway: gatewayRows(action),
    policy: unavailableRows("Policy decision", "The token action did not resolve to a Casper GW policy record."),
    x402: unavailableRows("x402 verify / settle", "No Casper GW x402 facilitator record is attached to this feed row."),
    casper: casperRows(input),
    policyNote: "External WCSPR feed rows do not include Casper GW wallet-policy context.",
    x402Note:
      "The chain/indexer row proves a configured-token action only. It does not prove the x402 resource, facilitator verification, provider, or tool result.",
    casperNote: "CSPR.cloud returned this configured payment-token action from Casper Testnet.",
  };
}

function gatewayRows(action: CsprCloudFTAction): KeyValueRow[] {
  return [
    { key: "result source", value: "External WCSPR action feed", tone: "primary" },
    { key: "gateway receipt", value: "not found" },
    { key: "deploy hash", value: action.deploy_hash, mono: true },
    { key: "provider", value: "unavailable" },
    { key: "tool", value: "unavailable" },
    { key: "client", value: "external WCSPR feed", mono: true },
  ];
}

function unavailableRows(layer: string, reason: string): KeyValueRow[] {
  return [
    { key: "layer", value: layer },
    { key: "status", value: "unavailable", tone: "warn" },
    { key: "reason", value: reason },
  ];
}

function casperRows(input: ExternalActionInput): KeyValueRow[] {
  const { action } = input;
  return [
    { key: "network", value: input.network, mono: true },
    { key: "payment asset package", value: input.paymentAsset, mono: true },
    { key: "deploy hash", value: action.deploy_hash, mono: true },
    { key: "amount", value: action.amount, mono: true },
    { key: "payer", value: action.from_hash ?? "unavailable", mono: true },
    { key: "payee", value: action.to_hash ?? "unavailable", mono: true },
    { key: "action type id", value: String(action.ft_action_type_id), mono: true },
    { key: "block height", value: String(action.block_height), mono: true },
    { key: "transform index", value: String(action.transform_idx), mono: true },
    { key: "action page", value: `${input.actionPage.page} of ${input.actionPage.totalPages}`, mono: true },
    { key: "total payment actions", value: String(input.actionPage.totalCount), mono: true },
    { key: "page size", value: String(input.actionPage.pageSize), mono: true },
    { key: "raw proof", value: `https://testnet.cspr.live/deploy/${action.deploy_hash}`, mono: true },
  ];
}
