export type ConfigTab = "cursor" | "claude" | "curl";

export const endpointUrl = "/api/mcp/{sourceId}";
export const clientToken = "<client-access-token>";

export function clientConfig(
  tab: ConfigTab,
  config: { clientToken?: string | null; endpointUrl?: string } = {},
) {
  const url = config.endpointUrl ?? endpointUrl;
  const token = config.clientToken ?? clientToken;

  if (tab === "cursor") {
    return JSON.stringify(
      {
        mcpServers: {
          "casper-gw": {
            url,
            headers: {
              Authorization: `Bearer ${token}`,
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
            args: ["mcp-remote", url],
            env: {
              MCP_ACCESS_TOKEN: token,
            },
          },
        },
      },
      null,
      2,
    );
  }

  return `curl ${url} \\
  -H "Authorization: Bearer ${token}" \\
  -H "Accept: application/json"`;
}
