import type { IntegrationRuntimeConfig } from "./env";
import { loadWalletKeyPem } from "./wallet-key-store";
import { type ClientCasperSigner, readSignerPem, signerFromPem } from "./x402-payment";

/**
 * Builds the Casper x402 signer for a selected wallet, by signing mode:
 *  - "hosted"      → decrypt the wallet's own stored key (Testnet hosted custody)
 *  - "test-signer" → the single env PEM (integration backstop; smoke tooling)
 * browser-wallet signs in the browser, so it has no server-side signer here.
 */
export async function buildSignerForWallet(
  config: IntegrationRuntimeConfig,
  wallet: { id: string; signingMode: string },
): Promise<ClientCasperSigner> {
  if (wallet.signingMode === "hosted") {
    const key = await loadWalletKeyPem(wallet.id);
    if (!key) throw new Error("hosted wallet has no stored signing key");
    return signerFromPem(key.pem, key.algorithm);
  }
  if (wallet.signingMode === "test-signer") {
    return signerFromPem(readSignerPem(config), config.signerKeyAlgo);
  }
  throw new Error(`wallet signing mode "${wallet.signingMode}" cannot be signed server-side`);
}
