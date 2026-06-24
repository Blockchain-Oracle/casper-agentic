import { boolean, integer, jsonb, numeric, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
};

export const providerSources = pgTable("provider_sources", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  sourceType: text("source_type").notNull(),
  endpointUrl: text("endpoint_url").notNull(),
  authMode: text("auth_mode").default("none").notNull(),
  credentialRef: text("credential_ref"),
  ...timestamps,
});

export const providerTools = pgTable("provider_tools", {
  id: uuid("id").primaryKey().defaultRandom(),
  sourceId: uuid("source_id").references(() => providerSources.id),
  name: text("name").notNull(),
  description: text("description"),
  inputSchema: jsonb("input_schema").default({}).notNull(),
  outputSchema: jsonb("output_schema"),
  status: text("status").default("draft").notNull(),
  upstreamTarget: text("upstream_target").notNull(),
  ...timestamps,
});

export const toolPrices = pgTable("tool_prices", {
  id: uuid("id").primaryKey().defaultRandom(),
  toolId: uuid("tool_id").references(() => providerTools.id),
  network: text("network").notNull(),
  scheme: text("scheme").default("exact").notNull(),
  asset: text("asset").notNull(),
  amount: numeric("amount", { precision: 40, scale: 0 }).notNull(),
  payTo: text("pay_to").notNull(),
  maxTimeoutSeconds: integer("max_timeout_seconds").default(900).notNull(),
  extra: jsonb("extra").default({}).notNull(),
  ...timestamps,
});

export const endpointAccessKeys = pgTable("endpoint_access_keys", {
  id: uuid("id").primaryKey().defaultRandom(),
  sourceId: uuid("source_id").references(() => providerSources.id),
  tokenHash: text("token_hash").notNull(),
  label: text("label").notNull(),
  scope: jsonb("scope").default({}).notNull(),
  revoked: boolean("revoked").default(false).notNull(),
  ...timestamps,
});

export const agentWallets = pgTable("agent_wallets", {
  id: uuid("id").primaryKey().defaultRandom(),
  label: text("label").notNull(),
  accountHash: text("account_hash").notNull(),
  publicKey: text("public_key"),
  network: text("network").notNull(),
  signingMode: text("signing_mode").notNull(),
  ...timestamps,
});

export const spendPolicies = pgTable("spend_policies", {
  id: uuid("id").primaryKey().defaultRandom(),
  walletId: uuid("wallet_id").references(() => agentWallets.id),
  maxPerCall: numeric("max_per_call", { precision: 40, scale: 0 }).notNull(),
  dailyLimit: numeric("daily_limit", { precision: 40, scale: 0 }),
  sessionLimit: numeric("session_limit", { precision: 40, scale: 0 }),
  allowedNetwork: text("allowed_network").notNull(),
  allowedAsset: text("allowed_asset").notNull(),
  allowedTools: jsonb("allowed_tools").default([]).notNull(),
  disabled: boolean("disabled").default(false).notNull(),
  ...timestamps,
});

export const paidCallAttempts = pgTable("paid_call_attempts", {
  id: uuid("id").primaryKey().defaultRandom(),
  toolName: text("tool_name").notNull(),
  providerName: text("provider_name").notNull(),
  walletAccountHash: text("wallet_account_hash").notNull(),
  status: text("status").notNull(),
  amount: numeric("amount", { precision: 40, scale: 0 }).notNull(),
  asset: text("asset").notNull(),
  network: text("network").notNull(),
  client: text("client").default("phase-0-console").notNull(),
  redactedInput: jsonb("redacted_input").default({}).notNull(),
  redactedOutput: jsonb("redacted_output"),
  errorReason: text("error_reason"),
  ...timestamps,
});

export const policyDecisions = pgTable("policy_decisions", {
  id: uuid("id").primaryKey().defaultRandom(),
  attemptId: uuid("attempt_id").references(() => paidCallAttempts.id),
  allowed: boolean("allowed").notNull(),
  reason: text("reason").notNull(),
  evaluatedPolicy: jsonb("evaluated_policy").default({}).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const x402Records = pgTable("x402_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  attemptId: uuid("attempt_id").references(() => paidCallAttempts.id),
  paymentRequirements: jsonb("payment_requirements").notNull(),
  paymentPayload: jsonb("payment_payload"),
  verifyResponse: jsonb("verify_response"),
  settleResponse: jsonb("settle_response"),
  facilitatorUrl: text("facilitator_url").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const casperProofs = pgTable("casper_proofs", {
  id: uuid("id").primaryKey().defaultRandom(),
  attemptId: uuid("attempt_id").references(() => paidCallAttempts.id),
  deployHash: text("deploy_hash"),
  deploy: jsonb("deploy"),
  ftAction: jsonb("ft_action"),
  explorerUrl: text("explorer_url"),
  proofStatus: text("proof_status").default("pending").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const auditEvents = pgTable("audit_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  attemptId: uuid("attempt_id").references(() => paidCallAttempts.id),
  kind: text("kind").notNull(),
  label: text("label").notNull(),
  metadata: jsonb("metadata").default({}).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const externalActionFeedCacheEntries = pgTable("external_action_feed_cache_entries", {
  cacheKey: text("cache_key").primaryKey(),
  network: text("network").notNull(),
  paymentAsset: text("payment_asset").notNull(),
  page: integer("page").notNull(),
  pageSize: integer("page_size").notNull(),
  result: jsonb("result").notNull(),
  staleUntil: timestamp("stale_until", { withTimezone: true }).notNull(),
  ...timestamps,
});

export const externalActionFeedRateBuckets = pgTable("external_action_feed_rate_buckets", {
  identityHash: text("identity_hash").primaryKey(),
  count: integer("count").default(0).notNull(),
  resetAt: timestamp("reset_at", { withTimezone: true }).notNull(),
  ...timestamps,
});
