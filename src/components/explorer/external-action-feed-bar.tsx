import { Chip } from "@/components/ui";
import type { ExternalActionFeedResult } from "@/lib/types";

interface ExternalActionFeedBarProps {
  active: boolean;
  feed?: ExternalActionFeedResult | null;
  loading: boolean;
  onOpen: () => void;
  onNext: () => void;
  onPrevious: () => void;
}

export function ExternalActionFeedBar({ active, feed, loading, onOpen, onNext, onPrevious }: ExternalActionFeedBarProps) {
  const pagination = feed?.pagination;
  const isConfigured = feed?.source === "cspr_cloud";
  const label = isConfigured && pagination
    ? `${pagination.totalCount} WCSPR actions - page ${pagination.page} of ${pagination.totalPages}`
    : feed?.message ?? "Browse configured WCSPR token actions from CSPR.cloud.";

  return (
    <div className="notice">
      <div className="buttonRow">
        <Chip tone={active && isConfigured ? "primary" : "neutral"}>External WCSPR feed</Chip>
        <Chip tone={feed && !isConfigured ? "warn" : "neutral"}>{loading ? "Loading external feed" : label}</Chip>
        {!active ? (
          <button className="secondaryButton" disabled={loading} onClick={onOpen} type="button">
            Open external WCSPR feed
          </button>
        ) : (
          <>
            <button
              className="secondaryButton"
              disabled={!pagination?.hasPreviousPage || loading}
              onClick={onPrevious}
              type="button"
            >
              Previous WCSPR page
            </button>
            <button className="secondaryButton" disabled={!pagination?.hasNextPage || loading} onClick={onNext} type="button">
              Next WCSPR page
            </button>
          </>
        )}
      </div>
      Feed rows are public token-action proof for the configured payment asset; they are not Casper GW receipts unless a gateway record matches.
    </div>
  );
}
