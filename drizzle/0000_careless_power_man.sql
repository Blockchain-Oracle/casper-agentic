CREATE TABLE "agent_wallets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"label" text NOT NULL,
	"account_hash" text NOT NULL,
	"public_key" text,
	"network" text NOT NULL,
	"signing_mode" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"attempt_id" uuid,
	"kind" text NOT NULL,
	"label" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "casper_proofs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"attempt_id" uuid,
	"deploy_hash" text,
	"deploy" jsonb,
	"ft_action" jsonb,
	"explorer_url" text,
	"proof_status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "endpoint_access_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_id" uuid,
	"token_hash" text NOT NULL,
	"label" text NOT NULL,
	"scope" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"revoked" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "paid_call_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tool_name" text NOT NULL,
	"provider_name" text NOT NULL,
	"wallet_account_hash" text NOT NULL,
	"status" text NOT NULL,
	"amount" numeric(40, 0) NOT NULL,
	"asset" text NOT NULL,
	"network" text NOT NULL,
	"client" text DEFAULT 'phase-0-console' NOT NULL,
	"redacted_input" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"redacted_output" jsonb,
	"error_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "policy_decisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"attempt_id" uuid,
	"allowed" boolean NOT NULL,
	"reason" text NOT NULL,
	"evaluated_policy" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "provider_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"source_type" text NOT NULL,
	"endpoint_url" text NOT NULL,
	"auth_mode" text DEFAULT 'none' NOT NULL,
	"credential_ref" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "provider_tools" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_id" uuid,
	"name" text NOT NULL,
	"description" text,
	"input_schema" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"output_schema" jsonb,
	"status" text DEFAULT 'draft' NOT NULL,
	"upstream_target" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "spend_policies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wallet_id" uuid,
	"max_per_call" numeric(40, 0) NOT NULL,
	"daily_limit" numeric(40, 0),
	"allowed_network" text NOT NULL,
	"allowed_asset" text NOT NULL,
	"allowed_tools" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"disabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tool_prices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tool_id" uuid,
	"network" text NOT NULL,
	"scheme" text DEFAULT 'exact' NOT NULL,
	"asset" text NOT NULL,
	"amount" numeric(40, 0) NOT NULL,
	"pay_to" text NOT NULL,
	"max_timeout_seconds" integer DEFAULT 900 NOT NULL,
	"extra" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "x402_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"attempt_id" uuid,
	"payment_requirements" jsonb NOT NULL,
	"payment_payload" jsonb,
	"verify_response" jsonb,
	"settle_response" jsonb,
	"facilitator_url" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_attempt_id_paid_call_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."paid_call_attempts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "casper_proofs" ADD CONSTRAINT "casper_proofs_attempt_id_paid_call_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."paid_call_attempts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "endpoint_access_keys" ADD CONSTRAINT "endpoint_access_keys_source_id_provider_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."provider_sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policy_decisions" ADD CONSTRAINT "policy_decisions_attempt_id_paid_call_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."paid_call_attempts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_tools" ADD CONSTRAINT "provider_tools_source_id_provider_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."provider_sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spend_policies" ADD CONSTRAINT "spend_policies_wallet_id_agent_wallets_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."agent_wallets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tool_prices" ADD CONSTRAINT "tool_prices_tool_id_provider_tools_id_fk" FOREIGN KEY ("tool_id") REFERENCES "public"."provider_tools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "x402_records" ADD CONSTRAINT "x402_records_attempt_id_paid_call_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."paid_call_attempts"("id") ON DELETE no action ON UPDATE no action;