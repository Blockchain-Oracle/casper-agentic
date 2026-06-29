import { NextResponse } from "next/server";

import {
  OWNER_SESSION_COOKIE,
  buildSignInMessage,
  createOwnerSession,
  readNonceToken,
  verifyCasperMessageSignature,
} from "@/server/wallet-session";

export const dynamic = "force-dynamic";

// Complete wallet sign-in: verify the Casper message signature over the issued
// nonce, then set an HttpOnly session cookie. Identity/ownership only.
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const publicKey = typeof body.publicKey === "string" ? body.publicKey : "";
  const signatureHex = typeof body.signatureHex === "string" ? body.signatureHex : "";
  const nonceToken = typeof body.nonceToken === "string" ? body.nonceToken : "";

  const nonce = readNonceToken(nonceToken);
  if (!nonce) return NextResponse.json({ error: "nonce expired — request a new one" }, { status: 400 });

  const message = buildSignInMessage(nonce.nonce, nonce.exp);
  if (!verifyCasperMessageSignature({ message, publicKey, signatureHex })) {
    return NextResponse.json({ error: "signature did not verify for this wallet" }, { status: 401 });
  }

  const session = createOwnerSession(publicKey);
  if (!session) return NextResponse.json({ error: "owner sessions are not configured" }, { status: 503 });

  const response = NextResponse.json({ identity: session.identity });
  response.cookies.set(OWNER_SESSION_COOKIE, session.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });
  return response;
}
