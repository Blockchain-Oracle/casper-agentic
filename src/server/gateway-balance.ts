import { normalizeCasperAccountHash } from "./casper-account";
import { CsprCloudClient } from "./cspr-cloud";
import { requireIntegrationConfig } from "./env";
import { getConfiguredSignerAddress } from "./x402-payment";

// Real funding readiness for the gateway settlement wallet (the env-PEM signer).
// The signer pays WCSPR (the asset) + CSPR (gas) per settle; the payee is the
// deposit address users fund. All reads are live CSPR.cloud — never mocked.
const MIN_GAS_MOTES = BigInt("5000000000");
const BALANCE_LOOKUP_TIMEOUT_MS = 2500;

export async function getGatewayBalance() {
  const config = requireIntegrationConfig();
  const accountHash = normalizeCasperAccountHash(getConfiguredSignerAddress(config));
  const perCall = config.paymentAmount;
  const payee = normalizeCasperAccountHash(config.payeeAccountHash);

  try {
    const { account, ownerships } = await withTimeout(async () => {
      const csprCloud = new CsprCloudClient(config);
      const account = await csprCloud.getAccount(accountHash);
      const ownerships = await csprCloud.getFTOwnerships(account.account_hash, config.paymentAsset);
      return { account, ownerships };
    });
    const wcspr = ownerships[0]?.balance ?? "0";
    const csprGas = account.balance ?? "0";
    const ready = BigInt(wcspr) >= BigInt(perCall) && BigInt(csprGas) >= MIN_GAS_MOTES;

    return {
      accountHash,
      asset: config.paymentAsset,
      assetSymbol: config.paymentAssetSymbol,
      balanceUnavailable: false,
      chainName: config.casperNetwork.replace("casper:", ""),
      csprGas,
      depositPaymentAmount: config.wcsprDepositPaymentAmount,
      payee,
      perCall,
      ready,
      wcspr,
    };
  } catch (error) {
    return {
      accountHash,
      asset: config.paymentAsset,
      assetSymbol: config.paymentAssetSymbol,
      balanceUnavailable: true,
      balanceUnavailableReason: error instanceof Error ? error.message : "live balance lookup failed",
      chainName: config.casperNetwork.replace("casper:", ""),
      csprGas: "0",
      depositPaymentAmount: config.wcsprDepositPaymentAmount,
      payee,
      perCall,
      ready: false,
      wcspr: "0",
    };
  }
}

async function withTimeout<T>(work: () => Promise<T>): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      work(),
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => reject(new Error("live balance lookup timed out")), BALANCE_LOOKUP_TIMEOUT_MS);
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}
