import { describe, expect, it } from "vitest";

import { clientConfig } from "@/lib/client-config";

describe("client config snippets", () => {
  it("use placeholders until a real scoped endpoint token is generated", () => {
    const config = clientConfig("cursor");

    expect(config).toContain("/api/mcp/{sourceId}");
    expect(config).toContain("<client-access-token>");
    expect(config).not.toContain("cgw_test_scoped");
    expect(config).not.toContain("gw.casper-gateway.io");
  });

  it("renders generated endpoint access values when provided", () => {
    const config = clientConfig("curl", {
      clientToken: "cgw_test_generated",
      endpointUrl: "/api/mcp/source-1",
    });

    expect(config).toContain("/api/mcp/source-1");
    expect(config).toContain("Bearer cgw_test_generated");
  });
});
