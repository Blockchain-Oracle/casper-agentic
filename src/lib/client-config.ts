export type ConfigTab = "cursor" | "claude" | "curl";

export const endpointUrl = "https://gw.casper-gateway.io/mcp/make-software";
export const clientToken = "cgw_test_scoped_mcp_9fd2";

export function clientConfig(tab: ConfigTab) {
  if (tab === "cursor") {
    return JSON.stringify(
      {
        mcpServers: {
          "casper-gw": {
            url: endpointUrl,
            headers: {
              Authorization: `Bearer ${clientToken}`,
            },
          },
        },
      },
      null,
      2,
    );
  }

  if (tab === "claude") {
    return JSON.stringify(
      {
        mcpServers: {
          "casper-gw": {
            command: "npx",
            args: ["mcp-remote", endpointUrl],
            env: {
              MCP_ACCESS_TOKEN: clientToken,
            },
          },
        },
      },
      null,
      2,
    );
  }

  return `curl ${endpointUrl}/tools/get_cspr_quote \\
  -H "Authorization: Bearer ${clientToken}" \\
  -H "Accept: application/json"`;
}
