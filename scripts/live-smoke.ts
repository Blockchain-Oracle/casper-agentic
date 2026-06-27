import { loadEnvConfig } from "@next/env";

import { closeDb } from "../src/db/client";
import { requireIntegrationConfig } from "../src/server/env";
import { runGatewayPaidCall } from "../src/server/live-paid-call";

loadEnvConfig(process.cwd());

async function main() {
  const config = requireIntegrationConfig();
  const result = await runGatewayPaidCall({
    args: { amount: "10", token_in: "CSPR", token_out: "WCSPR", type: "exact_in" },
    client: "smoke:live",
    endpointUrl: config.mcpUrl,
    toolName: "get_quote",
  });
  console.log(JSON.stringify(result, null, 2));
  if (result.status !== "settled") process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDb();
  });
