import type { RuntimeConfig } from "./env";

interface CsprCloudResponse<T> {
  data: T;
}

interface CsprCloudPaginatedResponse<T> {
  data: T[];
  item_count: number;
  page_count: number;
}

export interface CsprCloudPaginatedResult<T> {
  data: T[];
  itemCount: number;
  page: number;
  pageCount: number;
  pageSize: number;
}

export interface CsprCloudAccount {
  account_hash: string;
  balance: string;
  cspr_name?: string | null;
  main_purse_uref: string;
  public_key?: string;
}

export interface CsprCloudNameResolution {
  is_primary?: boolean;
  name: string;
  resolved_hash: string;
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

export interface CsprCloudNativeTransfer {
  amount: string;
  deploy_hash: string;
  initiator_account_hash: string | null;
  to_account_hash: string | null;
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

  // Native CSPR transfers in a deploy (to_account_hash is the recipient account).
  async getDeployTransfers(deployHash: string) {
    return this.requestList<CsprCloudNativeTransfer>(`/deploys/${encodeURIComponent(deployHash)}/transfers`);
  }

  async getCsprNameResolution(name: string) {
    return this.request<CsprCloudNameResolution>(`/cspr-name-resolutions/${encodeURIComponent(name)}`);
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

  async getTokenActionsPage(params: {
    accountHash?: string;
    contractPackageHash?: string;
    deployHash?: string;
    page: number;
    pageSize: number;
  }): Promise<CsprCloudPaginatedResult<CsprCloudFTAction>> {
    const queryParams = new URLSearchParams();
    if (params.accountHash) queryParams.set("account_hash", params.accountHash);
    if (params.contractPackageHash) queryParams.set("contract_package_hash", params.contractPackageHash);
    if (params.deployHash) queryParams.set("deploy_hash", params.deployHash);
    queryParams.set("page", String(params.page));
    queryParams.set("page_size", String(params.pageSize));
    const result = await this.requestPaginatedList<CsprCloudFTAction>(`/ft-token-actions?${queryParams.toString()}`);
    return {
      data: result.data,
      itemCount: Number(result.item_count ?? 0),
      page: params.page,
      pageCount: Number(result.page_count ?? 0),
      pageSize: params.pageSize,
    };
  }

  private async request<T>(path: string) {
    const response = await fetch(`${this.config.csprCloudRestBaseUrl}${path}`, {
      headers: this.headers(),
    });
    if (!response.ok) throw new CsprCloudRequestError(path, response.status);
    const body = (await response.json()) as CsprCloudResponse<T>;
    return body.data;
  }

  private async requestList<T>(path: string) {
    const response = await fetch(`${this.config.csprCloudRestBaseUrl}${path}`, {
      headers: this.headers(),
    });
    if (!response.ok) throw new CsprCloudRequestError(path, response.status);
    const body = (await response.json()) as { data: T[] };
    return body.data;
  }

  private async requestPaginatedList<T>(path: string) {
    const response = await fetch(`${this.config.csprCloudRestBaseUrl}${path}`, {
      headers: this.headers(),
    });
    if (!response.ok) throw new CsprCloudRequestError(path, response.status);
    return (await response.json()) as CsprCloudPaginatedResponse<T>;
  }

  private headers() {
    if (!this.config.csprCloudApiKey) throw new Error("CSPR_CLOUD_API_KEY is required");
    return {
      accept: "application/json",
      authorization: this.config.csprCloudApiKey,
    };
  }
}

export class CsprCloudRequestError extends Error {
  constructor(
    readonly path: string,
    readonly status: number,
  ) {
    super(`CSPR.cloud ${path} failed with ${status}`);
  }
}
