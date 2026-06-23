import { Args, CLValue } from "casper-js-sdk";
import { describe, expect, it } from "vitest";

import { buildProxyWasmArgs } from "../../src/server/cspr-trade/proxy-wasm";

const WCSPR_PACKAGE = "3d80df21ba4ee4d66a2a1f60c32570dd5685e4b279f6538162a5fd1314847c1e";

describe("buildProxyWasmArgs", () => {
  it("serializes WCSPR deposit proxy arguments", () => {
    const args = buildProxyWasmArgs({
      attachedValue: "15000000000",
      entryPoint: "deposit",
      innerArgs: Args.fromMap({
        attached_value: CLValue.newCLUInt512("15000000000"),
      }),
      packageHash: WCSPR_PACKAGE,
    });

    expect(args.getByName("package_hash")).toBeDefined();
    expect(args.getByName("entry_point")).toBeDefined();
    expect(args.getByName("args")).toBeDefined();
    expect(args.getByName("attached_value")).toBeDefined();
    expect(args.getByName("amount")).toBeDefined();
    expect(args.toBytes().length).toBeGreaterThan(0);
  });

  it("rejects invalid package hashes before building a transaction", () => {
    expect(() =>
      buildProxyWasmArgs({
        attachedValue: "15000000000",
        entryPoint: "deposit",
        innerArgs: Args.fromMap({}),
        packageHash: "not-a-hash",
      }),
    ).toThrow("Expected an even-length hex package hash");
  });
});
