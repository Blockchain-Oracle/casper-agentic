import type { ReceiptStatus, Screen } from "./types";

export const screens: Array<{
  id: Screen;
  label: string;
  short: string;
  group: string;
  eyebrow: string;
  title: string;
  subtitle: string;
}> = [
  {
    id: "dashboard",
    label: "Operations",
    short: "Operations",
    group: "Gateway",
    eyebrow: "Control plane",
    title: "Operations",
    subtitle: "Whole-gateway state across provider, wallet, paid console, and proof surfaces.",
  },
  {
    id: "import",
    label: "Source Import",
    short: "Sources",
    group: "Provider",
    eyebrow: "Provider gateway",
    title: "Source Import",
    subtitle: "Bring an API, OpenAPI spec, manual route, or existing MCP server.",
  },
  {
    id: "pricing",
    label: "Tool Pricing & Publish",
    short: "My Tools",
    group: "Provider",
    eyebrow: "Provider gateway",
    title: "Tool Pricing & Publish",
    subtitle: "Choose paid tools and configure Casper x402 pricing.",
  },
  {
    id: "endpoint",
    label: "Hosted Endpoint",
    short: "Endpoint",
    group: "Provider",
    eyebrow: "Provider gateway",
    title: "Hosted Endpoint",
    subtitle: "The generated MCP/x402 endpoint and how clients connect.",
  },
  {
    id: "wallet",
    label: "Wallet Control Plane",
    short: "Wallets",
    group: "Operator",
    eyebrow: "Agent operator",
    title: "Wallet Control Plane",
    subtitle: "Casper agent wallet profiles, funding readiness, and spend policy.",
  },
  {
    id: "console",
    label: "Paid Tool Test Console",
    short: "Console",
    group: "Operator",
    eyebrow: "Agent operator",
    title: "Paid Tool Test Console",
    subtitle: "Discover endpoint tools, select inputs, check wallet policy, and produce a receipt.",
  },
  {
    id: "settings",
    label: "Settings & Audit",
    short: "Settings",
    group: "System",
    eyebrow: "System",
    title: "Settings & Audit",
    subtitle: "Inspect trust boundaries, credentials, network, facilitator, signing, and audit log.",
  },
];

export const statusMeta: Record<ReceiptStatus, { label: string; tone: string }> = {
  policy_pending: { label: "Policy pending", tone: "warn" },
  settled: { label: "Settled", tone: "signal" },
  blocked: { label: "Blocked", tone: "primary" },
  verify_failed: { label: "Verify fail", tone: "danger" },
  settle_failed: { label: "Settle fail", tone: "danger" },
  upstream_failed: { label: "Upstream 502", tone: "danger" },
  auth_failed: { label: "MCP auth fail", tone: "danger" },
  raw_proof_unavailable: { label: "Proof pending", tone: "warn" },
  external_proof: { label: "External proof", tone: "primary" },
};
