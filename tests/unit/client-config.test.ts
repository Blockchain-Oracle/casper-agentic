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
      endpointUrl: "https://gw.test/api/mcp/source-1",
    });

    expect(config).toContain("https://gw.test/api/mcp/source-1");
    expect(config).toContain("Bearer cgw_test_generated");
    expect(config).toContain('"method":"tools/list"');
  });

  it("uses mcp-remote header syntax for Claude Desktop bridge config", () => {
    const config = JSON.parse(
      clientConfig("claude", {
        clientToken: "cgw_test_generated",
        endpointUrl: "https://gw.test/api/mcp/source-1",
      }),
    );

    expect(config.mcpServers["casper-gw"].args).toEqual([
      "mcp-remote@latest",
      "https://gw.test/api/mcp/source-1",
      "--transport",
      "http-first",
      "--header",
      "Authorization:${CASPER_GW_MCP_AUTH_HEADER}",
    ]);
    expect(config.mcpServers["casper-gw"].env).toEqual({
      CASPER_GW_MCP_AUTH_HEADER: "Bearer cgw_test_generated",
    });
  });
});
