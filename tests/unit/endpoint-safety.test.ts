import { describe, expect, it } from "vitest";

import { assertSafeMcpEndpoint } from "@/server/endpoint-safety";

describe("MCP endpoint safety", () => {
  it("requires HTTPS", async () => {
    await expect(assertSafeMcpEndpoint("http://mcp.cspr.trade/mcp", publicResolver)).rejects.toThrow(
      "MCP endpoint must use HTTPS",
    );
  });

  it("rejects hostname credentials", async () => {
    await expect(assertSafeMcpEndpoint("https://user:pass@mcp.cspr.trade/mcp", publicResolver)).rejects.toThrow(
      "must not contain credentials",
    );
  });

  it("rejects localhost and blocked resolved addresses", async () => {
    await expect(assertSafeMcpEndpoint("https://localhost/mcp", publicResolver)).rejects.toThrow(
      "host is not allowed",
    );
    await expect(
      assertSafeMcpEndpoint("https://mcp.example/mcp", async () => [{ address: "127.0.0.1", family: 4 }]),
    ).rejects.toThrow("blocked address");
  });

  it("rejects IPv4-mapped IPv6 addresses in blocked ranges", async () => {
    for (const address of ["::ffff:172.16.0.1", "::ffff:169.254.169.254", "::ffff:100.64.0.1", "::ffff:ac10:0001"]) {
      await expect(
        assertSafeMcpEndpoint("https://mcp.example/mcp", async () => [{ address, family: 6 }]),
      ).rejects.toThrow("blocked address");
    }
  });

  it("accepts a public HTTPS endpoint", async () => {
    const url = await assertSafeMcpEndpoint("https://mcp.cspr.trade/mcp", publicResolver);

    expect(url.href).toBe("https://mcp.cspr.trade/mcp");
  });
});

async function publicResolver() {
  return [{ address: "104.18.1.1", family: 4 as const }];
}
