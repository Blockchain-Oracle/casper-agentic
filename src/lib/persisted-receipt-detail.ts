import type { KeyValueRow, Receipt, ReceiptDetail } from "./types";

export interface PersistedReceiptLayers {
  casperProof?: {
    deploy?: unknown;
    deployHash?: string | null;
    explorerUrl?: string | null;
    ftAction?: unknown;
    proofStatus?: string;
  } | null;
  policyDecision?: {
    allowed: boolean;
    evaluatedPolicy?: unknown;
    reason: string;
  } | null;
  x402Records?: Array<{
    facilitatorUrl: string;
    paymentRequirements: unknown;
    settleResponse?: unknown;
    verifyResponse?: unknown;
  }>;
}

type PersistedX402Record = NonNullable<PersistedReceiptLayers["x402Records"]>[number];

export function buildPersistedReceiptDetail(receipt: Receipt, layers: PersistedReceiptLayers): ReceiptDetail {
  const x402 = latestX402Record(layers.x402Records ?? []);
  const requirements = asRecord(x402?.paymentRequirements);
  const verify = asRecord(x402?.verifyResponse);
  const settle = asRecord(x402?.settleResponse);
  const proof = layers.casperProof;
  const ftAction = asRecord(proof?.ftAction);
  const deployHash = proof?.deployHash ?? receipt.hash;
  const amount = stringValue(requirements.amount) ?? receipt.amount;
  const asset = stringValue(requirements.asset) ?? receipt.asset;
  const network = stringValue(requirements.network) ?? "casper:casper-test";
  const payTo = stringValue(requirements.payTo) ?? stringValue(ftAction.to) ?? "not recorded";
  const payer = stringValue(settle.payer) ?? stringValue(ftAction.from) ?? receipt.wallet;

  return {
    receipt,
    gateway: gatewayRows(receipt),
    policy: policyRows(layers.policyDecision),
    x402: x402Rows(receipt, x402, verify, settle, { amount, asset, network, payTo }),
    casper: casperRows(receipt, proof, { amount, asset, deployHash, payTo, payer }),
    policyNote: policyNote(receipt, layers.policyDecision),
    x402Note: x402Note(receipt, x402, verify, settle),
    casperNote: casperNote(receipt, proof),
  };
}

function gatewayRows(receipt: Receipt): KeyValueRow[] {
  return [
    { key: "receipt id", value: receipt.id, mono: true },
    { key: "provider", value: receipt.provider },
    { key: "tool", value: receipt.tool, mono: true },
    { key: "client", value: receipt.client, mono: true },
    { key: "price", value: `${receipt.amount} ${receipt.asset}`, mono: true },
    { key: "wallet", value: receipt.wallet, mono: true },
    { key: "request id", value: receipt.id, mono: true },
  ];
}

function policyRows(policy: PersistedReceiptLayers["policyDecision"]): KeyValueRow[] {
  if (!policy) return [{ key: "decision", value: "not recorded", tone: "neutral" }];
  return [
    { key: "decision", value: policy.allowed ? "ALLOWED" : "BLOCKED", tone: policy.allowed ? "signal" : "primary" },
    { key: "reason", value: policy.reason, tone: policy.allowed ? "signal" : "primary" },
  ];
}

function x402Rows(
  receipt: Receipt,
  record: PersistedX402Record | null,
  verify: Record<string, unknown>,
  settle: Record<string, unknown>,
  requirements: { amount: string; asset: string; network: string; payTo: string },
): KeyValueRow[] {
  if (!record) {
    return [
      { key: "network", value: requirements.network, mono: true },
      { key: "scheme", value: "exact", mono: true },
      { key: "verify", value: "not attempted", tone: "neutral" },
      { key: "settle", value: "not attempted", tone: "neutral" },
    ];
  }

  const verifyFailed = verify.isValid === false || receipt.status === "verify_failed";
  const settleFailed = settle.success === false || receipt.status === "settle_failed";
  const settleAttempted = Boolean(record.settleResponse);
  return [
    { key: "network", value: requirements.network, mono: true },
    { key: "scheme", value: "exact", mono: true },
    { key: "asset", value: requirements.asset, mono: true },
    { key: "amount", value: requirements.amount, mono: true },
    { key: "payee", value: requirements.payTo, mono: true },
    { key: "verify", value: verifyFailed ? "FAILED" : "verified", tone: verifyFailed ? "danger" : "signal" },
    {
      key: "settle",
      value: settleValue(receipt, { settleAttempted, settleFailed, verifyFailed }),
      tone: settleTone(receipt, { settleAttempted, settleFailed, verifyFailed }),
    },
    { key: "facilitator", value: record.facilitatorUrl, mono: true },
  ];
}

function casperRows(
  receipt: Receipt,
  proof: PersistedReceiptLayers["casperProof"],
  values: { amount: string; asset: string; deployHash?: string | null; payTo: string; payer: string },
): KeyValueRow[] {
  if (!proof || !values.deployHash) return [];
  const pending = receipt.status === "raw_proof_unavailable" || proof.proofStatus === "pending_indexing";
  return [
    { key: pending ? "settle transaction" : "deploy hash", value: values.deployHash, mono: true },
    { key: "network", value: "casper:casper-test", mono: true },
    { key: "payer", value: values.payer, mono: true },
    { key: "payee", value: values.payTo, mono: true },
    { key: "amount", value: `${values.amount} ${values.asset}`, mono: true },
    { key: "proof status", value: proof.proofStatus ?? (pending ? "pending" : "processed"), tone: pending ? "warn" : "signal", mono: true },
    ...(proof.explorerUrl ? [{ key: "raw proof", value: proof.explorerUrl, mono: true } satisfies KeyValueRow] : []),
  ];
}

function policyNote(receipt: Receipt, policy: PersistedReceiptLayers["policyDecision"]) {
  if (policy?.allowed === false) {
    return receipt.client === "hosted-mcp-endpoint"
      ? "Spend was stopped before settlement. A block is a successful control outcome and has no transaction."
      : "Spend was stopped before signing. A block is a successful control outcome and has no transaction.";
  }
  if (receipt.status === "policy_pending") return "Policy evaluation did not complete. No payment step or Casper transaction is attached.";
  return undefined;
}

function x402Note(
  receipt: Receipt,
  record: PersistedX402Record | null,
  verify: Record<string, unknown>,
  settle: Record<string, unknown>,
) {
  if (!record) return "No payment step ran - the call never reached the facilitator.";
  if (verify.isValid === false) return stringValue(verify.invalidReason) ?? receipt.reason;
  if (settle.success === false) return stringValue(settle.errorMessage) ?? stringValue(settle.errorReason) ?? receipt.reason;
  if (receipt.status === "raw_proof_unavailable") return "Settlement returned a transaction, but CSPR.cloud proof indexing is still pending.";
  return receipt.status === "upstream_failed" ? receipt.reason : undefined;
}

function casperNote(receipt: Receipt, proof: PersistedReceiptLayers["casperProof"]) {
  if (proof?.deployHash && receipt.status !== "raw_proof_unavailable") {
    return "Chain proof covers payment only. Provider, tool, resource URL, price rule, and policy live in the gateway record.";
  }
  if (proof?.deployHash) return "Settlement returned a transaction hash; raw Casper proof is pending indexed confirmation.";
  return "No successful settlement occurred, so no Casper proof is attached.";
}

function settleValue(
  receipt: Receipt,
  state: { settleAttempted: boolean; settleFailed: boolean; verifyFailed: boolean },
) {
  if (state.verifyFailed || !state.settleAttempted) return "not attempted";
  if (state.settleFailed) return "FAILED";
  return receipt.status === "raw_proof_unavailable" ? "settle transaction recorded - proof pending" : "settled";
}

function settleTone(
  receipt: Receipt,
  state: { settleAttempted: boolean; settleFailed: boolean; verifyFailed: boolean },
): KeyValueRow["tone"] {
  if (state.verifyFailed || !state.settleAttempted) return "neutral";
  if (state.settleFailed) return "danger";
  return receipt.status === "raw_proof_unavailable" ? "warn" : "signal";
}

function latestX402Record(records: PersistedX402Record[]) {
  return records.find((record) => Boolean(record.settleResponse)) ?? records.find((record) => Boolean(record.verifyResponse)) ?? null;
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}
