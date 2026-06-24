import { loadEnvConfig } from "@next/env";

import { closeDb } from "../src/db/client";
import { runFeedStatePrune } from "../src/server/external-action-feed-maintenance";

loadEnvConfig(process.cwd());

async function main() {
  const allowMissingDatabase = process.argv.includes("--allow-missing-database");
  const result = await runFeedStatePrune({ allowMissingDatabase });
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "feed_state_prune_failed");
  process.exitCode = 1;
}).finally(async () => {
  await closeDb();
});
