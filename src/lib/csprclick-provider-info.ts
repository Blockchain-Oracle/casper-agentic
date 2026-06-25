import { clean, type CSPRClickProviderInfo } from "./csprclick-browser-config";

export const CSPRCLICK_TYPED_DATA_SUPPORT = "sign-typed-data-eip712";

export type CSPRClickProviderCapability = {
  key: string;
  name?: string;
  reportedKey?: string;
  supports: string[];
  typedDataSupport?: boolean;
  version?: string;
};

export function normalizeCSPRClickSupports(supports: string[] | undefined) {
  return Array.isArray(supports)
    ? Array.from(new Set(supports.map((support) => clean(support)?.toLowerCase()).filter(Boolean) as string[]))
    : [];
}

export function csprClickProviderSupportsTypedData(supports: string[]) {
  return supports.length ? supports.includes(CSPRCLICK_TYPED_DATA_SUPPORT) : undefined;
}

export function csprClickProviderInfo(input: {
  accountProvider?: string;
  provider?: CSPRClickProviderInfo;
  supports: string[];
}) {
  const key = clean(input.provider?.key ?? input.accountProvider);
  const name = clean(input.provider?.name);
  const version = clean(input.provider?.version);
  return key || name || version || input.supports.length
    ? {
        ...(key ? { key } : {}),
        ...(name ? { name } : {}),
        supports: input.supports,
        ...(version ? { version } : {}),
    }
    : undefined;
}

export function csprClickProviderCapability(input: {
  provider?: CSPRClickProviderInfo;
  providerKey: string;
}): CSPRClickProviderCapability {
  const supports = normalizeCSPRClickSupports(input.provider?.supports);
  const key = input.providerKey;
  const reportedKey = clean(input.provider?.key);
  const name = clean(input.provider?.name);
  const version = clean(input.provider?.version);
  const typedDataSupport = csprClickProviderSupportsTypedData(supports);
  return {
    key,
    ...(name ? { name } : {}),
    ...(reportedKey && reportedKey !== key ? { reportedKey } : {}),
    supports,
    ...(typedDataSupport === undefined ? {} : { typedDataSupport }),
    ...(version ? { version } : {}),
  };
}
