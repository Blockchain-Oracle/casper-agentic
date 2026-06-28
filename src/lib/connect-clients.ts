// One-click / copy connect targets for the hosted MCP server. The connection URL is
// our gateway MCP endpoint (/api/mcp/[sourceId]); the casper_ key authenticates and
// the gateway settles per tools/call. Deeplink formats verified against client docs:
// Cursor base64-encodes the BARE config object; VS Code URL-encodes a {name,type,url}
// object; Claude Desktop/Codex use the mcp-remote bridge (no native one-click).

export type ConnectBuild =
  | { kind: "deeplink"; label: string; url: string }
  | { kind: "command"; command: string }
  | { kind: "config"; json: string }
  | { kind: "steps"; steps: string[]; url: string };

export interface ConnectClient {
  id: string;
  name: string;
  build: (ctx: { mcpUrl: string; apiKey: string; slug: string }) => ConnectBuild;
}

function b64(value: string) {
  return typeof btoa !== "undefined" ? btoa(value) : Buffer.from(value).toString("base64");
}

// Remote MCP server config shape clients understand: url + headers (key in header).
function remoteConfig(mcpUrl: string, apiKey: string) {
  return { headers: { "x-api-key": apiKey }, url: mcpUrl };
}

export const CONNECT_CLIENTS: ConnectClient[] = [
  {
    build: ({ apiKey, mcpUrl, slug }) => ({
      command: `claude mcp add --transport http ${slug} "${mcpUrl}" --header "x-api-key: ${apiKey}"`,
      kind: "command",
    }),
    id: "claude-code",
    name: "Claude Code",
  },
  {
    build: ({ apiKey, mcpUrl, slug }) => ({
      kind: "deeplink",
      label: "Add to Cursor",
      url: `cursor://anysphere.cursor-deeplink/mcp/install?name=${slug}&config=${b64(JSON.stringify(remoteConfig(mcpUrl, apiKey)))}`,
    }),
    id: "cursor",
    name: "Cursor",
  },
  {
    build: ({ apiKey, mcpUrl, slug }) => ({
      kind: "deeplink",
      label: "Add to VS Code",
      url: `vscode:mcp/install?${encodeURIComponent(JSON.stringify({ name: slug, type: "http", ...remoteConfig(mcpUrl, apiKey) }))}`,
    }),
    id: "vscode",
    name: "VS Code",
  },
  {
    build: ({ apiKey, mcpUrl, slug }) => ({
      json: JSON.stringify(
        { mcpServers: { [slug]: { args: ["mcp-remote", mcpUrl, "--header", `x-api-key: ${apiKey}`], command: "npx" } } },
        null,
        2,
      ),
      kind: "config",
    }),
    id: "claude-desktop",
    name: "Claude Desktop",
  },
  {
    build: ({ apiKey, mcpUrl, slug }) => ({
      json: `[mcp_servers.${slug}]\ncommand = "npx"\nargs = ["mcp-remote", "${mcpUrl}", "--header", "x-api-key: ${apiKey}"]`,
      kind: "config",
    }),
    id: "codex",
    name: "Codex",
  },
  {
    build: ({ mcpUrl }) => ({
      kind: "steps",
      steps: [
        "Open ChatGPT → Settings → Connectors (enable Developer Mode if needed)",
        "Add a custom connector and paste the server URL below",
      ],
      url: mcpUrl,
    }),
    id: "chatgpt",
    name: "ChatGPT",
  },
];
