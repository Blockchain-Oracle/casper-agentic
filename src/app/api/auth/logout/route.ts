import { NextResponse } from "next/server";

import { OWNER_SESSION_COOKIE } from "@/server/wallet-session";

export const dynamic = "force-dynamic";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(OWNER_SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return response;
}
