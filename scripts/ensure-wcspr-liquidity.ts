import { loadEnvConfig } from "@next/env";

import { closeDb } from "../src/db/client";
import { getGatewayBalance } from "../src/server/gateway-balance";
import { wrapWcsprForSigner } from "../src/server/wcspr-wrap";

loadEnvConfig(process.cwd());

const DEFAULT_MIN_BALANCE = "75000000000";
const DEFAULT_TARGET_BALANCE = "150000000000";

async function main() {
  const minBalance = parseMotes(process.env.CASPER_WCSPR_MIN_BALANCE ?? DEFAULT_MIN_BALANCE, "CASPER_WCSPR_MIN_BALANCE");
  const targetBalance = parseMotes(process.env.CASPER_WCSPR_TARGET_BALANCE ?? DEFAULT_TARGET_BALANCE, "CASPER_WCSPR_TARGET_BALANCE");
  if (targetBalance < minBalance) throw new Error("CASPER_WCSPR_TARGET_BALANCE must be greater than or equal to CASPER_WCSPR_MIN_BALANCE");

  const before = await getGatewayBalance();
  if (before.balanceUnavailable) {
    throw new Error(`Gateway balance unavailable: ${before.balanceUnavailableReason ?? "unknown reason"}`);
  }

  const current = BigInt(before.wcspr);
  if (current >= minBalance) {
    console.log(JSON.stringify({
      accountHash: before.accountHash,
      csprGas: before.csprGas,
      minBalance: minBalance.toString(),
      status: "ready",
      targetBalance: targetBalance.toString(),
      wcspr: before.wcspr,
    }, null, 2));
    return;
  }

  const wrapAmount = targetBalance - current;
  process.env.CASPER_WCSPR_WRAP_AMOUNT = wrapAmount.toString();
  const result = await wrapWcsprForSigner();
  console.log(JSON.stringify({
    ...result,
    minBalance: minBalance.toString(),
    status: "wrapped",
    targetBalance: targetBalance.toString(),
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}).finally(async () => {
  await closeDb();
});

function parseMotes(value: string, name: string) {
  if (!/^[1-9][0-9]*$/.test(value)) throw new Error(`${name} must be a positive integer string`);
  return BigInt(value);
}
