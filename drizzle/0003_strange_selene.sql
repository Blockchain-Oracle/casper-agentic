CREATE TABLE "wallet_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wallet_id" uuid NOT NULL,
	"algorithm" text NOT NULL,
	"ciphertext" text NOT NULL,
	"iv" text NOT NULL,
	"auth_tag" text NOT NULL,
	"key_version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "wallet_keys_wallet_id_unique" UNIQUE("wallet_id")
);
--> statement-breakpoint
ALTER TABLE "wallet_keys" ADD CONSTRAINT "wallet_keys_wallet_id_agent_wallets_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."agent_wallets"("id") ON DELETE no action ON UPDATE no action;