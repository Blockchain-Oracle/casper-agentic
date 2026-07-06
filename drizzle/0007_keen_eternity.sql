-- Post-pivot cleanup: drop the removed agent-wallet + spend-policy + policy-decision
-- tables and the endpoint_access_keys wallet binding. Idempotent so a partially
-- applied run can be re-run cleanly.
ALTER TABLE "endpoint_access_keys" DROP CONSTRAINT IF EXISTS "endpoint_access_keys_wallet_id_agent_wallets_id_fk";--> statement-breakpoint
ALTER TABLE "endpoint_access_keys" DROP COLUMN IF EXISTS "wallet_id";--> statement-breakpoint
DROP TABLE IF EXISTS "policy_decisions" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "spend_policies" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "wallet_keys" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "agent_wallets" CASCADE;
