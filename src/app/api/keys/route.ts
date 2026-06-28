import { NextRequest, NextResponse } from "next/server";

import { createApiKey, listApiKeys, type ApiKeyScope } from "@/server/api-keys";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json({ keys: await listApiKeys() });
  } catch (error) {
    return NextResponse.json({ error: msg(error, "keys_list_failed") }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  try {
    const scope: ApiKeyScope = {};
    if (Array.isArray(body.allowedTools) && body.allowedTools.length) {
      scope.allowedTools = body.allowedTools.filter((t: unknown) => typeof t === "string");
    }
    if (typeof body.maxSpendMotes === "string" && /^[1-9][0-9]*$/.test(body.maxSpendMotes)) {
      scope.maxSpendMotes = body.maxSpendMotes;
    }
    if (typeof body.expiresAt === "string" && !Number.isNaN(Date.parse(body.expiresAt))) {
      scope.expiresAt = body.expiresAt;
    }
    const result = await createApiKey({ name: typeof body.name === "string" ? body.name : undefined, scope });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: msg(error, "key_create_failed") }, { status: 400 });
  }
}

function msg(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
