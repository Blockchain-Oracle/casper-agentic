import type { CsprCloudAccount, CsprCloudFTAction, CsprCloudFTOwnership } from "@/server/cspr-cloud";
import type { KeyValueRow, Receipt, ReceiptDetail } from "./types";

interface ExternalAccountInput {
  accountHash: string;
  account?: CsprCloudAccount;
  actions: CsprCloudFTAction[];
  actionPage?: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
  network: string;
  ownership?: CsprCloudFTOwnership;
  paymentAsset: string;
  paymentAssetSymbol: string;
  receiptId?: string;
}

export function buildExternalAccountDetail(input: ExternalAccountInput): ReceiptDetail {
  const latest = input.actions[0];
  const receipt: Receipt = {
    amount: latest?.amount ?? input.ownership?.balance ?? "0",
    asset: input.paymentAssetSymbol,
    client: "external-account-lookup",
    hash: latest?.deploy_hash ?? null,
    id: input.receiptId ?? `account:${input.accountHash}`,
    provider: "External Casper account",
    reason: "This account was resolved from CSPR.cloud, not from Casper GW receipt records.",
    status: "external_proof",
    time: latest?.timestamp ?? "unavailable",
    tool: latest ? "payment token action" : "unavailable",
    wallet: input.accountHash,
  };

  return {
    receipt,
    gateway: gatewayRows(input.accountHash),
    policy: unavailableRows("Policy decision", "The account did not resolve to a Casper GW receipt match."),
    x402: unavailableRows("x402 verify / settle", "No Casper GW x402 facilitator record is attached to this account lookup."),
    casper: casperRows(input, latest),
    policyNote: "External account proof does not include Casper GW wallet-policy context.",
    x402Note: "External account lookup proves account/token-action facts only. It does not prove the x402 resource, facilitator verification, provider, or tool result.",
    casperNote: latest
      ? "CSPR.cloud returned recent configured payment-token actions for this account."
      : "CSPR.cloud resolved account/token ownership data, but no recent configured payment-token action was returned.",
  };
}

function gatewayRows(accountHash: string): KeyValueRow[] {
  return [
    { key: "result source", value: "External Casper account proof", tone: "primary" },
    { key: "gateway receipt", value: "not found" },
    { key: "account hash", value: accountHash, mono: true },
    { key: "provider", value: "unavailable" },
    { key: "tool", value: "unavailable" },
    { key: "client", value: "external account lookup", mono: true },
  ];
}

function unavailableRows(layer: string, reason: string): KeyValueRow[] {
  return [
    { key: "layer", value: layer },
    { key: "status", value: "unavailable", tone: "warn" },
    { key: "reason", value: reason },
  ];
}

function casperRows(input: ExternalAccountInput, latest?: CsprCloudFTAction): KeyValueRow[] {
  return [
    { key: "account hash", value: input.accountHash, mono: true },
    { key: "network", value: input.network, mono: true },
    ...(input.account?.public_key ? [{ key: "public key", value: input.account.public_key, mono: true }] : []),
    ...(input.account?.balance ? [{ key: "CSPR gas balance", value: input.account.balance, mono: true }] : []),
    { key: "payment asset package", value: input.paymentAsset, mono: true },
    { key: "payment asset balance", value: input.ownership?.balance ?? "0", mono: true },
    { key: "recent payment actions", value: String(input.actions.length), mono: true },
    ...(input.actionPage
      ? [
          { key: "action page", value: `${input.actionPage.page} of ${input.actionPage.totalPages}`, mono: true },
          { key: "total payment actions", value: String(input.actionPage.totalCount), mono: true },
          { key: "page size", value: String(input.actionPage.pageSize), mono: true },
        ]
      : []),
    ...(latest
      ? [
          { key: "latest deploy hash", value: latest.deploy_hash, mono: true },
          { key: "latest amount", value: latest.amount, mono: true },
          { key: "latest payer", value: latest.from_hash ?? "unavailable", mono: true },
          { key: "latest payee", value: latest.to_hash ?? "unavailable", mono: true },
          { key: "latest raw proof", value: `https://testnet.cspr.live/deploy/${latest.deploy_hash}`, mono: true },
        ]
      : [{ key: "payment token action", value: "not found for configured asset", tone: "warn" as const }]),
  ];
}
