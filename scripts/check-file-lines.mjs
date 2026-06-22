import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const warnLines = Number(process.env.FILE_LINE_WARN ?? 200);
const maxLines = Number(process.env.FILE_LINE_MAX ?? 300);
const extensions = new Set([".css", ".js", ".jsx", ".mjs", ".cjs", ".ts", ".tsx"]);
const excludedDirs = new Set([
  ".git",
  ".next",
  ".thoughts/raw/repos",
  "coverage",
  "node_modules",
  "playwright-report",
  "test-results",
]);
const excludedFiles = new Set(["pnpm-lock.yaml", "next-env.d.ts"]);

function shouldSkipPath(path) {
  const rel = relative(root, path).replaceAll("\\", "/");
  if (!rel || excludedFiles.has(rel)) return true;
  return [...excludedDirs].some((dir) => rel === dir || rel.startsWith(`${dir}/`));
}

function extensionOf(path) {
  const match = path.match(/(\.[^.]+)$/);
  return match?.[1] ?? "";
}

function collectFiles(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (shouldSkipPath(path)) continue;

    const stat = statSync(path);
    if (stat.isDirectory()) {
      collectFiles(path, files);
      continue;
    }
    if (stat.isFile() && extensions.has(extensionOf(path))) files.push(path);
  }
  return files;
}

const warnings = [];
const failures = [];

for (const file of collectFiles(root)) {
  const lines = readFileSync(file, "utf8").split("\n").length;
  const rel = relative(root, file);
  if (lines > maxLines) failures.push(`${rel}: ${lines} lines > ${maxLines}`);
  else if (lines > warnLines) warnings.push(`${rel}: ${lines} lines > ${warnLines}`);
}

if (warnings.length) {
  console.warn("File line warnings:");
  for (const warning of warnings) console.warn(`  - ${warning}`);
}

if (failures.length) {
  console.error("File line failures:");
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}
