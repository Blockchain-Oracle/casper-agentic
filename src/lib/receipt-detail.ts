import { receipts } from "./fixtures";
import type { KeyValueRow, Receipt, ReceiptDetail } from "./types";

export function receiptById(id: string): Receipt {
  return receipts.find((receipt) => receipt.id === id) ?? receipts[0];
}

export function buildReceiptDetail(receipt: Receipt): ReceiptDetail {
  const isAuth = receipt.status === "auth_failed";
  const isBlocked = receipt.status === "blocked";
  const isProofUnavailable = receipt.status === "raw_proof_unavailable";
  const hasRealProof = Boolean(receipt.hash);
  const endpointSlug = receipt.provider === "Make Software Labs" ? "make-software" : "weather-risk";
  const endpoint = `https://gw.casper-gateway.io/mcp/${endpointSlug}`;
  const verifyTone: KeyValueRow["tone"] =
    receipt.status === "verify_failed" ? "danger" : "signal";
  const settleTone: KeyValueRow["tone"] =
    receipt.status === "settle_failed"
      ? "danger"
      : isProofUnavailable || (receipt.status === "upstream_failed" && !hasRealProof)
        ? "warn"
        : "signal";

  const policy =
    isAuth
      ? [{ key: "decision", value: "Not reached - MCP client auth failed first", tone: "neutral" as const }]
      : isBlocked
        ? [
            { key: "decision", value: "BLOCKED", tone: "primary" as const },
            { key: "reason", value: receipt.reason ?? "Policy blocked the call", tone: "primary" as const },
            { key: "matched", value: "provider ok - tool ok - network ok - asset ok" },
            { key: "failed rule", value: "max-per-call 0.08 < requested 0.10", tone: "primary" as const },
          ]
        : [
            { key: "decision", value: "ALLOWED", tone: "signal" as const },
            { key: "matched rules", value: "provider ok - tool ok - network ok - asset ok - limit ok" },
            { key: "max-per-call", value: `${receipt.amount} <= 0.08 WCSPR` },
            { key: "daily remaining", value: "1.78 / 2.00 WCSPR" },
          ];

  const x402 =
    isAuth || isBlocked
      ? [
          { key: "network", value: "casper:casper-test", mono: true },
          { key: "scheme", value: "exact", mono: true },
          { key: "verify", value: "not attempted", tone: "neutral" as const },
          { key: "settle", value: "not attempted", tone: "neutral" as const },
        ]
      : [
          { key: "network", value: "casper:casper-test", mono: true },
          { key: "scheme", value: "exact", mono: true },
          { key: "asset", value: "CEP-18 WCSPR", mono: true },
          { key: "amount", value: receipt.amount, mono: true },
          { key: "payee", value: "0x4d2f...a017", mono: true },
          {
            key: "verify",
            value: receipt.status === "verify_failed" ? "FAILED" : "verified",
            tone: verifyTone,
          },
          {
            key: "settle",
            value:
              receipt.status === "settle_failed"
                ? "FAILED"
                : isProofUnavailable
                  ? "proof pending - no deploy hash claimed"
                : receipt.status === "upstream_failed" && !hasRealProof
                  ? "withheld"
                  : "settled",
            tone: settleTone,
          },
          { key: "facilitator", value: "CSPR.cloud x402 - Casper Testnet", mono: true },
        ];

  const casper =
    hasRealProof
      ? [
          { key: "deploy hash", value: receipt.hash ?? "unavailable", mono: true },
          { key: "network", value: "casper:casper-test", mono: true },
          { key: "payer", value: "0x9f3a...b2c1", mono: true },
          { key: "payee", value: "0x4d2f...a017", mono: true },
          { key: "amount", value: `${receipt.amount} WCSPR`, mono: true },
          {
            key: "proof status",
            value: "verified Testnet deploy",
            tone: "signal" as const,
            mono: true,
          },
          { key: "raw proof", value: `testnet.cspr.live/deploy/${receipt.hash}`, mono: true },
        ]
      : isProofUnavailable
        ? [
            { key: "deploy hash", value: "not present in fixture data", mono: true, tone: "warn" as const },
            { key: "network", value: "casper:casper-test", mono: true },
            { key: "payer", value: "0x9f3a...b2c1", mono: true },
            { key: "payee", value: "0x4d2f...a017", mono: true },
            { key: "amount", value: `${receipt.amount} WCSPR`, mono: true },
            { key: "proof status", value: "design fixture - no live claim", tone: "warn" as const, mono: true },
          ]
      : [];

  return {
    receipt,
    gateway: [
      { key: "receipt id", value: receipt.id, mono: true },
      { key: "provider", value: receipt.provider },
      { key: "tool", value: receipt.tool, mono: true },
      { key: "client", value: receipt.client, mono: true },
      { key: "endpoint", value: endpoint, mono: true },
      { key: "resource", value: `/tools/${receipt.tool}`, mono: true },
      { key: "price", value: `${receipt.amount} ${receipt.asset}`, mono: true },
      { key: "wallet", value: receipt.wallet, mono: true },
      { key: "request id", value: `req_${receipt.id.slice(4)}`, mono: true },
    ],
    policy,
    x402,
    casper,
    policyNote: isBlocked
      ? "Spend was stopped before signing. A block is a successful control outcome and has no transaction."
      : isAuth
        ? "The request was rejected at the MCP client-access boundary before policy or payment."
        : undefined,
    x402Note:
      isAuth || isBlocked
        ? "No payment step ran - the call never reached the facilitator."
        : isProofUnavailable
          ? "This receipt is fixture data until a real facilitator settle response and deploy hash are stored."
        : receipt.status === "verify_failed" || receipt.status === "settle_failed" || receipt.status === "upstream_failed"
          ? receipt.reason
          : undefined,
    casperNote: hasRealProof
      ? "Chain proof covers payment only. Provider, tool, resource URL, price rule, and policy live in the gateway record."
      : isProofUnavailable
        ? "The gateway must not claim raw Casper proof until a transaction/deploy hash or explorer proof is available."
      : isBlocked
        ? "Blocked before signing - no transaction exists on Casper."
        : isAuth
          ? "Rejected at MCP client auth - no payment, no transaction."
          : "No successful settlement occurred, so no Casper proof is attached.",
  };
}
