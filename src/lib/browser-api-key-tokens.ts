"use client";

const PREFIX = "casper-gw.api-key-token.";

function storage() {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function rememberApiKeyToken(keyId: string, token: string) {
  if (!keyId || !token) return;
  storage()?.setItem(`${PREFIX}${keyId}`, token);
}

export function readApiKeyToken(keyId: string | undefined) {
  if (!keyId) return "";
  return storage()?.getItem(`${PREFIX}${keyId}`) ?? "";
}

export function forgetApiKeyToken(keyId: string) {
  if (!keyId) return;
  storage()?.removeItem(`${PREFIX}${keyId}`);
}
