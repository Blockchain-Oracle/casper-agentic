import { describe, expect, it } from "vitest";

import { amountToMotes, formatTokenAmount, parseTokenToMotes } from "@/lib/format-amount";

describe("format amount helpers", () => {
  it("formats raw motes and existing decimal fixture values", () => {
    expect(formatTokenAmount("7500000000")).toBe("7.5");
    expect(formatTokenAmount("0.05")).toBe("0.05");
  });

  it("parses token amounts into motes", () => {
    expect(parseTokenToMotes("7.5")).toBe("7500000000");
    expect(parseTokenToMotes("0.05")).toBe("50000000");
  });

  it("converts integer motes and decimal legacy amounts for aggregate totals", () => {
    expect(amountToMotes("7500000000")).toBe(BigInt("7500000000"));
    expect(amountToMotes("0.05")).toBe(BigInt("50000000"));
    expect(amountToMotes("not-an-amount")).toBe(BigInt(0));
  });
});
