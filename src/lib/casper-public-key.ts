import { PublicKey } from "casper-js-sdk";

export function normalizeCasperPublicKey(value: string | null | undefined) {
  const text = stripHexPrefix(value).toLowerCase();
  if (!/^01[0-9a-f]{64}$/.test(text) && !/^02[0-9a-f]{66}$/.test(text)) return null;
  try {
    return PublicKey.fromHex(text).toHex().toLowerCase();
  } catch {
    return null;
  }
}

export function accountHashFromPublicKey(value: string | null | undefined) {
  const publicKey = normalizeCasperPublicKey(value);
  if (!publicKey) return null;
  try {
    return PublicKey.fromHex(publicKey).accountHash().toHex().toLowerCase();
  } catch {
    return null;
  }
}

function stripHexPrefix(value: string | null | undefined) {
  const text = value?.trim() ?? "";
  return text.startsWith("0x") || text.startsWith("0X") ? text.slice(2) : text;
}
