import { describe, expect, it } from "vitest";

import { formatAddress, formatReceiptId } from "@/lib/format-address";

const E = "…"; // …

describe("formatAddress", () => {
  it("truncates long values as lead…trail with a real ellipsis", () => {
    expect(formatAddress("0123456789abcdef")).toBe(`012345${E}cdef`);
  });

  it("honours custom lead/trail", () => {
    expect(formatAddress("01a2b9d4e8c0f1a2b3c4d5e6f7", { lead: 4, trail: 2 })).toBe(`01a2${E}f7`);
  });

  it("returns the whole value when it is not longer than lead+trail", () => {
    expect(formatAddress("01a2ef", { lead: 6, trail: 4 })).toBe("01a2ef");
  });

  it("applies an optional prefix", () => {
    expect(formatAddress("abcdef0123", { lead: 4, trail: 2, prefix: "account-hash-" })).toBe(`account-hash-abcd${E}23`);
  });

  it("returns the fallback for empty input", () => {
    expect(formatAddress("")).toBe("unknown");
    expect(formatAddress(undefined)).toBe("unknown");
    expect(formatAddress(null, { fallback: "none" })).toBe("none");
  });
});

describe("formatReceiptId", () => {
  it("keeps the prefix segment and truncates the body", () => {
    expect(formatReceiptId("rcpt_8f3a1b2c3d4e21c9")).toBe(`rcpt_8f3a${E}21c9`);
  });

  it("falls back to plain truncation when there is no prefix segment", () => {
    expect(formatReceiptId("8f3a1b2c3d4e21c9")).toBe(`8f3a1b${E}21c9`);
  });

  it("returns unknown for empty input", () => {
    expect(formatReceiptId("")).toBe("unknown");
  });
});
