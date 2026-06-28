import { normalizeCasperAccountHash } from "./casper-account";
import { CsprCloudClient } from "./cspr-cloud";
import { requireIntegrationConfig } from "./env";
import { getConfiguredSignerAddress } from "./x402-payment";

// Real funding readiness for the gateway settlement wallet (the env-PEM signer).
// The signer pays WCSPR (the asset) + CSPR (gas) per settle; the payee is the
// deposit address users fund. All reads are live CSPR.cloud — never mocked.
const MIN_GAS_MOTES = BigInt("5000000000");

export async function getGatewayBalance() {
  const config = requireIntegrationConfig();
  const csprCloud = new CsprCloudClient(config);
  const accountHash = normalizeCasperAccountHash(getConfiguredSignerAddress(config));
  const account = await csprCloud.getAccount(accountHash);
  const ownerships = await csprCloud.getFTOwnerships(account.account_hash, config.paymentAsset);

  const wcspr = ownerships[0]?.balance ?? "0";
  const csprGas = account.balance ?? "0";
  const perCall = config.paymentAmount;
  const ready = BigInt(wcspr) >= BigInt(perCall) && BigInt(csprGas) >= MIN_GAS_MOTES;

  return {
    accountHash,
    csprGas,
    payee: normalizeCasperAccountHash(config.payeeAccountHash),
    perCall,
    ready,
    wcspr,
  };
}
