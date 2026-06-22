import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

import { assertSafeMcpEndpoint, guardedEndpointFetch } from "./endpoint-safety";

export interface DiscoveredMcpTool {
  name: string;
  description?: string;
  inputSchema: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
}

export async function discoverMcpTools(endpointUrl: string) {
  return withMcpClient(endpointUrl, async (client) => {
    const result = await client.listTools(undefined, { timeout: 20_000 });
    return result.tools.map((tool) => ({
      description: tool.description,
      inputSchema: tool.inputSchema,
      name: tool.name,
      outputSchema: tool.outputSchema,
    })) satisfies DiscoveredMcpTool[];
  });
}

export async function callMcpTool(endpointUrl: string, name: string, args: Record<string, unknown>) {
  return withMcpClient(endpointUrl, async (client) => {
    const result = await client.callTool({ arguments: args, name }, undefined, { timeout: 30_000 });
    return {
      isError: "isError" in result ? Boolean(result.isError) : false,
      result,
      text: extractText(result),
    };
  });
}

async function withMcpClient<T>(endpointUrl: string, fn: (client: Client) => Promise<T>) {
  const safeUrl = await assertSafeMcpEndpoint(endpointUrl);
  const client = new Client({ name: "casper-gw", version: "0.1.0" });
  const transport = new StreamableHTTPClientTransport(safeUrl, { fetch: guardedEndpointFetch });
  await client.connect(transport, { timeout: 20_000 });
  try {
    return await fn(client);
  } finally {
    await client.close();
  }
}

function extractText(result: unknown) {
  if (!isObject(result) || !Array.isArray(result.content)) return "";
  return result.content
    .filter((item): item is { type: "text"; text: string } => isObject(item) && item.type === "text")
    .map((item) => item.text)
    .join("\n");
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
