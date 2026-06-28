CREATE TABLE "key_credits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key_id" uuid NOT NULL,
	"deploy_hash" text NOT NULL,
	"transform_idx" integer NOT NULL,
	"amount" numeric(40, 0) NOT NULL,
	"from_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "key_credits" ADD CONSTRAINT "key_credits_key_id_endpoint_access_keys_id_fk" FOREIGN KEY ("key_id") REFERENCES "public"."endpoint_access_keys"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "key_credits_deploy_transform_uq" ON "key_credits" USING btree ("deploy_hash","transform_idx");