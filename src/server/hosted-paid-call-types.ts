import type { HostedEndpointTool, HostedEndpointView } from "./hosted-endpoint";

export interface HostedPaidToolCallInput {
  args: Record<string, unknown>;
  endpoint: HostedEndpointView;
  paymentHeader: string;
  requestUrl: string;
  tool: HostedEndpointTool;
}

export type HostedPaidToolCallOutput =
  | {
      attemptId?: string;
      code: number;
      data?: Record<string, unknown>;
      kind: "error";
      message: string;
      paymentResponseHeader?: string;
      status: number;
    }
  | {
      attemptId: string;
      kind: "success";
      paymentResponseHeader: string;
      result: unknown;
    };
