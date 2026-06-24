import { Chip } from "@/components/ui";
import type { ExternalAccountHistoryResult } from "@/lib/types";

interface ExternalAccountHistoryBarProps {
  history?: ExternalAccountHistoryResult;
  loading: boolean;
  onNext: () => void;
  onPrevious: () => void;
}

export function ExternalAccountHistoryBar({ history, loading, onNext, onPrevious }: ExternalAccountHistoryBarProps) {
  if (!history) return null;

  const { pagination } = history;
  const isConfigured = history.source === "cspr_cloud";
  const label = isConfigured
    ? `${pagination.totalCount} external action${pagination.totalCount === 1 ? "" : "s"} - page ${
        pagination.page
      } of ${pagination.totalPages}`
    : history.message;

  return (
    <div className="notice">
      <div className="buttonRow">
        <Chip tone={isConfigured ? "primary" : "warn"}>{isConfigured ? "CSPR.cloud account history" : "External history unavailable"}</Chip>
        <Chip tone="neutral">{label}</Chip>
        {isConfigured ? (
          <>
            <button
              className="secondaryButton"
              disabled={!pagination.hasPreviousPage || loading}
              onClick={onPrevious}
              type="button"
            >
              Previous external page
            </button>
            <button className="secondaryButton" disabled={!pagination.hasNextPage || loading} onClick={onNext} type="button">
              Next external page
            </button>
          </>
        ) : null}
      </div>
      External rows are Casper token-action proof only; they do not include Casper GW provider, policy, or x402 context.
    </div>
  );
}
