import { Args, CLTypeUInt8, CLValue } from "casper-js-sdk";

export interface ProxyWasmArgsParams {
  attachedValue: string;
  entryPoint: string;
  innerArgs: Args;
  packageHash: string;
}

export function buildProxyWasmArgs(params: ProxyWasmArgsParams): Args {
  const rawArgsBytes = params.innerArgs.toBytes();
  const argsBytes: CLValue[] = [];

  for (const byte of rawArgsBytes) {
    argsBytes.push(CLValue.newCLUint8(byte));
  }

  return Args.fromMap({
    amount: CLValue.newCLUInt512(params.attachedValue),
    args: CLValue.newCLList(CLTypeUInt8, argsBytes),
    attached_value: CLValue.newCLUInt512(params.attachedValue),
    entry_point: CLValue.newCLString(params.entryPoint),
    package_hash: CLValue.newCLByteArray(hexToBytes(params.packageHash)),
  });
}

function hexToBytes(value: string) {
  const hex = value.startsWith("hash-") ? value.slice(5) : value;
  if (!/^[0-9a-f]+$/i.test(hex) || hex.length % 2 !== 0) {
    throw new Error("Expected an even-length hex package hash");
  }

  const bytes = new Uint8Array(hex.length / 2);
  for (let index = 0; index < hex.length; index += 2) {
    bytes[index / 2] = Number.parseInt(hex.slice(index, index + 2), 16);
  }
  return bytes;
}
