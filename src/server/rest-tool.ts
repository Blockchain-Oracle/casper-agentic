// Executes an OpenAPI-derived tool as a real REST call. The operation metadata
// (method/baseUrl/pathTemplate/parameters) is produced by openapi-mcp-generator at
// register time and stored on the provider tool; this runs it after x402 settlement.

export interface RestOperation {
  method: string;
  baseUrl: string;
  pathTemplate: string;
  executionParameters?: Array<{ name: string; in: string }>;
  requestBodyContentType?: string;
}

export function isRestOperation(value: unknown): value is RestOperation {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as RestOperation).method === "string" &&
    typeof (value as RestOperation).baseUrl === "string" &&
    typeof (value as RestOperation).pathTemplate === "string"
  );
}

/** Parse the operation stored on a provider tool's upstreamTarget (openapi sources). */
export function parseRestOperation(upstreamTarget: string): RestOperation | null {
  try {
    const parsed = JSON.parse(upstreamTarget);
    return isRestOperation(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export async function callRestTool(
  op: RestOperation,
  args: Record<string, unknown>,
): Promise<{ isError: boolean; text: string }> {
  try {
    let path = op.pathTemplate;
    const query = new URLSearchParams();
    const headers: Record<string, string> = { accept: "application/json" };
    const bodyParams: Record<string, unknown> = { ...args };

    for (const param of op.executionParameters ?? []) {
      const value = args[param.name];
      if (value === undefined || value === null) continue;
      delete bodyParams[param.name];
      if (param.in === "path") path = path.replace(`{${param.name}}`, encodeURIComponent(String(value)));
      else if (param.in === "query") query.set(param.name, String(value));
      else if (param.in === "header") headers[param.name] = String(value);
    }

    const method = op.method.toUpperCase();
    let body: string | undefined;
    if (method !== "GET" && method !== "HEAD" && Object.keys(bodyParams).length > 0) {
      const contentType = op.requestBodyContentType ?? "application/json";
      headers["content-type"] = contentType;
      body = contentType.includes("json")
        ? JSON.stringify(bodyParams)
        : new URLSearchParams(bodyParams as Record<string, string>).toString();
    }

    // Join base + path (don't resolve — an absolute pathTemplate would drop the
    // baseUrl's own path prefix, e.g. /api/v3).
    const joined = `${op.baseUrl.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
    const url = new URL(`${joined}${query.toString() ? `?${query}` : ""}`);
    const res = await fetch(url.toString(), { body, headers, method });
    const text = await res.text();
    return { isError: !res.ok, text: text.slice(0, 4000) };
  } catch (error) {
    return { isError: true, text: error instanceof Error ? error.message : "REST call failed" };
  }
}
