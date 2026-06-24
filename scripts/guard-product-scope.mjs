import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const scanRoots = ["src"];
const blocked = [
  { label: "private tool", pattern: /\bprivate tools?\b/i },
  { label: "private registry", pattern: /\bprivate registr(?:y|ies)\b/i },
  { label: "hidden registry", pattern: /\bhidden registry\b/i },
  { label: "demo sandbox", pattern: /\bdemo sandbox\b/i },
  { label: "sandbox", pattern: /\bsandbox\b/i },
  { label: "simulated mode", pattern: /\bsimulated\b/i },
  { label: "local mode", pattern: /\blocal\b/i },
  { label: "send policy", pattern: /\bsend policy\b/i },
  { label: "fake deploy", pattern: /\bfake deploy\b/i },
  { label: "registry route", pattern: /registry/i },
  { label: "hosted custody signer", pattern: /\bHosted encrypted signer\b/i },
];
const extensions = new Set([".css", ".js", ".jsx", ".mjs", ".cjs", ".ts", ".tsx"]);

function extensionOf(path) {
  const match = path.match(/(\.[^.]+)$/);
  return match?.[1] ?? "";
}

function collectFiles(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      collectFiles(path, files);
      continue;
    }
    if (stat.isFile() && extensions.has(extensionOf(path))) files.push(path);
  }
  return files;
}

const findings = [];

for (const scanRoot of scanRoots) {
  for (const file of collectFiles(join(root, scanRoot))) {
    const rel = relative(root, file);
    const lines = readFileSync(file, "utf8").split("\n");
    lines.forEach((line, index) => {
      for (const rule of blocked) {
        if (rule.pattern.test(line)) findings.push(`${rel}:${index + 1} rejected ${rule.label}`);
      }
    });
  }
}

if (findings.length) {
  console.error("Rejected product-scope terms found in active source:");
  for (const finding of findings) console.error(`  - ${finding}`);
  process.exit(1);
}
