import { NextRequest, NextResponse } from "next/server";

import { createApiKey, listApiKeys, type ApiKeyScope } from "@/server/api-keys";
import { readOwnerFromRequest } from "@/server/owner-guard";
import { ownerSessionsEnabled } from "@/server/wallet-session";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // Sessions off → unscoped (ops). On → only the signed-in wallet's keys; signed
    // out returns nothing rather than every key in the gateway.
    if (!ownerSessionsEnabled()) return NextResponse.json({ keys: await listApiKeys() });
    const owner = readOwnerFromRequest(request);
    return NextResponse.json({ keys: owner ? await listApiKeys(owner) : [] });
  } catch (error) {
    return NextResponse.json({ error: msg(error, "keys_list_failed") }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  try {
    // Sessions on → a key must belong to a signed-in wallet, or it would never
    // show up in the owner-scoped list again (create-then-vanish).
    const owner = readOwnerFromRequest(request);
    if (ownerSessionsEnabled() && !owner) {
      return NextResponse.json(
        { error: "Sign in with your wallet before creating a key" },
        { status: 401 },
      );
    }
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
    const result = await createApiKey({
      name: typeof body.name === "string" ? body.name : undefined,
      owner,
      scope,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: msg(error, "key_create_failed") }, { status: 400 });
  }
}

function msg(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
