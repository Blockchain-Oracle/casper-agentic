import type { CSPRClickClient } from "./csprclick-browser-config";
import { clean } from "./csprclick-browser-config";
import { csprClickProviderCapability } from "./csprclick-provider-info";

export async function getCSPRClickProviderCapabilities(client: CSPRClickClient, providerKeys: string[]) {
  if (!client.getProviderInfo) return [];
  const keys = Array.from(new Set(providerKeys.map((key) => clean(key)).filter(Boolean) as string[]));
  return Promise.all(keys.map((providerKey) => getCapability(client, providerKey)));
}

async function getCapability(client: CSPRClickClient, providerKey: string) {
  try {
    return csprClickProviderCapability({
      provider: await client.getProviderInfo?.(providerKey),
      providerKey,
    });
  } catch {
    return csprClickProviderCapability({ providerKey });
  }
}
