import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { basename, join, relative } from "node:path";

const root = process.cwd();
const excludedDirs = new Set([
  ".git",
  ".next",
  ".thoughts/raw/repos",
  "coverage",
  "node_modules",
  "playwright-report",
  "test-results",
]);
const excludedFiles = new Set(["pnpm-lock.yaml"]);
const sensitiveFilePattern = /(^|[/\\])\.env(?!\.example$)|\.pem$/i;
const contentRules = [
  { label: "private key block", pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  { label: "live-looking secret", pattern: /\b(?:sk_live|pk_live)_[A-Za-z0-9_-]+/ },
  {
    label: "non-empty CSPR cloud token",
    pattern: /^CSPR_CLOUD_API_KEY[^\S\r\n]*=[^\S\r\n]*(?!$|changeme$|<|#).+/m,
  },
  {
    label: "non-empty private key path",
    pattern: /^CASPER_TESTNET_SIGNER_PRIVATE_KEY_PEM[^\S\r\n]*=[^\S\r\n]*(?!$|<|#).+/m,
  },
  {
    label: "non-empty operator token",
    pattern: /^CASPER_GW_OPERATOR_TOKEN[^\S\r\n]*=[^\S\r\n]*(?!$|changeme$|<|#).+/m,
  },
  {
    label: "non-empty wallet encryption key",
    pattern: /^CASPER_GW_WALLET_ENCRYPTION_KEY[^\S\r\n]*=[^\S\r\n]*(?!$|changeme$|<|#).+/m,
  },
];

function shouldSkipPath(path) {
  const rel = relative(root, path).replaceAll("\\", "/");
  if (!rel || excludedFiles.has(rel)) return true;
  return [...excludedDirs].some((dir) => rel === dir || rel.startsWith(`${dir}/`));
}

function isIgnoredByGit(path) {
  const rel = relative(root, path);
  try {
    execFileSync("git", ["check-ignore", "-q", "--", rel], { cwd: root, stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function collectFiles(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (shouldSkipPath(path)) continue;
    const stat = statSync(path);
    if (isIgnoredByGit(path)) continue;
    if (stat.isDirectory()) collectFiles(path, files);
    else if (stat.isFile()) files.push(path);
  }
  return files;
}

const findings = [];

for (const file of collectFiles(root)) {
  const rel = relative(root, file);
  if (basename(file) !== ".env.example" && sensitiveFilePattern.test(rel)) {
    findings.push(`${rel}: sensitive file name must not be committed`);
    continue;
  }

  let text = "";
  try {
    text = readFileSync(file, "utf8");
  } catch {
    continue;
  }

  for (const rule of contentRules) {
    if (rule.pattern.test(text)) findings.push(`${rel}: ${rule.label}`);
  }
}

if (findings.length) {
  console.error("Secret guard findings:");
  for (const finding of findings) console.error(`  - ${finding}`);
  process.exit(1);
}
