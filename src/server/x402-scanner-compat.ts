import type { HostedEndpointView } from "./hosted-endpoint";

export interface X402ScannerCompatibility {
  allVisibleToolsPayable: boolean;
  discoveryPrecedence: ["openapi", "well_known_x402", "endpoint_only_probe"];
  endpointOnlyProbe: "blocked_by_client_access";
  nextRequirements: string[];
  payableToolCount: number;
  publicDiscovery: "not_enabled";
  runtimeChallenge: "available_after_client_access" | "missing_payment_requirements";
  status: "not_publicly_indexable";
  visibleToolCount: number;
}

export function buildX402ScannerCompatibility(endpoint: HostedEndpointView): X402ScannerCompatibility {
  const payableToolCount = endpoint.tools.filter((tool) => Boolean(tool.paymentRequirements)).length;
  const allVisibleToolsPayable = endpoint.tools.length > 0 && payableToolCount === endpoint.tools.length;

  return {
    allVisibleToolsPayable,
    discoveryPrecedence: ["openapi", "well_known_x402", "endpoint_only_probe"],
    endpointOnlyProbe: "blocked_by_client_access",
    nextRequirements: [
      "Keep scoped client access before tool metadata and runtime x402 challenges.",
      "Require a separate opt-in plan before exposing public OpenAPI or /.well-known/x402 discovery.",
      "Do not claim public scanner indexing until unauthenticated discovery is explicitly accepted.",
    ],
    payableToolCount,
    publicDiscovery: "not_enabled",
    runtimeChallenge: allVisibleToolsPayable ? "available_after_client_access" : "missing_payment_requirements",
    status: "not_publicly_indexable",
    visibleToolCount: endpoint.tools.length,
  };
}
