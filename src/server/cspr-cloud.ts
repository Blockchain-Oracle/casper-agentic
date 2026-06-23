import type { RuntimeConfig } from "./env";

interface CsprCloudResponse<T> {
  data: T;
}

export interface CsprCloudAccount {
  account_hash: string;
  balance: string;
  main_purse_uref: string;
  public_key?: string;
}

export interface CsprCloudDeploy {
  deploy_hash: string;
  block_hash?: string;
  block_height?: number;
  contract_package_hash?: string;
  cost?: string;
  error_message?: string | null;
  status: "pending" | "expired" | "processed" | string;
  timestamp?: string;
}

export interface CsprCloudFTOwnership {
  balance: string;
  contract_package_hash: string;
  owner_hash: string;
  owner_type: number;
}

export interface CsprCloudFTAction {
  amount: string;
  block_height: number;
  contract_package_hash: string;
  deploy_hash: string;
  from_hash: string | null;
  from_type: number;
  ft_action_type_id: number;
  timestamp: string;
  to_hash: string | null;
  to_type: number;
  transform_idx: number;
}

export class CsprCloudClient {
  constructor(private readonly config: Pick<RuntimeConfig, "csprCloudApiKey" | "csprCloudRestBaseUrl">) {}

  async getAccount(accountIdentifier: string) {
    return this.request<CsprCloudAccount>(`/accounts/${encodeURIComponent(accountIdentifier)}`);
  }

  async getDeploy(deployHash: string) {
    return this.request<CsprCloudDeploy>(`/deploys/${encodeURIComponent(deployHash)}`);
  }

  async getFTOwnerships(accountIdentifier: string, contractPackageHash: string) {
    const ownerships = await this.requestList<CsprCloudFTOwnership>(
      `/accounts/${encodeURIComponent(accountIdentifier)}/ft-token-ownership`,
    );
    return ownerships.filter((ownership) => ownership.contract_package_hash === contractPackageHash);
  }

  async getContractPackageTokenActions(contractPackageHash: string, deployHash?: string) {
    const params = new URLSearchParams();
    if (deployHash) params.set("deploy_hash", deployHash);
    const query = params.size ? `?${params.toString()}` : "";
    return this.requestList<CsprCloudFTAction>(
      `/contract-packages/${encodeURIComponent(contractPackageHash)}/ft-token-actions${query}`,
    );
  }

  async getTokenActions(params: { accountHash?: string; contractPackageHash?: string; deployHash?: string }) {
    const queryParams = new URLSearchParams();
    if (params.accountHash) queryParams.set("account_hash", params.accountHash);
    if (params.contractPackageHash) queryParams.set("contract_package_hash", params.contractPackageHash);
    if (params.deployHash) queryParams.set("deploy_hash", params.deployHash);
    const query = queryParams.size ? `?${queryParams.toString()}` : "";
    return this.requestList<CsprCloudFTAction>(`/ft-token-actions${query}`);
  }

  private async request<T>(path: string) {
    const response = await fetch(`${this.config.csprCloudRestBaseUrl}${path}`, {
      headers: this.headers(),
    });
    if (!response.ok) throw new Error(`CSPR.cloud ${path} failed with ${response.status}`);
    const body = (await response.json()) as CsprCloudResponse<T>;
    return body.data;
  }

  private async requestList<T>(path: string) {
    const response = await fetch(`${this.config.csprCloudRestBaseUrl}${path}`, {
      headers: this.headers(),
    });
    if (!response.ok) throw new Error(`CSPR.cloud ${path} failed with ${response.status}`);
    const body = (await response.json()) as { data: T[] };
    return body.data;
  }

  private headers() {
    if (!this.config.csprCloudApiKey) throw new Error("CSPR_CLOUD_API_KEY is required");
    return {
      accept: "application/json",
      authorization: this.config.csprCloudApiKey,
    };
  }
}
