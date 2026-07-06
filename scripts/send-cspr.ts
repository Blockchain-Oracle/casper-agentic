import { loadEnvConfig } from "@next/env";
import { HttpHandler, KeyAlgorithm, NativeTransferBuilder, PrivateKey, PublicKey, RpcClient } from "casper-js-sdk";

import { closeDb } from "../src/db/client";
import { requireIntegrationConfig } from "../src/server/env";
import { readSignerPem } from "../src/server/x402-payment";

loadEnvConfig(process.cwd());

// One-off: send native CSPR from the gateway signer (env PEM) to a target wallet.
//   SEND_CSPR_TARGET=<public-key-hex> SEND_CSPR_AMOUNT=<motes> pnpm tsx scripts/send-cspr.ts
const TARGET = process.env.SEND_CSPR_TARGET ?? "0202034f22ba451598257c05d09acb9e6b78127659f637a421b27ab321cfe214eb8d";
const AMOUNT = process.env.SEND_CSPR_AMOUNT ?? "10000000000"; // 10 CSPR

async function main() {
  const config = requireIntegrationConfig();
  const algorithm = config.signerKeyAlgo === "ed25519" ? KeyAlgorithm.ED25519 : KeyAlgorithm.SECP256K1;
  const privateKey = PrivateKey.fromPem(readSignerPem(config), algorithm);

  const transaction = new NativeTransferBuilder()
    .from(privateKey.publicKey)
    .target(PublicKey.fromHex(TARGET))
    .amount(AMOUNT)
    .chainName("casper-test")
    .payment(100_000_000)
    .build();
  transaction.sign(privateKey);

  const rpc = new RpcClient(new HttpHandler(config.casperNodeRpcUrl));
  const submitted = await rpc.putTransaction(transaction);
  const transactionHash = submitted.transactionHash.toHex();
  const confirmed = await rpc.waitForTransaction(transaction, 180_000);
  const error = confirmed.executionInfo?.executionResult.errorMessage;

  console.log(
    JSON.stringify(
      {
        amountMotes: AMOUNT,
        error: error ?? null,
        explorerUrl: `https://testnet.cspr.live/transaction/${transactionHash}`,
        from: privateKey.publicKey.accountHash().toHex(),
        to: TARGET,
        transactionHash,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDb();
  });
