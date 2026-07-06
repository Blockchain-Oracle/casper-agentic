import { KeyAlgorithm, PrivateKey } from "casper-js-sdk";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const createApiKey = vi.hoisted(() => vi.fn());
const listApiKeys = vi.hoisted(() => vi.fn());

vi.mock("@/server/api-keys", () => ({ createApiKey, listApiKeys }));

import { POST } from "@/app/api/keys/route";
import { OWNER_SESSION_COOKIE, createOwnerSession } from "@/server/wallet-session";

beforeAll(() => {
  process.env.CASPER_GW_SESSION_SECRET = "test-session-secret-please-change-0123456789";
});

beforeEach(() => {
  createApiKey.mockReset();
  createApiKey.mockResolvedValue({ token: "casper_test", key: { id: "k1" } });
});

function postKeys(cookie?: string) {
  return new Request("https://gw.test/api/keys", {
    body: JSON.stringify({ name: "My agent" }),
    headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) },
    method: "POST",
  });
}

describe("keys create route (owner-gated)", () => {
  it("rejects key creation without an owner session (401) so keys never vanish from the scoped list", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await POST(postKeys() as any);
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toMatch(/sign in/i);
    expect(createApiKey).not.toHaveBeenCalled();
  });

  it("creates a key bound to the signed-in owner", async () => {
    const wallet = PrivateKey.generate(KeyAlgorithm.ED25519);
    const session = createOwnerSession(wallet.publicKey.toHex())!;
    const response = await POST(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      postKeys(`${OWNER_SESSION_COOKIE}=${session.token}`) as any,
    );
    expect(response.status).toBe(201);
    expect(createApiKey).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "My agent",
        owner: expect.objectContaining({ publicKey: session.identity.publicKey }),
      }),
    );
  });
});
