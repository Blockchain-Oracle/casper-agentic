import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import { describe, expect, it } from "vitest";

const guard = await import(pathToFileURL(join(process.cwd(), "scripts/guard-workflows.mjs")).href);

describe("workflow guard", () => {
  it("accepts the current package scripts and workflows", () => {
    const packageJson = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf8"));
    const ci = readFileSync(join(process.cwd(), ".github/workflows/ci.yml"), "utf8");
    const prune = readFileSync(join(process.cwd(), ".github/workflows/prune-feed-state.yml"), "utf8");

    expect(guard.checkPackageScripts(packageJson)).toEqual([]);
    expect(guard.checkCiWorkflow(ci)).toEqual([]);
    expect(guard.checkPruneWorkflow(prune)).toEqual([]);
    expect(guard.runWorkflowGuard()).toEqual([]);
  });

  it("requires workflow guard inside verify and frozen install inside ci", () => {
    const packageJson = {
      scripts: {
        ci: "pnpm install && pnpm verify && pnpm test:browser && pnpm build",
        verify: "pnpm guard:files && pnpm guard:product && pnpm guard:secrets && pnpm test && pnpm typecheck && pnpm lint",
      },
    };

    expect(guard.checkPackageScripts(packageJson)).toEqual([
      "package.json: verify script missing guard:workflows",
      "package.json: ci script missing install --frozen-lockfile",
    ]);
  });

  it("does not treat test:browser as the unit test gate", () => {
    const packageJson = {
      scripts: {
        ci: "pnpm install --frozen-lockfile && pnpm verify && pnpm test:browser && pnpm build",
        verify:
          "pnpm guard:files && pnpm guard:product && pnpm guard:secrets && pnpm guard:workflows && pnpm test:browser && pnpm typecheck && pnpm lint",
      },
    };

    expect(guard.checkPackageScripts(packageJson)).toEqual(["package.json: verify script missing test"]);
  });

  it("rejects CI workflows that skip browser smoke or build gates", () => {
    const findings = guard.checkCiWorkflow(`
name: CI
on:
  pull_request:
jobs:
  verify:
    steps:
      - uses: pnpm/action-setup@v4
        with:
          version: 10.33.0
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm verify
`);

    expect(findings).toContain("ci.yml: missing push trigger");
    expect(findings).toContain("ci.yml: missing browser smoke command");
    expect(findings).toContain("ci.yml: missing build command");
  });

  it("rejects prune workflows that run on push or omit the database secret check", () => {
    const findings = guard.checkPruneWorkflow(`
name: Prune Feed State
on:
  workflow_dispatch:
  push:
jobs:
  prune:
    env:
      DATABASE_URL: \${{ secrets.DATABASE_URL }}
    steps:
      - uses: pnpm/action-setup@v4
        with:
          version: 10.33.0
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: pnpm install --frozen-lockfile
      - run: pnpm maintenance:prune-feed
`);

    expect(findings).toContain("prune-feed-state.yml: missing schedule trigger");
    expect(findings).toContain("prune-feed-state.yml: missing database secret check");
    expect(findings).toContain("prune-feed-state.yml: unexpected push trigger");
  });

  it("rejects privileged non-manual prune workflow triggers", () => {
    const findings = guard.checkPruneWorkflow(`
name: Prune Feed State
on:
  workflow_dispatch:
  schedule:
    - cron: "17 * * * *"
  pull_request_target:
jobs:
  prune:
    env:
      DATABASE_URL: \${{ secrets.DATABASE_URL }}
    steps:
      - run: test -n "$DATABASE_URL"
      - uses: pnpm/action-setup@v4
        with:
          version: 10.33.0
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: pnpm install --frozen-lockfile
      - run: pnpm maintenance:prune-feed
`);

    expect(findings).toContain("prune-feed-state.yml: unexpected pull_request_target trigger");
  });

  it("rejects privileged prune triggers after blank lines in the on block", () => {
    const findings = guard.checkPruneWorkflow(`
name: Prune Feed State
on:
  workflow_dispatch:
  schedule:
    - cron: "17 * * * *"

  pull_request_target:
jobs:
  prune:
    env:
      DATABASE_URL: \${{ secrets.DATABASE_URL }}
    steps:
      - run: test -n "$DATABASE_URL"
      - uses: pnpm/action-setup@v4
        with:
          version: 10.33.0
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: pnpm install --frozen-lockfile
      - run: pnpm maintenance:prune-feed
`);

    expect(findings).toContain("prune-feed-state.yml: unexpected pull_request_target trigger");
  });
});
