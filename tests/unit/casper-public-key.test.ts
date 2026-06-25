import { describe, expect, it } from "vitest";

import { accountHashFromPublicKey, normalizeCasperPublicKey } from "@/lib/casper-public-key";
import { payerHash, publicKey } from "./browser-x402-signing-fixtures";

describe("Casper public key helpers", () => {
  it("normalizes Casper public keys from CSPR.click account state", () => {
    expect(normalizeCasperPublicKey(`0x${publicKey.toUpperCase()}`)).toBe(publicKey);
  });

  it("derives Casper account hashes from public keys", () => {
    expect(accountHashFromPublicKey(publicKey)).toBe(payerHash);
  });

  it("rejects malformed public keys without throwing", () => {
    expect(normalizeCasperPublicKey("0202")).toBeNull();
    expect(accountHashFromPublicKey("not-a-key")).toBeNull();
  });
});
