import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

type ResolvedAddress = { address: string; family: 4 | 6 };
type ResolveHost = (hostname: string) => Promise<ResolvedAddress[]>;

const blockedHostnames = new Set(["localhost", "metadata.google.internal"]);

export async function assertSafeMcpEndpoint(endpointUrl: string, resolveHost: ResolveHost = resolveAddresses) {
  let url: URL;
  try {
    url = new URL(endpointUrl);
  } catch {
    throw new Error("MCP endpoint URL is invalid");
  }

  if (url.protocol !== "https:") throw new Error("MCP endpoint must use HTTPS");
  if (url.username || url.password) throw new Error("MCP endpoint URL must not contain credentials");

  const hostname = url.hostname.toLowerCase();
  if (blockedHostnames.has(hostname) || hostname.endsWith(".localhost")) {
    throw new Error("MCP endpoint host is not allowed");
  }

  const addresses = await resolveHost(hostname);
  if (!addresses.length) throw new Error("MCP endpoint host did not resolve");
  if (addresses.some((entry) => isForbiddenAddress(entry.address))) {
    throw new Error("MCP endpoint host resolves to a blocked address");
  }

  return url;
}

export async function guardedEndpointFetch(input: RequestInfo | URL, init?: RequestInit) {
  const rawUrl = input instanceof Request ? input.url : String(input);
  await assertSafeMcpEndpoint(rawUrl);
  return fetch(input, { ...init, redirect: "manual" });
}

async function resolveAddresses(hostname: string) {
  return lookup(hostname, { all: true, verbatim: true }) as Promise<ResolvedAddress[]>;
}

function isForbiddenAddress(address: string) {
  if (isIP(address) === 4) return isForbiddenIpv4(address);
  if (isIP(address) === 6) return isForbiddenIpv6(address);
  return true;
}

function isForbiddenIpv4(address: string) {
  const [a, b] = address.split(".").map((part) => Number(part));
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0) ||
    (a === 192 && b === 0) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
}

function isForbiddenIpv6(address: string) {
  const normalized = address.toLowerCase();
  const mappedIpv4 = mappedIpv4Address(normalized);
  if (mappedIpv4) return isForbiddenIpv4(mappedIpv4);
  return (
    normalized === "::1" ||
    normalized === "::" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe80")
  );
}

function mappedIpv4Address(address: string) {
  const dotted = address.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/);
  if (dotted?.[1] && isIP(dotted[1]) === 4) return dotted[1];

  const hex = address.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  if (!hex) return null;
  const high = Number.parseInt(hex[1], 16);
  const low = Number.parseInt(hex[2], 16);
  if (!Number.isFinite(high) || !Number.isFinite(low)) return null;
  return [high >> 8, high & 255, low >> 8, low & 255].join(".");
}
