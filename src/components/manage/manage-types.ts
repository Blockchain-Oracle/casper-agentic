import type { DiscoveredTool } from "@/lib/gateway-api";

export type ManageMode = "free" | "paid";

export type ManagedSource = {
  authMode: string;
  createdAt: string;
  credentialConfigured: boolean;
  endpointUrl: string;
  id: string;
  name: string;
  sourceType: string;
  updatedAt: string;
};

export type ManageTool = DiscoveredTool;
