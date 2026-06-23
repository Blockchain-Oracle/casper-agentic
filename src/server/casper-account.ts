const ACCOUNT_HASH_PREFIX = "account-hash-";

export function normalizeCasperAccountHash(value: string, label = "Casper account hash") {
  const text = requiredText(value, label);
  const bare = text.startsWith(ACCOUNT_HASH_PREFIX) ? text.slice(ACCOUNT_HASH_PREFIX.length) : text;
  const accountHash = bare.startsWith("00") && bare.length === 66 ? bare.slice(2) : bare;

  if (!/^[a-fA-F0-9]{64}$/.test(accountHash)) {
    throw new Error(`${label} must be a Casper account hash`);
  }
  return accountHash.toLowerCase();
}

export function casperAccountAliases(value: string) {
  const text = requiredText(value, "Casper account hash");
  const bare = text.startsWith(ACCOUNT_HASH_PREFIX) ? text.slice(ACCOUNT_HASH_PREFIX.length) : text;
  const normalized = normalizeCasperAccountHash(text);
  return Array.from(
    new Set([text, bare, normalized, `00${normalized}`, `${ACCOUNT_HASH_PREFIX}${normalized}`]),
  );
}

function requiredText(value: string | undefined, label: string) {
  const text = value?.trim();
  if (!text) throw new Error(`${label} is required`);
  return text;
}
