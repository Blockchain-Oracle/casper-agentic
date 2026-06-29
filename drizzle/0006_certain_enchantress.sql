ALTER TABLE "endpoint_access_keys" ADD COLUMN "owner_public_key" text;--> statement-breakpoint
ALTER TABLE "endpoint_access_keys" ADD COLUMN "owner_account_hash" text;--> statement-breakpoint
ALTER TABLE "provider_sources" ADD COLUMN "owner_public_key" text;--> statement-breakpoint
ALTER TABLE "provider_sources" ADD COLUMN "owner_account_hash" text;