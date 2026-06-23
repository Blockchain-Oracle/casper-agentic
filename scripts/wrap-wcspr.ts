import { loadEnvConfig } from "@next/env";

import { closeDb } from "../src/db/client";
import { wrapWcsprForSigner } from "../src/server/wcspr-wrap";

loadEnvConfig(process.cwd());

async function main() {
  const result = await wrapWcsprForSigner();
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}).finally(async () => {
  await closeDb();
});
