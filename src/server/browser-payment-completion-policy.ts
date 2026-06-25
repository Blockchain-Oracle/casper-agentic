import { normalizeCasperAccountHash } from "./casper-account";
import { CsprCloudClient } from "./cspr-cloud";
import { evaluateLivePaidCallPolicy } from "./live-paid-call-policy";
import { getLatestPolicyDecisionForAttempt } from "./paid-call-attempt-store";
import { hashPaidCallInput } from "./paid-call-input-hash";
import { persistPolicyDecision } from "./receipt-store";

import type {
  BrowserCompletionConfig,
  ParsedBrowserPaymentCompletionInput,
} from "./browser-payment-completion-outcomes";

export async function browserCompletionPolicyBlock(input: {
  attempt: { toolName: string; walletAccountHash: string };
  config: BrowserCompletionConfig;
  paymentInput: ParsedBrowserPaymentCompletionInput;
}) {
  const inputHash = hashPaidCallInput(input.paymentInput.args);
  const storedPolicy = await getLatestPolicyDecisionForAttempt(input.paymentInput.attemptId);
  const expectedHash = inputHashFromPolicy(storedPolicy?.evaluatedPolicy);
  if (!storedPolicy?.allowed) return "browser payment intent is missing an allowed policy decision";
  if (!expectedHash) return "browser payment intent is missing an approved input hash";
  if (expectedHash !== inputHash) return "browser payment intent input hash mismatch";

  const walletAccountHash = normalizeCasperAccountHash(input.attempt.walletAccountHash);
  const csprCloud = new CsprCloudClient(input.config);
  const account = await csprCloud.getAccount(walletAccountHash);
  const ownerships = await csprCloud.getFTOwnerships(account.account_hash, input.config.paymentAsset);
  const { evidence, policy } = await evaluateLivePaidCallPolicy({
    assetBalance: BigInt(ownerships[0]?.balance ?? "0"),
    config: input.config,
    gasBalance: BigInt(account.balance ?? "0"),
    toolName: input.attempt.toolName,
    walletAccountHash,
  });

  await persistPolicyDecision(input.paymentInput.attemptId, policy.allowed, policy.reason, {
    ...evidence,
    browserPaymentCompletion: { inputHash, policyRechecked: true },
    browserPaymentIntent: { inputHash },
  });
  return policy.allowed ? null : policy.reason;
}

function inputHashFromPolicy(value: unknown) {
  if (!isRecord(value)) return null;
  const intent = value.browserPaymentIntent;
  if (!isRecord(intent)) return null;
  return typeof intent.inputHash === "string" ? intent.inputHash : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
