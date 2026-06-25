import { loadEnvConfig } from "@next/env";
import { HttpHandler, KeyAlgorithm, PrivateKey, RpcClient, makeCep18TransferTransaction, makeCsprTransferTransaction } from "casper-js-sdk";

import { closeDb } from "../src/db/client";
import { accountHashFromPublicKey, normalizeCasperPublicKey } from "../src/lib/casper-public-key";
import { CsprCloudClient } from "../src/server/cspr-cloud";
import { requireIntegrationConfig } from "../src/server/env";
import { wrapWcsprForSigner } from "../src/server/wcspr-wrap";
import { readSignerPem } from "../src/server/x402-payment";

loadEnvConfig(process.cwd());

const ZERO = BigInt(0);
const CSPR_MOTES = BigInt(1_000_000_000);
const MIN_NATIVE_TRANSFER = BigInt(2_500_000_000);
const NATIVE_TRANSFER_PAYMENT = "100000000";
const CEP18_TRANSFER_PAYMENT = process.env.CASPER_WCSPR_TRANSFER_PAYMENT_AMOUNT ?? "10000000000";
type IntegrationConfig = ReturnType<typeof requireIntegrationConfig>;
interface BalanceSnapshot { assetBalance: bigint; gasBalance: bigint }
interface TransferInput { amount: bigint; config: IntegrationConfig; privateKey: PrivateKey; recipientPublicKey: string }

async function main() {
  const publicKey = normalizeCasperPublicKey(process.argv[2] ?? process.env.CASPER_BROWSER_PUBLIC_KEY);
  if (!publicKey) throw new Error("Usage: pnpm fund:browser-wallet <casper-public-key>");

  const accountHash = accountHashFromPublicKey(publicKey);
  if (!accountHash) throw new Error("Could not derive account hash from browser public key");

  const config = requireIntegrationConfig();
  const targetGas = parseMotes(process.env.CASPER_BROWSER_FUND_CSPR_AMOUNT ?? "10000000000", "gas target");
  const targetWcspr = parseMotes(
    process.env.CASPER_BROWSER_FUND_WCSPR_AMOUNT ?? (BigInt(config.paymentAmount) * BigInt(2)).toString(),
    "WCSPR target",
  );
  const csprCloud = new CsprCloudClient(config);
  const signer = signerKey(config);
  const signerHash = signer.publicKey.accountHash().toHex();

  let browser = await balances(csprCloud, accountHash, config.paymentAsset);
  const signerBefore = await balances(csprCloud, signerHash, config.paymentAsset);
  const transactions: Record<string, unknown>[] = [];

  if (browser.gasBalance < targetGas) {
    const amount = maxBigInt(targetGas - browser.gasBalance, MIN_NATIVE_TRANSFER);
    transactions.push(await submitCsprTransfer({ amount, config, privateKey: signer, recipientPublicKey: publicKey }));
    browser = await waitForBalance(csprCloud, accountHash, config.paymentAsset, { gasBalance: targetGas });
  }

  let signerBalances = await balances(csprCloud, signerHash, config.paymentAsset);
  const wcsprNeeded = targetWcspr > browser.assetBalance ? targetWcspr - browser.assetBalance : ZERO;
  if (wcsprNeeded > ZERO && signerBalances.assetBalance < wcsprNeeded) {
    transactions.push({ kind: "wcspr-wrap", ...(await wrapWcsprForSigner()) });
    signerBalances = await balances(csprCloud, signerHash, config.paymentAsset);
  }

  if (wcsprNeeded > ZERO) {
    if (signerBalances.assetBalance < wcsprNeeded) {
      throw new Error(`Signer WCSPR balance is still below required transfer amount ${wcsprNeeded.toString()}`);
    }
    transactions.push(await submitCep18Transfer({ amount: wcsprNeeded, config, privateKey: signer, recipientPublicKey: publicKey }));
    browser = await waitForBalance(csprCloud, accountHash, config.paymentAsset, { assetBalance: targetWcspr });
  }

  const signerAfter = await balances(csprCloud, signerHash, config.paymentAsset);
  console.log(
    JSON.stringify(
      {
        accountHash,
        browser: presentBalances(browser),
        signer: { after: presentBalances(signerAfter), before: presentBalances(signerBefore) },
        transactions,
        x402Address: `00${accountHash}`,
      },
      null,
      2,
    ),
  );
}

function signerKey(config: IntegrationConfig) {
  const algorithm = config.signerKeyAlgo === "ed25519" ? KeyAlgorithm.ED25519 : KeyAlgorithm.SECP256K1;
  return PrivateKey.fromPem(readSignerPem(config), algorithm);
}

async function submitCsprTransfer(input: TransferInput) {
  const rpcClient = new RpcClient(new HttpHandler(input.config.casperNodeRpcUrl));
  const status = await rpcClient.getStatus();
  const transaction = makeCsprTransferTransaction({
    casperNetworkApiVersion: status.apiVersion,
    chainName: "casper-test",
    gasPrice: 1,
    paymentAmount: NATIVE_TRANSFER_PAYMENT,
    recipientPublicKeyHex: input.recipientPublicKey,
    senderPublicKeyHex: input.privateKey.publicKey.toHex(),
    transferAmount: input.amount.toString(),
    ttl: 1_800_000,
  });
  return submitTransaction(rpcClient, transaction, input.privateKey, "native-cspr");
}

async function submitCep18Transfer(input: TransferInput) {
  const rpcClient = new RpcClient(new HttpHandler(input.config.casperNodeRpcUrl));
  const status = await rpcClient.getStatus();
  const transaction = makeCep18TransferTransaction({
    casperNetworkApiVersion: status.apiVersion,
    chainName: "casper-test",
    contractPackageHash: input.config.paymentAsset,
    gasPrice: 1,
    paymentAmount: CEP18_TRANSFER_PAYMENT,
    recipientPublicKeyHex: input.recipientPublicKey,
    senderPublicKeyHex: input.privateKey.publicKey.toHex(),
    transferAmount: input.amount.toString(),
    ttl: 1_800_000,
  });
  return submitTransaction(rpcClient, transaction, input.privateKey, "wcspr-transfer");
}

async function submitTransaction(rpcClient: RpcClient, transaction: { sign(key: PrivateKey): void }, privateKey: PrivateKey, kind: string) {
  transaction.sign(privateKey);
  const submitted = await rpcClient.putTransaction(transaction as Parameters<RpcClient["putTransaction"]>[0]);
  const transactionHash = submitted.transactionHash.toHex();
  const confirmed = await rpcClient.waitForTransaction(
    transaction as Parameters<RpcClient["waitForTransaction"]>[0],
    180_000,
  );
  const errorMessage = confirmed.executionInfo?.executionResult.errorMessage;
  if (errorMessage) throw new Error(`${kind} transaction failed: ${errorMessage}`);
  return { explorerUrl: `https://testnet.cspr.live/transaction/${transactionHash}`, kind, transactionHash };
}

async function balances(client: CsprCloudClient, accountHash: string, packageHash: string) {
  try {
    const [account, ownerships] = await Promise.all([
      client.getAccount(accountHash),
      client.getFTOwnerships(accountHash, packageHash),
    ]);
    return {
      assetBalance: BigInt(ownerships[0]?.balance ?? "0"),
      gasBalance: BigInt(account.balance ?? "0"),
    };
  } catch {
    return { assetBalance: ZERO, gasBalance: ZERO };
  }
}

async function waitForBalance(client: CsprCloudClient, accountHash: string, packageHash: string, expected: Partial<BalanceSnapshot>) {
  let latest = await balances(client, accountHash, packageHash);
  for (let attempt = 0; attempt < 24 && !meets(latest, expected); attempt += 1) {
    await delay(5_000);
    latest = await balances(client, accountHash, packageHash);
  }
  return latest;
}

function meets(actual: BalanceSnapshot, expected: Partial<BalanceSnapshot>) {
  return (
    (expected.assetBalance === undefined || actual.assetBalance >= expected.assetBalance) &&
    (expected.gasBalance === undefined || actual.gasBalance >= expected.gasBalance)
  );
}

function presentBalances(input: BalanceSnapshot) {
  return {
    gas: formatCspr(input.gasBalance),
    gasMotes: input.gasBalance.toString(),
    wcspr: formatCspr(input.assetBalance),
    wcsprAtomic: input.assetBalance.toString(),
  };
}

function parseMotes(value: string, label: string) {
  if (!/^[1-9][0-9]*$/.test(value)) throw new Error(`${label} must be a positive integer string`);
  return BigInt(value);
}

function formatCspr(motes: bigint) {
  const whole = motes / CSPR_MOTES;
  const fraction = (motes % CSPR_MOTES).toString().padStart(9, "0").replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : whole.toString();
}

function maxBigInt(left: bigint, right: bigint) {
  return left > right ? left : right;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}).finally(async () => {
  await closeDb();
});
