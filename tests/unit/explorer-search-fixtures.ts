import type { ReceiptDetail } from "@/lib/types";

export const explorerDeployHash = "8ed4569fd13c26e28d2b1826d833e88ed821bb74aeec175980992a3ba6af0810";
export const explorerAccountHash = "2d9026c08b7be0d9e48e1f58a852c9a8ad6eb70f81580e59bbf5f6fe078c0b11";

export function explorerReceiptDetail(id: string): ReceiptDetail {
  return {
    casper: [],
    gateway: [],
    receipt: {
      amount: "7500000000",
      asset: "WCSPR",
      client: "phase-3-console",
      hash: id === explorerDeployHash ? explorerDeployHash : null,
      id,
      provider: "CSPR.trade MCP",
      status: "settled",
      time: "2026-06-23T12:00:00Z",
      tool: "get_quote",
      wallet: "account-hash-payer",
    },
    x402: [],
  };
}
