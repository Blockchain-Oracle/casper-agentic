import { loadEnvConfig } from "@next/env";

import { closeDb } from "../src/db/client";
import { requireIntegrationConfig } from "../src/server/env";
import { runGatewayPaidCall } from "../src/server/live-paid-call";

loadEnvConfig(process.cwd());

// Override the target when the default tool isn't published on the resolved source:
//   SMOKE_TOOL=get_currencies SMOKE_ARGS='{}' pnpm smoke:live
const TOOL = process.env.SMOKE_TOOL ?? "get_quote";
const ARGS = process.env.SMOKE_ARGS
  ? (JSON.parse(process.env.SMOKE_ARGS) as Record<string, unknown>)
  : { amount: "10", token_in: "CSPR", token_out: "WCSPR", type: "exact_in" };

async function main() {
  const config = requireIntegrationConfig();
  const result = await runGatewayPaidCall({
    args: ARGS,
    client: "smoke:live",
    endpointUrl: config.mcpUrl,
    toolName: TOOL,
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
