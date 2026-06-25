import type { PaymentPayload, PaymentRequirements } from "@x402/core/types";
import { PublicKey } from "casper-js-sdk";

export type CSPRClickTypedDataField = { name: string; type: string };

export type CSPRClickSignTypedDataParams = {
  typedData: {
    domain: Record<string, unknown>;
    message: Record<string, unknown>;
    primaryType: string;
    types: Record<string, CSPRClickTypedDataField[]>;
  };
  options?: { domainTypes?: CSPRClickTypedDataField[]; rejectUnknownFields?: boolean; returnHashArtifacts?: boolean };
};

export type CSPRClickSignTypedDataResult = {
  cancelled: boolean;
  digest: string | null;
  error: string | null;
  errorCode?: string;
  hashArtifacts?: CSPRClickHashArtifacts;
  publicKey: string | null;
  signatureHex: string | null;
};

export type CSPRClickHashArtifacts = {
  canonicalTypeString?: string;
  domain?: Record<string, unknown>;
  domainSeparator?: string;
  domainTypeString?: string;
  structHash?: string;
  typeHash?: string;
};

export type BrowserX402FailureReason =
  | "active_public_key_mismatch"
  | "authorization_account_mismatch"
  | "malformed_result"
  | "signature_error"
  | "typed_data_mismatch";

export type BrowserX402SigningResult =
  | { digest: string; paymentPayload: PaymentPayload; publicKey: string; status: "signed" }
  | { message: string; reason: "user_cancelled"; status: "cancelled" }
  | {
      errorCode?: string;
      message: string;
      reason: BrowserX402FailureReason;
      status: "failed";
    };

export function validateCSPRClickActivePublicKey(input: {
  activePublicKey: string | null | undefined;
  expectedPublicKey: string;
}) {
  const activePublicKey = normalizePublicKey(input.activePublicKey)?.publicKey;
  const expectedPublicKey = normalizePublicKey(input.expectedPublicKey)?.publicKey;

  if (!activePublicKey || activePublicKey !== expectedPublicKey) {
    return failed(
      "active_public_key_mismatch",
      "CSPR.click active account does not match the selected Casper GW wallet",
    );
  }

  return { publicKey: expectedPublicKey, status: "ready" as const };
}

export function buildBrowserX402PaymentPayload(input: {
  accepted: PaymentRequirements;
  expectedAccountHash: string;
  expectedPublicKey: string;
  resourceUrl: string;
  signTypedDataParams: CSPRClickSignTypedDataParams;
  signTypedDataResult: CSPRClickSignTypedDataResult;
  x402Version: number;
}): BrowserX402SigningResult {
  const result = input.signTypedDataResult;

  if (result.cancelled) {
    return { message: "CSPR.click signing was cancelled", reason: "user_cancelled", status: "cancelled" };
  }

  if (result.error) {
    return failed("signature_error", result.error, result.errorCode);
  }

  const signature = normalizeSignature(result.signatureHex);
  const digest = normalizeDigest(result.digest);
  const publicKey = normalizePublicKey(result.publicKey);
  const expectedPublicKey = normalizePublicKey(input.expectedPublicKey);
  const expectedAccountHash = normalizeAccountHash(input.expectedAccountHash);
  if (!signature || !digest || !publicKey || !expectedPublicKey || !expectedAccountHash) {
    return failed("malformed_result", "CSPR.click returned a malformed signature");
  }

  if (publicKey.publicKey !== expectedPublicKey.publicKey || publicKey.accountHash !== expectedAccountHash) {
    return failed(
      "active_public_key_mismatch",
      "CSPR.click signature public key does not match the selected Casper GW wallet",
    );
  }

  const authorization = transferAuthorization(input.signTypedDataParams.typedData.message);
  if (!authorization) {
    return failed("typed_data_mismatch", "CSPR.click typed data is missing transfer authorization fields");
  }

  if (normalizeAccountHash(authorization.from) !== expectedAccountHash) {
    return failed(
      "authorization_account_mismatch",
      "CSPR.click typed-data authorization is not for the selected Casper GW wallet",
    );
  }

  return {
    digest,
    paymentPayload: {
      accepted: input.accepted,
      payload: {
        authorization,
        publicKey: publicKey.publicKey,
        signature,
      },
      resource: { url: input.resourceUrl },
      x402Version: input.x402Version,
    },
    publicKey: publicKey.publicKey,
    status: "signed",
  };
}

function transferAuthorization(message: Record<string, unknown>) {
  const from = stringValue(message.from, { stripHexPrefix: true });
  const to = stringValue(message.to, { stripHexPrefix: true });
  const value = stringValue(message.value);
  const validAfter = stringValue(message.validAfter);
  const validBefore = stringValue(message.validBefore);
  const nonce = stringValue(message.nonce, { stripHexPrefix: true });

  if (!from || !to || !value || !validAfter || !validBefore || !nonce) return null;
  return { from, nonce, to, validAfter, validBefore, value };
}

function normalizeSignature(value: string | null | undefined) {
  const hex = stripOptionalHexPrefix(value).toLowerCase();
  if (!/^(01|02)[0-9a-f]{128}$/.test(hex)) return null;
  return hex;
}

function normalizeDigest(value: string | null | undefined) {
  const text = value?.trim().toLowerCase() ?? "";
  if (!/^0x[0-9a-f]{64}$/.test(text)) return null;
  return text;
}

function normalizePublicKey(value: string | null | undefined) {
  const text = stripOptionalHexPrefix(value).toLowerCase();
  if (!/^01[0-9a-f]{64}$/.test(text) && !/^02[0-9a-f]{66}$/.test(text)) return null;

  try {
    const publicKey = PublicKey.fromHex(text);
    return {
      accountHash: publicKey.accountHash().toHex().toLowerCase(),
      publicKey: publicKey.toHex().toLowerCase(),
    };
  } catch {
    return null;
  }
}

function normalizeAccountHash(value: string | null | undefined) {
  const text = stripOptionalAccountHashPrefix(value).toLowerCase();
  const hash = text.startsWith("00") && text.length === 66 ? text.slice(2) : text;
  return /^[0-9a-f]{64}$/.test(hash) ? hash : null;
}

function stringValue(value: unknown, options: { stripHexPrefix?: boolean } = {}) {
  if (value === null || value === undefined) return "";
  const text = String(value).trim();
  if (!text) return "";
  return options.stripHexPrefix ? stripOptionalHexPrefix(text) : text;
}

function stripOptionalHexPrefix(value: string | null | undefined) {
  const text = value?.trim() ?? "";
  return text.startsWith("0x") || text.startsWith("0X") ? text.slice(2) : text;
}

function stripOptionalAccountHashPrefix(value: string | null | undefined) {
  const text = value?.trim() ?? "";
  return text.startsWith("account-hash-") ? text.slice("account-hash-".length) : text;
}

function failed(reason: BrowserX402FailureReason, message: string, errorCode?: string): BrowserX402SigningResult {
  return { ...(errorCode ? { errorCode } : {}), message, reason, status: "failed" };
}
