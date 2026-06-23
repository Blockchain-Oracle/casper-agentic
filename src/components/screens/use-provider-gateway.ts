"use client";

import { useCallback, useMemo, useState } from "react";
import {
  DEFAULT_PROVIDER_MCP_URL,
  DEFAULT_PROVIDER_PRICE_AMOUNT,
  providerRequest,
  toToolRow,
} from "@/lib/provider-gateway-client";
import type {
  ProviderSource,
  ProviderTool,
  SourcePhase,
  SourceType,
  Tool,
  UpstreamAuth,
} from "@/lib/types";

export function useProviderGateway() {
  const [operatorToken, setOperatorTokenState] = useState("");
  const [sourceName, setSourceName] = useState("CSPR Trade");
  const [sourceUrl, setSourceUrl] = useState(DEFAULT_PROVIDER_MCP_URL);
  const [sourceType, setSourceType] = useState<SourceType>("mcp");
  const [upstreamAuth, setUpstreamAuth] = useState<UpstreamAuth>("none");
  const [sourcePhase, setSourcePhase] = useState<SourcePhase>("form");
  const [providerSource, setProviderSource] = useState<ProviderSource | null>(null);
  const [toolRows, setToolRows] = useState<Tool[]>([]);
  const [statusMessage, setStatusMessage] = useState("Connect operator access to load real provider records.");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [endpointClientToken, setEndpointClientToken] = useState<string | null>(null);
  const [endpointToolCount, setEndpointToolCount] = useState(0);

  const publishedTools = useMemo(() => toolRows.filter((tool) => tool.published), [toolRows]);
  const pricedTools = useMemo(() => toolRows.filter((tool) => tool.price !== null), [toolRows]);
  const hostedEndpointUrl = providerSource ? `/api/mcp/${providerSource.id}` : "/api/mcp/{sourceId}";

  const handleError = useCallback((error: unknown) => {
    setErrorMessage(error instanceof Error ? error.message : "provider_gateway_failed");
  }, []);

  const loadTools = useCallback(async (sourceId: string, token = operatorToken, providerName = "Provider") => {
    const query = new URLSearchParams({ sourceId });
    const { tools } = await providerRequest<{ tools: ProviderTool[] }>(`/api/provider/tools?${query}`, {
      operatorToken: token,
    });
    setToolRows(tools.map((tool) => toToolRow(tool, providerName)));
  }, [operatorToken]);

  const loadProviderState = useCallback(async (token = operatorToken) => {
    if (!token) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      const { sources } = await providerRequest<{ sources: ProviderSource[] }>("/api/provider/sources", {
        operatorToken: token,
      });
      const source = sources.find((item) => item.sourceType === "mcp") ?? sources[0] ?? null;
      setProviderSource(source);
      if (source) {
        setSourceName(source.name);
        setSourceUrl(source.endpointUrl);
        setSourceType(source.sourceType);
        setUpstreamAuth(source.authMode);
        await loadTools(source.id, token, source.name);
        setSourcePhase("success");
      }
      setStatusMessage(source ? "Loaded real provider records from Postgres." : "No provider source exists yet.");
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  }, [handleError, loadTools, operatorToken]);

  function setOperatorToken(value: string) {
    const token = value.trim();
    setOperatorTokenState(token);
  }

  async function discoverSource() {
    if (!operatorToken) return setErrorMessage("Operator access token is required.");
    if (sourceType !== "mcp") {
      setSourcePhase("error");
      return setErrorMessage("Phase 1 wires Remote MCP discovery first. OpenAPI/manual are deferred.");
    }

    setLoading(true);
    setSourcePhase("loading");
    setErrorMessage(null);
    try {
      const created = await providerRequest<{ source: ProviderSource }>("/api/provider/sources", {
        body: { authMode: upstreamAuth, endpointUrl: sourceUrl, name: sourceName, sourceType },
        method: "POST",
        operatorToken,
      });
      const discovered = await providerRequest<{ source: ProviderSource; tools: ProviderTool[] }>(
        `/api/provider/sources/${created.source.id}/discover`,
        { method: "POST", operatorToken },
      );
      setProviderSource(discovered.source);
      setToolRows(discovered.tools.map((tool) => toToolRow(tool, discovered.source.name)));
      setSourcePhase("success");
      setStatusMessage(`Discovered ${discovered.tools.length} real tools from ${discovered.source.endpointUrl}.`);
    } catch (error) {
      setSourcePhase("error");
      handleError(error);
    } finally {
      setLoading(false);
    }
  }

  async function priceAndPublishTool(tool: Tool, amount: string) {
    if (!operatorToken) return setErrorMessage("Operator access token is required.");
    const toolId = tool.recordId ?? tool.id;
    setLoading(true);
    setErrorMessage(null);
    try {
      await providerRequest(`/api/provider/tools/${toolId}/select`, { method: "POST", operatorToken });
      await providerRequest(`/api/provider/tools/${toolId}/price`, {
        body: { amount },
        method: "POST",
        operatorToken,
      });
      await providerRequest(`/api/provider/tools/${toolId}/publish`, { method: "POST", operatorToken });
      if (providerSource) await loadTools(providerSource.id, operatorToken, providerSource.name);
      setStatusMessage(`${tool.id} is priced and published from persisted provider records.`);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  }

  async function createClientAccess() {
    if (!operatorToken) return setErrorMessage("Operator access token is required.");
    if (!providerSource) return setErrorMessage("Create or load a provider source before generating client access.");

    setLoading(true);
    setErrorMessage(null);
    try {
      const created = await providerRequest<{ token: string }>(
        `/api/provider/sources/${providerSource.id}/access-keys`,
        { body: { label: "App client config" }, method: "POST", operatorToken },
      );
      const endpoint = await providerRequest<{ endpoint: { tools: ProviderTool[] } }>(
        `/api/mcp/${providerSource.id}`,
        { bearerToken: created.token },
      );
      setEndpointClientToken(created.token);
      setEndpointToolCount(endpoint.endpoint.tools.length);
      setStatusMessage(`Generated scoped client access for ${endpoint.endpoint.tools.length} published tools.`);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  }

  return {
    createClientAccess,
    discoverSource,
    endpointClientToken,
    endpointToolCount,
    errorMessage,
    hostedEndpointUrl,
    loadProviderState,
    loading,
    operatorToken,
    priceAndPublishTool,
    pricedTools,
    providerSource,
    publishedTools,
    setOperatorToken,
    setSourceName,
    setSourceType,
    setSourceUrl,
    setUpstreamAuth,
    sourceName,
    sourcePhase,
    sourceType,
    sourceUrl,
    statusMessage,
    toolRows,
    upstreamAuth,
  };
}

export const defaultProviderPriceAmount = DEFAULT_PROVIDER_PRICE_AMOUNT;
