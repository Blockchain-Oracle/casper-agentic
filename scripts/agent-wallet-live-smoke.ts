import { loadEnvConfig } from "@next/env";
import { NextRequest } from "next/server";

import { POST } from "../src/app/api/paid-calls/agent-wallet/route";
import { closeDb } from "../src/db/client";
import { normalizeCasperAccountHash } from "../src/server/casper-account";
import { requireIntegrationConfig } from "../src/server/env";
import { getReceiptDetail } from "../src/server/receipt-store";
import { getConfiguredSignerAddress } from "../src/server/x402-payment";
import { ensureAllowPolicy, ensureSignerWallet, publishSmokeEndpoint, smokeBaseUrl } from "./smoke-support";

loadEnvConfig(process.cwd());

// Proves Trigger 1 ("Pay with my agent wallet"): an operator-gated web action
// where the Gateway server-signs with the UI-selected wallet → real Testnet deploy.
async function main() {
  const config = requireIntegrationConfig();
  const operatorToken = process.env.CASPER_GW_OPERATOR_TOKEN;
  if (!operatorToken) throw new Error("CASPER_GW_OPERATOR_TOKEN is required");

  const signerHash = normalizeCasperAccountHash(getConfiguredSignerAddress(config));
  const wallet = await ensureSignerWallet(signerHash, config.casperNetwork);
  await ensureAllowPolicy(wallet.id, signerHash, config);
  const endpoint = await publishSmokeEndpoint(config);

  const response = await POST(
    new NextRequest(`${smokeBaseUrl()}/api/paid-calls/agent-wallet`, {
      body: JSON.stringify({
        args: { amount: "10", token_in: "CSPR", token_out: "WCSPR", type: "exact_in" },
        sourceId: endpoint.sourceId,
        toolName: "get_quote",
        walletId: wallet.id,
      }),
      headers: { "content-type": "application/json", "x-casper-gw-operator-token": operatorToken },
      method: "POST",
    }),
  );

  const body = await response.json().catch(() => ({}));
  const receiptId = response.headers.get("x-casper-gw-receipt-id") ?? body?.attemptId;
  const detail = receiptId ? await getReceiptDetail(receiptId) : undefined;
  console.log(
    JSON.stringify(
      {
        deployHash: detail?.receipt.hash,
        explorerUrl: detail?.receipt.hash ? `https://testnet.cspr.live/deploy/${detail.receipt.hash}` : undefined,
        httpStatus: response.status,
        receiptId,
        receiptStatus: detail?.receipt.status,
        trigger: "pay-with-agent-wallet (operator web action)",
        walletId: wallet.id,
      },
      null,
      2,
    ),
  );

  if (response.status !== 200 || !receiptId || detail?.receipt.status !== "settled" || !detail.receipt.hash) {
    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDb();
  });
