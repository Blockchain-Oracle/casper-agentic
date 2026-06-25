import type { PaymentRequirements } from "@x402/core/types";

import {
  buildBrowserX402PaymentPayload,
  validateCSPRClickActivePublicKey,
  type CSPRClickSignTypedDataParams,
  type CSPRClickSignTypedDataResult,
} from "./browser-x402-signing";
import { getCSPRClickBrowserState, requestCSPRClickTypedDataSignature } from "./csprclick-browser";
import type { CSPRClickBrowserWindow } from "./csprclick-browser";

export type BrowserPaidCallFlowResult = {
  attemptId?: string;
  explorerUrl?: string;
  message: string;
  status: "blocked" | "auth_failed" | "failed" | "raw_proof_unavailable" | "settled" | "settle_failed" | "upstream_failed" | "verify_failed";
};

export type BrowserPaidCallFetch = (
  url: string,
  input: { body: Record<string, unknown>; operatorToken: string },
) => Promise<unknown>;

export type BrowserPaidCallFlowInput = {
  args: Record<string, unknown>;
  endpointUrl: string;
  fetchJson?: BrowserPaidCallFetch;
  getBrowserState?: () => Promise<{ activePublicKey?: string; connected: boolean }>;
  operatorToken: string;
  signTypedData?: (
    params: CSPRClickSignTypedDataParams,
    publicKey: string,
  ) => Promise<CSPRClickSignTypedDataResult>;
  toolName: string;
  walletId: string;
};

export async function runBrowserPaidCallFlow(input: BrowserPaidCallFlowInput): Promise<BrowserPaidCallFlowResult> {
  const fetchJson = input.fetchJson ?? postJson;
  const intent = await fetchJson("/api/paid-calls/payment-intents", {
    body: baseRequest(input),
    operatorToken: input.operatorToken,
  });
  const parsedIntent = asIntent(intent);
  if (!parsedIntent) return failed("Browser payment intent returned an invalid response");
  if (parsedIntent.status === "blocked") return blocked(parsedIntent);

  const browserState = await (input.getBrowserState ?? defaultBrowserState)();
  const keyCheck = validateCSPRClickActivePublicKey({
    activePublicKey: browserState.activePublicKey,
    expectedPublicKey: parsedIntent.signing.expectedPublicKey,
  });
  if (keyCheck.status !== "ready") {
    const message = "message" in keyCheck ? keyCheck.message : "CSPR.click active account does not match the selected wallet";
    return reportBrowserFailure(fetchJson, input, parsedIntent.attemptId, message, "ACTIVE_ACCOUNT_MISMATCH");
  }

  const signature = await (input.signTypedData ?? defaultSignTypedData)(
    parsedIntent.signing.signTypedDataParams,
    parsedIntent.signing.expectedPublicKey,
  );
  const signed = buildBrowserX402PaymentPayload({
    accepted: parsedIntent.paymentRequirements,
    expectedAccountHash: parsedIntent.signing.expectedAccountHash,
    expectedPublicKey: parsedIntent.signing.expectedPublicKey,
    resourceUrl: parsedIntent.resource.url,
    signTypedDataParams: parsedIntent.signing.signTypedDataParams,
    signTypedDataResult: signature,
    x402Version: parsedIntent.x402Version,
  });
  if (signed.status === "cancelled") {
    return reportBrowserFailure(fetchJson, input, parsedIntent.attemptId, signed.message, "USER_CANCELLED");
  }
  if (signed.status === "failed") {
    return reportBrowserFailure(fetchJson, input, parsedIntent.attemptId, signed.message, signature.errorCode);
  }

  const completion = await fetchJson("/api/paid-calls/browser-completions", {
    body: {
      ...baseRequest(input),
      attemptId: parsedIntent.attemptId,
      paymentPayload: signed.paymentPayload,
      signingEvidence: {
        digest: signed.digest,
        hashArtifacts: signature.hashArtifacts,
        publicKey: signed.publicKey,
      },
    },
    operatorToken: input.operatorToken,
  });
  const completed = asCompletion(completion);
  if (!completed) return failed("Browser payment completion returned an invalid response", parsedIntent.attemptId);
  return {
    attemptId: completed.attemptId,
    explorerUrl: completed.explorerUrl,
    message: `Browser payment result: ${completed.status}`,
    status: completed.status,
  };
}

async function postJson(url: string, input: { body: Record<string, unknown>; operatorToken: string }) {
  const response = await fetch(url, {
    body: JSON.stringify(input.body),
    headers: {
      "content-type": "application/json",
      "x-casper-gw-operator-token": input.operatorToken,
    },
    method: "POST",
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error ?? "browser_paid_call_failed");
  return body;
}

async function defaultBrowserState() {
  return getCSPRClickBrowserState(browserWindowLike());
}

async function defaultSignTypedData(params: CSPRClickSignTypedDataParams, publicKey: string) {
  return requestCSPRClickTypedDataSignature(browserWindowLike().csprclick, params, publicKey);
}

function browserWindowLike(): Pick<CSPRClickBrowserWindow, "csprclick"> {
  return typeof window === "undefined" ? {} : (window as unknown as Pick<CSPRClickBrowserWindow, "csprclick">);
}

function baseRequest(input: { args: Record<string, unknown>; endpointUrl: string; toolName: string; walletId: string }) {
  return { args: input.args, endpointUrl: input.endpointUrl, toolName: input.toolName, walletId: input.walletId };
}

type IntentResponse =
  | { attemptId: string; policy?: { reason?: string }; status: "blocked" }
  | {
      attemptId: string;
      paymentRequirements: PaymentRequirements;
      resource: { url: string };
      signing: {
        expectedAccountHash: string;
        expectedPublicKey: string;
        signTypedDataParams: CSPRClickSignTypedDataParams;
      };
      status: "ready_for_signature";
      x402Version: number;
    };

function asIntent(value: unknown): IntentResponse | null {
  if (!isRecord(value) || typeof value.attemptId !== "string") return null;
  if (value.status === "blocked") return value as IntentResponse;
  return value.status === "ready_for_signature" && isRecord(value.signing) ? (value as IntentResponse) : null;
}

function asCompletion(value: unknown): BrowserPaidCallFlowResult | null {
  if (!isRecord(value) || typeof value.attemptId !== "string" || typeof value.status !== "string") return null;
  return value as BrowserPaidCallFlowResult;
}

function blocked(intent: Extract<IntentResponse, { status: "blocked" }>): BrowserPaidCallFlowResult {
  return { attemptId: intent.attemptId, message: intent.policy?.reason ?? "Browser payment intent blocked", status: "blocked" };
}

function failed(message: string, attemptId?: string): BrowserPaidCallFlowResult {
  return { attemptId, message, status: "failed" };
}

async function reportBrowserFailure(
  fetchJson: BrowserPaidCallFetch,
  input: BrowserPaidCallFlowInput,
  attemptId: string,
  reason: string,
  errorCode?: string | null,
  resultStatus: BrowserPaidCallFlowResult["status"] = "auth_failed",
): Promise<BrowserPaidCallFlowResult> {
  try {
    const response = await fetchJson("/api/paid-calls/browser-failures", {
      body: { attemptId, errorCode, reason, resultStatus, toolName: input.toolName },
      operatorToken: input.operatorToken,
    });
    const closed = asCompletion(response);
    if (closed) return { attemptId: closed.attemptId, message: closed.message ?? reason, status: closed.status };
  } catch {
    return failed(reason, attemptId);
  }
  return { attemptId, message: reason, status: resultStatus };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
