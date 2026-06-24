CREATE TABLE "external_action_feed_cache_entries" (
	"cache_key" text PRIMARY KEY NOT NULL,
	"network" text NOT NULL,
	"payment_asset" text NOT NULL,
	"page" integer NOT NULL,
	"page_size" integer NOT NULL,
	"result" jsonb NOT NULL,
	"stale_until" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "external_action_feed_rate_buckets" (
	"identity_hash" text PRIMARY KEY NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"reset_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
