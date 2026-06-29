import { AccountHash, NativeTransferBuilder, PublicKey } from "casper-js-sdk";

export interface CsprDepositTransactionInput {
  amountMotes: string;
  chainName: string;
  fromPublicKey: string;
  gatewayAccountHash: string;
  paymentAmountMotes: string;
}

// A plain native CSPR transfer from the connected wallet to the gateway account.
// Users hold native CSPR (not WCSPR), so this removes the WCSPR-balance precondition;
// the gateway wraps the received CSPR into WCSPR to settle.
export function buildCsprDepositTransaction(input: CsprDepositTransactionInput) {
  return new NativeTransferBuilder()
    .from(PublicKey.fromHex(input.fromPublicKey))
    .targetAccountHash(AccountHash.fromString(`account-hash-${bareAccountHash(input.gatewayAccountHash)}`))
    .amount(input.amountMotes)
    .chainName(input.chainName)
    .payment(Number(input.paymentAmountMotes))
    .build();
}

function bareAccountHash(value: string) {
  const text = value.trim().toLowerCase();
  const stripped = text.startsWith("account-hash-") ? text.slice("account-hash-".length) : text;
  const hash = stripped.startsWith("00") && stripped.length === 66 ? stripped.slice(2) : stripped;
  if (!/^[0-9a-f]{64}$/.test(hash)) throw new Error("gateway account hash is invalid");
  return hash;
}
