import type { CsprCloudClient, CsprCloudDeploy, CsprCloudFTAction } from "./cspr-cloud";

export interface CasperProofLookupInput {
  asset: string;
  deployHash: string;
}

export type CasperProofLookupResult =
  | {
      deploy: CsprCloudDeploy;
      error?: never;
      ftAction?: CsprCloudFTAction;
    }
  | {
      deploy?: never;
      error: string;
      ftAction?: never;
    };

export async function resolveCasperProof(
  client: CsprCloudClient,
  input: CasperProofLookupInput,
): Promise<CasperProofLookupResult> {
  const attempts = positiveIntegerEnv("CASPER_PROOF_LOOKUP_ATTEMPTS", 6);
  const delayMs = nonNegativeIntegerEnv("CASPER_PROOF_LOOKUP_DELAY_MS", 5_000);
  let lastError = "CSPR.cloud deploy lookup did not complete";

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const [deploy, ftActions] = await Promise.all([
        client.getDeploy(input.deployHash),
        client.getContractPackageTokenActions(input.asset, input.deployHash),
      ]);
      return { deploy, ftAction: ftActions[0] };
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      if (attempt < attempts - 1 && delayMs > 0) await delay(delayMs);
    }
  }

  return { error: lastError };
}

function positiveIntegerEnv(name: string, fallback: number) {
  const value = process.env[name];
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) throw new Error(`${name} must be a positive integer`);
  return parsed;
}

function nonNegativeIntegerEnv(name: string, fallback: number) {
  const value = process.env[name];
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) throw new Error(`${name} must be a non-negative integer`);
  return parsed;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
