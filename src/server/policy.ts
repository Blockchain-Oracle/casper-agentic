export interface SpendPolicyInput {
  allowedAsset: string;
  allowedNetwork: string;
  allowedTools: string[];
  assetBalance: bigint;
  dailyLimit?: bigint;
  dailySpent?: bigint;
  disabled?: boolean;
  gasBalance: bigint;
  maxPerCall: bigint;
  network: string;
  paymentAmount: bigint;
  paymentAsset: string;
  sessionLimit?: bigint;
  sessionSpent?: bigint;
  toolName: string;
}

export interface PolicyDecision {
  allowed: boolean;
  reason: string;
}

export function evaluateSpendPolicy(input: SpendPolicyInput): PolicyDecision {
  if (input.disabled) return block("policy is disabled");
  if (input.network !== input.allowedNetwork) return block(`network ${input.network} is not allowed`);
  if (input.paymentAsset !== input.allowedAsset) return block("payment asset is not allowed");
  if (!input.allowedTools.includes(input.toolName)) return block(`tool ${input.toolName} is not allowed`);
  if (input.paymentAmount > input.maxPerCall) return block("payment amount exceeds max per call");
  if (exceeds(input.dailySpent, input.paymentAmount, input.dailyLimit)) return block("daily limit exceeded");
  if (exceeds(input.sessionSpent, input.paymentAmount, input.sessionLimit)) return block("session limit exceeded");
  if (input.gasBalance <= BigInt(0)) return block("wallet has no CSPR gas balance evidence");
  if (input.assetBalance < input.paymentAmount) return block("wallet lacks enough CEP-18 payment asset");
  return { allowed: true, reason: "policy allowed before signing/payment" };
}

function exceeds(spent = BigInt(0), amount: bigint, limit?: bigint) {
  return limit !== undefined && spent + amount > limit;
}

function block(reason: string): PolicyDecision {
  return { allowed: false, reason };
}
