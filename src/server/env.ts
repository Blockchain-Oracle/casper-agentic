export const DEFAULT_CASPER_NETWORK = "casper:casper-test";
export const DEFAULT_CASPER_NODE_RPC_URL = "https://node.testnet.casper.network/rpc";
export const DEFAULT_CSPR_CLOUD_REST_BASE_URL = "https://api.testnet.cspr.cloud";
export const DEFAULT_CSPR_CLOUD_STREAMING_BASE_URL = "wss://streaming.testnet.cspr.cloud";
export const DEFAULT_FACILITATOR_URL = "https://x402-facilitator.cspr.cloud";
export const DEFAULT_MCP_URL = "https://mcp.cspr.trade/mcp";
export const DEFAULT_WCSPR_PACKAGE = "3d80df21ba4ee4d66a2a1f60c32570dd5685e4b279f6538162a5fd1314847c1e";

export interface RuntimeConfig {
  casperNetwork: string;
  casperNodeRpcUrl: string;
  csprCloudApiKey?: string;
  csprCloudRestBaseUrl: string;
  csprCloudStreamingBaseUrl: string;
  facilitatorUrl: string;
  mcpUrl: string;
  paymentAsset: string;
  paymentAssetDecimals: number;
  paymentAssetName: string;
  paymentAssetSymbol: string;
  paymentAmount: string;
  paymentTimeoutSeconds: number;
  payeeAccountHash?: string;
  signerKeyAlgo: "ed25519" | "secp256k1";
  signerPrivateKeyPem?: string;
  signerPrivateKeyPemPath?: string;
  wcsprDepositPaymentAmount: string;
  wcsprWrapAmount: string;
}

export type IntegrationRuntimeConfig = RuntimeConfig & {
  csprCloudApiKey: string;
  payeeAccountHash: string;
} & ({ signerPrivateKeyPem: string } | { signerPrivateKeyPemPath: string });

export function getRuntimeConfig(): RuntimeConfig {
  return {
    casperNetwork: process.env.CASPER_NETWORK ?? DEFAULT_CASPER_NETWORK,
    casperNodeRpcUrl: process.env.CASPER_NODE_RPC_URL ?? DEFAULT_CASPER_NODE_RPC_URL,
    csprCloudApiKey: optional(process.env.CSPR_CLOUD_API_KEY),
    csprCloudRestBaseUrl: process.env.CSPR_CLOUD_REST_BASE_URL ?? DEFAULT_CSPR_CLOUD_REST_BASE_URL,
    csprCloudStreamingBaseUrl: process.env.CSPR_CLOUD_STREAMING_BASE_URL ?? DEFAULT_CSPR_CLOUD_STREAMING_BASE_URL,
    facilitatorUrl: process.env.CSPR_X402_FACILITATOR_URL ?? DEFAULT_FACILITATOR_URL,
    mcpUrl: process.env.CSPR_TRADE_MCP_URL ?? DEFAULT_MCP_URL,
    paymentAsset: process.env.CASPER_PAYMENT_ASSET_PACKAGE ?? DEFAULT_WCSPR_PACKAGE,
    paymentAssetDecimals: numberEnv("CASPER_PAYMENT_ASSET_DECIMALS", 9),
    paymentAssetName: unquote(process.env.CASPER_PAYMENT_ASSET_NAME) ?? "Wrapped CSPR",
    paymentAssetSymbol: unquote(process.env.CASPER_PAYMENT_ASSET_SYMBOL) ?? "WCSPR",
    paymentAmount: process.env.CASPER_PAYMENT_AMOUNT ?? "7500000000",
    paymentTimeoutSeconds: numberEnv("CASPER_PAYMENT_TIMEOUT_SECONDS", 900),
    payeeAccountHash: optional(process.env.CASPER_PAYEE_ACCOUNT_HASH),
    signerKeyAlgo: signerAlgo(process.env.CASPER_TESTNET_SIGNER_KEY_ALGO),
    signerPrivateKeyPem: optional(process.env.CASPER_TESTNET_SIGNER_PRIVATE_KEY_PEM),
    signerPrivateKeyPemPath: optional(process.env.CASPER_TESTNET_SIGNER_PRIVATE_KEY_PEM_PATH),
    wcsprDepositPaymentAmount: process.env.CASPER_WCSPR_DEPOSIT_PAYMENT_AMOUNT ?? "5000000000",
    wcsprWrapAmount: process.env.CASPER_WCSPR_WRAP_AMOUNT ?? "15000000000",
  };
}

export function requireIntegrationConfig(): IntegrationRuntimeConfig {
  const config = getRuntimeConfig();
  const missing = getIntegrationConfigStatus(config).missing;

  if (missing.length) {
    throw new Error(`Missing integration configuration: ${missing.join(", ")}`);
  }
  return config as IntegrationRuntimeConfig;
}

export function getIntegrationConfigStatus(config = getRuntimeConfig()) {
  const missing = [];
  if (!config.csprCloudApiKey) missing.push("CSPR_CLOUD_API_KEY");
  if (!process.env.DATABASE_URL) missing.push("DATABASE_URL");
  if (!config.payeeAccountHash) missing.push("CASPER_PAYEE_ACCOUNT_HASH");
  if (!config.signerPrivateKeyPem && !config.signerPrivateKeyPemPath) {
    missing.push("CASPER_TESTNET_SIGNER_PRIVATE_KEY_PEM or CASPER_TESTNET_SIGNER_PRIVATE_KEY_PEM_PATH");
  }
  return { configured: missing.length === 0, missing };
}

function numberEnv(name: string, fallback: number) {
  const value = process.env[name];
  if (!value) return fallback;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) throw new Error(`${name} must be a number`);
  return numeric;
}

function optional(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

// The x402 EIP-712 domain is signed over the asset name/symbol, so a stray pair of
// surrounding quotes (e.g. a Vercel env value entered as "Wrapped CSPR") corrupts the
// domain separator and every settle reverts with WCSPR User error 37003. Strip one
// matching outer quote pair so a quoted env value can never poison the signature.
function unquote(value: string | undefined) {
  const trimmed = optional(value);
  if (!trimmed) return undefined;
  const unwrapped = trimmed.replace(/^(['"])([\s\S]*)\1$/, "$2").trim();
  return unwrapped ? unwrapped : undefined;
}

function signerAlgo(value: string | undefined): "ed25519" | "secp256k1" {
  return value === "ed25519" ? "ed25519" : "secp256k1";
}
