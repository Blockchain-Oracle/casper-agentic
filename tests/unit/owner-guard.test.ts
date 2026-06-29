import { KeyAlgorithm, PrivateKey } from "casper-js-sdk";
import { beforeAll, describe, expect, it } from "vitest";

import { ownerDecision, readOwnerFromRequest } from "@/server/owner-guard";
import { OWNER_SESSION_COOKIE, createOwnerSession } from "@/server/wallet-session";

beforeAll(() => {
  process.env.CASPER_GW_SESSION_SECRET = "test-session-secret-please-change-0123456789";
});

function ownerOf() {
  const key = PrivateKey.generate(KeyAlgorithm.ED25519);
  return createOwnerSession(key.publicKey.toHex())!;
}

describe("owner-guard ownerDecision (one consistent rule)", () => {
  it("reads the owner identity from a session cookie", () => {
    const session = ownerOf();
    const headers = new Headers({ cookie: `${OWNER_SESSION_COOKIE}=${session.token}; other=x` });
    const identity = readOwnerFromRequest(new Request("https://gw.test/api", { headers }));
    expect(identity?.publicKey).toBe(session.identity.publicKey);
  });

  it("claims an unowned record for a signed-in wallet", () => {
    const session = ownerOf();
    expect(ownerDecision(session.identity, null)).toBe("claim");
  });

  it("allows the owner on a record they own", () => {
    const session = ownerOf();
    expect(ownerDecision(session.identity, session.identity.publicKey)).toBe("allow");
  });

  it("rejects a different wallet on an owned record (403)", () => {
    const owner = ownerOf();
    const intruder = ownerOf();
    try {
      ownerDecision(intruder.identity, owner.identity.publicKey);
      expect.unreachable("should have thrown");
    } catch (error) {
      expect((error as { status?: number }).status).toBe(403);
    }
  });

  it("rejects when not signed in (401) — same for owned and unowned", () => {
    const owner = ownerOf();
    expect(() => ownerDecision(null, owner.identity.publicKey)).toThrow();
    try {
      ownerDecision(null, null);
      expect.unreachable("should have thrown");
    } catch (error) {
      expect((error as { status?: number }).status).toBe(401);
    }
  });
});
