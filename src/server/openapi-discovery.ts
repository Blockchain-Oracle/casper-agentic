import { getToolsFromOpenApi } from "openapi-mcp-generator";

// Converts an OpenAPI/Swagger spec URL into callable tool definitions using
// openapi-mcp-generator. Each tool carries the REST operation (method/path/params)
// + a resolved baseUrl so the settle path can execute it after payment. This is
// the "host the OpenAPI→tools conversion in a Next.js /api route" approach.

export async function discoverOpenApiTools(specUrl: string) {
  const baseUrl = await resolveBaseUrl(specUrl);
  const tools = await getToolsFromOpenApi(specUrl, { baseUrl, dereference: true });
  return tools.map((tool) => ({
    baseUrl,
    description: typeof tool.description === "string" ? tool.description : "",
    executionParameters: tool.executionParameters ?? [],
    inputSchema: tool.inputSchema,
    method: tool.method,
    name: tool.name,
    pathTemplate: tool.pathTemplate,
    requestBodyContentType: tool.requestBodyContentType,
  }));
}

/** The API's real base URL: the spec's first `servers[].url`, else the spec origin. */
async function resolveBaseUrl(specUrl: string): Promise<string> {
  try {
    const res = await fetch(specUrl, { headers: { accept: "application/json" } });
    const spec = (await res.json()) as { servers?: Array<{ url?: string }> };
    const server = spec.servers?.[0]?.url;
    if (typeof server === "string" && server.trim()) {
      return server.startsWith("http") ? server : new URL(server, specUrl).toString();
    }
  } catch {
    // fall through to origin
  }
  return new URL(specUrl).origin;
}
