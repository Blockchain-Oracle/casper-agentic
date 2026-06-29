import { Args, CLValue, ContractCallBuilder, Key, KeyTypeID, PublicKey } from "casper-js-sdk";

export interface WcsprTransferTransactionInput {
  amountMotes: string;
  assetPackageHash: string;
  chainName: string;
  fromPublicKey: string;
  paymentAmountMotes: string;
  payeeAccountHash: string;
}

export function buildWcsprTransferTransaction(input: WcsprTransferTransactionInput) {
  const recipient = CLValue.newCLKey(Key.createByType(accountHashKey(input.payeeAccountHash), KeyTypeID.Account));
  return new ContractCallBuilder()
    .byPackageHash(input.assetPackageHash)
    .entryPoint("transfer")
    .from(PublicKey.fromHex(input.fromPublicKey))
    .chainName(input.chainName)
    .payment(Number(input.paymentAmountMotes))
    .runtimeArgs(
      Args.fromMap({
        amount: CLValue.newCLUInt256(input.amountMotes),
        recipient,
      }),
    )
    .build();
}

function accountHashKey(value: string) {
  const text = value.trim().toLowerCase();
  const bare = text.startsWith("account-hash-") ? text.slice("account-hash-".length) : text;
  const hash = bare.startsWith("00") && bare.length === 66 ? bare.slice(2) : bare;
  if (!/^[0-9a-f]{64}$/.test(hash)) throw new Error("payee must be a Casper account hash");
  return `account-hash-${hash}`;
}
