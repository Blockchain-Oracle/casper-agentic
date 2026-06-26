import { loadEnvConfig } from "@next/env";
import { NextRequest } from "next/server";

import { POST } from "../src/app/api/mcp/[sourceId]/route";
import { closeDb } from "../src/db/client";
import { normalizeCasperAccountHash } from "../src/server/casper-account";
import { requireIntegrationConfig } from "../src/server/env";
import { getReceiptDetail } from "../src/server/receipt-store";
import { getConfiguredSignerAddress } from "../src/server/x402-payment";
import { ensureAllowPolicy, ensureSignerWallet, isJsonRpcError, publishSmokeEndpoint, smokeBaseUrl } from "./smoke-support";

loadEnvConfig(process.cwd());

// Proves Trigger 3 (autonomous agent + API key): the caller sends ONLY a bearer
// token bound to a hosted wallet — no payment signature — and the Gateway
// server-signs the x402 payment, settling a real Casper Testnet deploy.
async function main() {
  const config = requireIntegrationConfig();
  const signerHash = normalizeCasperAccountHash(getConfiguredSignerAddress(config));
  const wallet = await ensureSignerWallet(signerHash, config.casperNetwork);
  await ensureAllowPolicy(wallet.id, signerHash, config);
  const endpoint = await publishSmokeEndpoint(config, { keyLabel: "Phase 8 server-signed smoke", walletId: wallet.id });
  const requestUrl = `${smokeBaseUrl()}/api/mcp/${endpoint.sourceId}`;

  const response = await POST(
    new NextRequest(requestUrl, {
      body: JSON.stringify({
        id: "server-signed-smoke-1",
        jsonrpc: "2.0",
        method: "tools/call",
        params: {
          arguments: { amount: "10", token_in: "CSPR", token_out: "WCSPR", type: "exact_in" },
          name: "get_quote",
        },
      }),
      headers: { authorization: `Bearer ${endpoint.token}`, "content-type": "application/json" },
      method: "POST",
    }),
    { params: Promise.resolve({ sourceId: endpoint.sourceId }) },
  );

  const body = await response.json();
  const receiptId = response.headers.get("x-casper-gw-receipt-id");
  const detail = receiptId ? await getReceiptDetail(receiptId) : undefined;
  console.log(
    JSON.stringify(
      {
        boundWalletId: endpoint.walletId,
        deployHash: detail?.receipt.hash,
        explorerUrl: detail?.receipt.hash ? `https://testnet.cspr.live/deploy/${detail.receipt.hash}` : undefined,
        httpStatus: response.status,
        receiptId,
        receiptStatus: detail?.receipt.status,
        trigger: "server-signed (agent + API key)",
      },
      null,
      2,
    ),
  );

  if (response.status !== 200 || !receiptId || detail?.receipt.status !== "settled" || !detail.receipt.hash || isJsonRpcError(body)) {
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
