import { NextResponse } from "next/server";
import { receipts, tools, wallets } from "@/lib/fixtures";

export async function GET() {
  const blockedCount = receipts.filter((receipt) => receipt.status === "blocked").length;
  const settledWithProof = receipts.filter((receipt) => receipt.status === "settled" && receipt.hash).length;

  return NextResponse.json({
    stats: {
      activeProviders: 2,
      publishedTools: tools.filter((tool) => tool.published).length,
      agentWallets: wallets.length,
      receiptAttempts: receipts.length,
      blockedByPolicy: blockedCount,
      settledWithProof,
      liveProofVolume: "0.00 TUSDC",
    },
    latestReceipts: receipts.slice(0, 5),
  });
}
