import { buildExternalProofDetail } from "@/lib/external-proof-detail";
import type { ExplorerSearchResult, ExplorerSearchSource, ReceiptDetail } from "@/lib/types";
import { CsprCloudClient } from "./cspr-cloud";
import { getRuntimeConfig } from "./env";
import { getReceiptDetail, getReceiptDetailByDeployHash } from "./receipt-store";

export async function searchExplorer(rawQuery: string): Promise<ExplorerSearchResult> {
  const query = normalizeQuery(rawQuery);
  if (!query) return { message: "Enter a receipt id or deploy hash.", query, source: "not_found" };

  const receipt = await getReceiptDetail(query);
  if (receipt) return found("casper_gw_receipt", query, receipt, "Matched Casper GW receipt id.");

  if (!isDeployHash(query)) {
    return { message: "No Casper GW receipt matched that id. Deploy hash search requires a 64-character hex hash.", query, source: "not_found" };
  }

  const gatewayProof = await getReceiptDetailByDeployHash(query);
  if (gatewayProof) return found("casper_gw_receipt", query, gatewayProof, "Matched Casper GW deploy hash.");

  return lookupExternalDeploy(query);
}

function found(source: ExplorerSearchSource, query: string, detail: ReceiptDetail, message: string): ExplorerSearchResult {
  return { detail, message, query, source };
}

async function lookupExternalDeploy(deployHash: string): Promise<ExplorerSearchResult> {
  const config = getRuntimeConfig();
  if (!config.csprCloudApiKey) {
    return {
      message: "CSPR_CLOUD_API_KEY is required for external Casper proof lookup.",
      query: deployHash,
      source: "unconfigured",
    };
  }

  const client = new CsprCloudClient(config);
  try {
    const deploy = await client.getDeploy(deployHash);
    const ftActions = (await client.getContractPackageTokenActions(config.paymentAsset, deployHash)).filter(
      (action) =>
        action.deploy_hash.toLowerCase() === deployHash.toLowerCase() &&
        action.contract_package_hash.toLowerCase() === config.paymentAsset.toLowerCase(),
    );
    const detail = buildExternalProofDetail({
      deploy,
      explorerUrl: `https://testnet.cspr.live/deploy/${deploy.deploy_hash}`,
      ftActions,
      network: config.casperNetwork,
      paymentAsset: config.paymentAsset,
      paymentAssetSymbol: config.paymentAssetSymbol,
    });
    return found("external_casper_proof", deployHash, detail, "Resolved external Casper deploy proof from CSPR.cloud.");
  } catch {
    return { message: "No Casper GW receipt or external Casper deploy proof matched that hash.", query: deployHash, source: "not_found" };
  }
}

function normalizeQuery(query: string) {
  const trimmed = query.trim().replace(/^deploy:/i, "").replace(/^receipt:/i, "");
  return isDeployHash(trimmed) ? trimmed.toLowerCase() : trimmed;
}

function isDeployHash(query: string) {
  return /^[0-9a-f]{64}$/i.test(query);
}
