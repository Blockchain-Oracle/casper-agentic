import { Args, CLValue, HttpHandler, KeyAlgorithm, PrivateKey, RpcClient, SessionBuilder } from "casper-js-sdk";
import { readFile } from "node:fs/promises";

import { CsprCloudClient } from "./cspr-cloud";
import { requireIntegrationConfig } from "./env";
import { buildProxyWasmArgs } from "./cspr-trade/proxy-wasm";
import { readSignerPem } from "./x402-payment";

const PROXY_WASM_URL = new URL("./cspr-trade/assets/proxy_caller.wasm", import.meta.url);
const CSPR_MOTES = BigInt(1_000_000_000);

export async function wrapWcsprForSigner() {
  const config = requireIntegrationConfig();
  if (config.casperNetwork !== "casper:casper-test") {
    throw new Error(`WCSPR wrap command only supports casper:casper-test, got ${config.casperNetwork}`);
  }

  const amount = parsePositiveMotes(config.wcsprWrapAmount, "CASPER_WCSPR_WRAP_AMOUNT");
  const payment = parsePositiveMotes(
    config.wcsprDepositPaymentAmount,
    "CASPER_WCSPR_DEPOSIT_PAYMENT_AMOUNT",
  );
  const privateKey = signerKey(config);
  const accountHash = privateKey.publicKey.accountHash().toHex();
  const csprCloud = new CsprCloudClient(config);
  const before = await balances(csprCloud, accountHash, config.paymentAsset);
  const requiredGas = amount + payment;

  if (before.gasBalance < requiredGas) {
    throw new Error(
      `Signer needs at least ${formatCspr(requiredGas)} CSPR for wrap amount plus gas; current balance is ${formatCspr(
        before.gasBalance,
      )} CSPR`,
    );
  }

  const wasmBytes = await readFile(PROXY_WASM_URL);
  const innerArgs = Args.fromMap({
    attached_value: CLValue.newCLUInt512(amount.toString()),
  });
  const transaction = new SessionBuilder()
    .from(privateKey.publicKey)
    .wasm(new Uint8Array(wasmBytes))
    .installOrUpgrade()
    .runtimeArgs(
      buildProxyWasmArgs({
        attachedValue: amount.toString(),
        entryPoint: "deposit",
        innerArgs,
        packageHash: config.paymentAsset,
      }),
    )
    .chainName("casper-test")
    .payment(Number(payment))
    .ttl(1_800_000)
    .build();

  transaction.sign(privateKey);

  const rpcClient = new RpcClient(new HttpHandler(config.casperNodeRpcUrl));
  const submitted = await rpcClient.putTransaction(transaction);
  const transactionHash = submitted.transactionHash.toHex();
  const confirmed = await rpcClient.waitForTransaction(transaction, 180_000);
  const errorMessage = confirmed.executionInfo?.executionResult.errorMessage;
  if (errorMessage) throw new Error(`WCSPR deposit transaction failed: ${errorMessage}`);

  const expectedAssetBalance = before.assetBalance + amount;
  const after = await waitForWcsprBalance(csprCloud, accountHash, config.paymentAsset, expectedAssetBalance);
  if (after.assetBalance < expectedAssetBalance) {
    throw new Error(
      `WCSPR deposit confirmed but CSPR.cloud did not index the expected balance before timeout; expected at least ${expectedAssetBalance.toString()} and found ${after.assetBalance.toString()}`,
    );
  }

  return {
    accountHash,
    after: {
      gasBalance: after.gasBalance.toString(),
      wcsprBalance: after.assetBalance.toString(),
    },
    before: {
      gasBalance: before.gasBalance.toString(),
      wcsprBalance: before.assetBalance.toString(),
    },
    explorerUrl: `https://testnet.cspr.live/transaction/${transactionHash}`,
    transactionHash,
    wrappedAmount: amount.toString(),
  };
}

function signerKey(config: ReturnType<typeof requireIntegrationConfig>) {
  const algorithm = config.signerKeyAlgo === "ed25519" ? KeyAlgorithm.ED25519 : KeyAlgorithm.SECP256K1;
  return PrivateKey.fromPem(readSignerPem(config), algorithm);
}

async function balances(client: CsprCloudClient, accountHash: string, packageHash: string) {
  const [account, ownerships] = await Promise.all([
    client.getAccount(accountHash),
    client.getFTOwnerships(accountHash, packageHash),
  ]);
  return {
    assetBalance: BigInt(ownerships[0]?.balance ?? "0"),
    gasBalance: BigInt(account.balance ?? "0"),
  };
}

async function waitForWcsprBalance(
  client: CsprCloudClient,
  accountHash: string,
  packageHash: string,
  expected: bigint,
) {
  let latest = await balances(client, accountHash, packageHash);
  for (let attempt = 0; attempt < 18 && latest.assetBalance < expected; attempt += 1) {
    await delay(5_000);
    latest = await balances(client, accountHash, packageHash);
  }
  return latest;
}

function parsePositiveMotes(value: string, name: string) {
  if (!/^[1-9][0-9]*$/.test(value)) throw new Error(`${name} must be a positive integer string`);
  return BigInt(value);
}

function formatCspr(motes: bigint) {
  const whole = motes / CSPR_MOTES;
  const fraction = (motes % CSPR_MOTES).toString().padStart(9, "0").replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : whole.toString();
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
