import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = process.cwd();

export function checkPackageScripts(packageJson) {
  const findings = [];
  const scripts = packageJson.scripts ?? {};
  requireScriptCommands(findings, scripts, "verify", [
    ["guard:files", "pnpm guard:files"],
    ["guard:product", "pnpm guard:product"],
    ["guard:secrets", "pnpm guard:secrets"],
    ["guard:workflows", "pnpm guard:workflows"],
    ["test", "pnpm test"],
    ["typecheck", "pnpm typecheck"],
    ["lint", "pnpm lint"],
  ]);
  requireScriptCommands(findings, scripts, "ci", [
    ["install --frozen-lockfile", "pnpm install --frozen-lockfile"],
    ["verify", "pnpm verify"],
    ["test:browser", "pnpm test:browser"],
    ["test:browser:csprclick", "pnpm test:browser:csprclick"],
    ["build", "pnpm build"],
  ]);
  return findings;
}

export function checkCiWorkflow(text) {
  return checkText("ci.yml", text, [
    ["pull request trigger", /\bpull_request:/],
    ["push trigger", /\bpush:/],
    ["main branch", /-\s*main\b/],
    ["feature branches", /-\s*["']?feat\/\*\*["']?/],
    ["pnpm setup action", /pnpm\/action-setup@v4/],
    ["pnpm version", /version:\s*10\.33\.0/],
    ["node setup action", /actions\/setup-node@v4/],
    ["node 20", /node-version:\s*20\b/],
    ["pnpm cache", /cache:\s*pnpm\b/],
    ["frozen install", /pnpm install --frozen-lockfile/],
    ["playwright chromium install", /pnpm exec playwright install --with-deps chromium/],
    ["verify command", /pnpm verify/],
    ["browser smoke command", /^\s*-?\s*run:\s*pnpm test:browser\s*$/m],
    ["csprclick browser smoke command", /^\s*-?\s*run:\s*pnpm test:browser:csprclick\s*$/m],
    ["build command", /pnpm build/],
  ]);
}

export function checkPruneWorkflow(text) {
  const findings = checkWorkflowTriggers("prune-feed-state.yml", text, ["workflow_dispatch", "schedule"]);
  findings.push(...checkText("prune-feed-state.yml", text, [
    ["workflow dispatch trigger", /\bworkflow_dispatch:/],
    ["schedule trigger", /\bschedule:/],
    ["cron schedule", /cron:\s*["']17 \* \* \* \*["']/],
    ["database secret env", /\bDATABASE_URL:\s*\$\{\{\s*secrets\.DATABASE_URL\s*\}\}/],
    ["database secret check", /test -n "\$DATABASE_URL"/],
    ["pnpm setup action", /pnpm\/action-setup@v4/],
    ["pnpm version", /version:\s*10\.33\.0/],
    ["node setup action", /actions\/setup-node@v4/],
    ["node 20", /node-version:\s*20\b/],
    ["frozen install", /pnpm install --frozen-lockfile/],
    ["prune command", /pnpm maintenance:prune-feed/],
  ]));
  return findings;
}

export function runWorkflowGuard(projectRoot = root) {
  const packageJson = JSON.parse(readFileSync(join(projectRoot, "package.json"), "utf8"));
  const ci = readFileSync(join(projectRoot, ".github/workflows/ci.yml"), "utf8");
  const prune = readFileSync(join(projectRoot, ".github/workflows/prune-feed-state.yml"), "utf8");
  return [
    ...checkPackageScripts(packageJson),
    ...checkCiWorkflow(ci),
    ...checkPruneWorkflow(prune),
  ];
}

function requireScriptCommands(findings, scripts, name, commands) {
  const script = scripts[name];
  if (!script) {
    findings.push(`package.json: missing ${name} script`);
    return;
  }
  const commandSet = new Set(script.split("&&").map((command) => command.trim()).filter(Boolean));
  for (const [label, command] of commands) {
    if (!commandSet.has(command)) findings.push(`package.json: ${name} script missing ${label}`);
  }
}

function checkText(file, text, rules) {
  return rules.flatMap(([label, pattern]) => (pattern.test(text) ? [] : [`${file}: missing ${label}`]));
}

function checkWorkflowTriggers(file, text, allowed) {
  const onBlock = workflowOnBlock(text);
  const triggers = onBlock
    .split(/\r?\n/)
    .map((line) => line.match(/^[^\S\r\n]{2}([A-Za-z_]+):/)?.[1])
    .filter(Boolean);
  const allowedSet = new Set(allowed);
  return triggers
    .filter((trigger) => !allowedSet.has(trigger))
    .map((trigger) => `${file}: unexpected ${trigger} trigger`);
}

function workflowOnBlock(text) {
  const lines = text.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim() === "on:");
  if (start === -1) return "";
  const body = [];
  for (const line of lines.slice(start + 1)) {
    if (/^\S/.test(line) && line.trim() !== "") break;
    body.push(line);
  }
  return body.join("\n");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const findings = runWorkflowGuard();
  if (findings.length) {
    console.error("Workflow guard findings:");
    for (const finding of findings) console.error(`  - ${finding}`);
    process.exit(1);
  }
}
