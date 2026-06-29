import { NextResponse } from "next/server";

import { rediscoverSource } from "@/server/provider-store";

export const dynamic = "force-dynamic";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    return NextResponse.json(await rediscoverSource(id));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "rediscover_failed" }, { status: 502 });
  }
}
