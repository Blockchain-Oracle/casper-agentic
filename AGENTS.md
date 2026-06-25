# AGENTS.md

## Project Snapshot

Casper GW / Casper Agent Commerce Gateway is a Next.js App Router prototype for the Casper Agentic Buildathon. Current prototype work is still under Context Engineering review; do not treat any downloaded prototype as accepted product truth until prototype-discovery and prototype-reintegration artifacts say so.

Authoritative context lives in `.thoughts/`: wiki, research, raw reports, cloned reference repos, quality profile, spec, stories, designer brief, prototype discovery, prototype reintegration, and research-backed plan. Start with `.thoughts/README.md` for the current read order and stage status before opening deeper artifacts.

## Research Source Order

- For Casper GW product, UX, MCP Pay/x402 inspiration, wallet-policy, registry, explorer, or hackathon-positioning questions, inspect local project context first:
  - `.thoughts/wiki/`
  - `.thoughts/research/`
  - `.thoughts/raw/`
  - `.thoughts/raw/repos/`
  - `.thoughts/prototype-discovery/`
  - `.thoughts/prototype-reintegration/`
- Do not browse the web for MCP Pay, x402 agent patterns, Casper GW product direction, or prior reference projects until local reports and cloned repos have been checked.
- If local context is insufficient, say exactly what was checked and ask Abu before doing broad web research, unless Abu explicitly requested online research in that turn.
- Context7 is still required for current library/API/SDK/CLI syntax, but it does not replace local `.thoughts/` research for product decisions.
- Do not make product decisions from memory when `.thoughts/` contains relevant research.
- Before any meaningful implementation change, do a short local-reference checkpoint and mention which artifacts informed the decision. At minimum, check `.thoughts/README.md`, the active spec/plan/audit for the slice, and any relevant `.thoughts/raw/` or `.thoughts/raw/repos/` references for MCP Pay-style flows, x402 agent/payment patterns, provider discovery, receipt behavior, and UX patterns.
- Use cloned/reference repos as practical pattern references, not source to copy. Prefer their proven flow shape over inventing new product behavior, then use Context7/current docs for the exact SDK/API syntax needed to implement that flow.
- For CSPR.click work, check the installed official skill first at `/Users/abu/.codex/skills/csprclick-skill/SKILL.md`, then the local upstream examples clone at `.thoughts/raw/repos/csprclick-examples/`, then the Casper x402 CSPR.click reference under `.thoughts/raw/repos/casper-x402/go/examples/csprclick-x402/`, then Context7/direct CSPR.click docs for exact current SDK syntax.

## Working Rules

- Follow Abu Context Engineering skills for stage changes; do not skip from prototype evidence to broad implementation without an accepted plan.
- Treat the prototype as evidence, not source code to copy blindly.
- Keep provider upstream credentials, MCP client access auth, and x402 wallet/payment authorization separate.
- Keep receipt layers separate: gateway context, policy decision, x402 verify/settle, and Casper proof.
- Do not claim live Casper settlement unless a real Casper transaction/deploy hash exists.
- Do not present `Simulated` or `Local` as user-facing product modes unless Abu explicitly re-accepts that direction. Product framing is Casper Testnet first, with Mainnet later/gated if shown.
- Public explorer is public infrastructure: `/explorer` and receipt detail pages must be viewable without sign-in, wallet connection, or the authenticated app sidebar.
- Authenticated `/app` is for provider setup, tool pricing/publishing, endpoints, wallet policies, paid-call testing, settings, and audit.
- Do not invent private tools, private registries, or hidden registry modes unless accepted `.thoughts/` artifacts explicitly require them.
- Treat any registry as optional discovery/catalogue behavior, not the source of truth for wallet allowlists.
- Wallet policy means spend and permission controls for agent calls. Do not invent a separate "send policy" product unless Abu explicitly asks.
- A paid-tool test console should work like an MCP/x402 tool runner: user selects or pastes an MCP/x402 endpoint URL, tools are discovered, the user selects a tool, input fields are generated only if the tool needs inputs, wallet/policy is selected, then the call is paid/signed and a receipt is produced.

## Commands

Use `pnpm@10.33.0` for this project. Do not reintroduce `package-lock.json`.

```bash
pnpm lint
pnpm typecheck
pnpm build
pnpm dev
```

Use Context7 for current framework/library/API/SDK/CLI docs:

```bash
eval "$(/opt/homebrew/bin/brew shellenv)" && npx ctx7@latest library <name> "<question>"
eval "$(/opt/homebrew/bin/brew shellenv)" && npx ctx7@latest docs <libraryId> "<question>"
```

## Quality Gates

- Run lint, typecheck, and build before claiming implementation progress is stable.
- Browser checks must cover desktop and mobile, public explorer routes, authenticated app routes, paid-tool test-console routing, receipt proof layers, and Testnet/Mainnet labeling.
- Source files target 200 lines, warn above 200, and hard-fail above 300 unless generated or explicitly justified in `.thoughts/quality/`.
- Do not enforce app source rules against cloned reference repos under `.thoughts/raw/repos/`.

## Do Not

- Do not commit `.env`, wallet keys, seed phrases, CSPR.cloud tokens, provider API keys, or private keys.
- Do not use live-looking mock secret prefixes such as `sk_live`.
- Do not expose provider upstream credentials in client config, receipts, registry, exports, browser state, or user-facing logs.
- Do not introduce CDR, Story Protocol, or cdr-kit product semantics into Casper GW unless Abu explicitly accepts that direction.


<claude-mem-context>
# Memory Context

# [casper-agentic] recent context, 2026-06-21 2:06pm GMT+1

Legend: 🎯session 🔴bugfix 🟣feature 🔄refactor ✅change 🔵discovery ⚖️decision 🚨security_alert 🔐security_note
Format: ID TIME TYPE TITLE
Fetch details: get_observations([IDs]) | Search: mem-search skill

Stats: 24 obs (11,909t read) | 152,931t work | 92% savings

### Jun 19, 2026
23657 10:11a 🔵 Abu Context Engineering Workflow with Prototype-Reintegration Gate
23659 10:12a ✅ Documentation clarification: Prototype boundaries and reintegration workflow
23661 " ✅ Prototype-reintegration skill elevated to visible documentation across plugin manifests
23663 " ✅ Comprehensive workflow enforcement: Prototype-reintegration gate made mandatory across all skills
23666 10:13a 🔵 Plugin validation passed for updated abu-context-engineering with prototype-reintegration enforcement
23668 " 🔵 Plugin cachebuster updated and re-validated after workflow refactor
23674 10:14a 🟣 Abu Context Engineering plugin deployed to Codex with prototype-reintegration enforcement
23676 " 🔵 Deployed plugin verified in Codex cache with prototype-reintegration skill active
23679 10:15a 🔵 Prototype-reintegration enforcement systematically integrated throughout plugin documentation
23680 " ✅ Designer-brief skill description refined to emphasize mock boundary
23681 " 🔵 Incremental designer-brief refinement validated and deployed to Codex
23683 " 🔵 Final plugin state verified: prototype-reintegration workflow deployed and active in Codex
23685 10:16a 🔵 Plugin validated for Claude Code platform with prototype-reintegration enforcement
S2891 Update abu-context-engineering plugin to version 0.4.2 with prototype-reintegration skill and validate configuration (Jun 19 at 10:16 AM)
S2888 Clarify and enforce the context engineering workflow: Abu brought a prototype but was not following the required prototype-discovery → prototype-reintegration → spec/story/quality deltas → plan sequence. The session addressed confusion about workflow requirements and fixed the plugin to make prototype-reintegration a mandatory, non-skippable gate. (Jun 19 at 10:16 AM)
S2893 User providing feedback that Claude failed to follow established "context engineering skill" workflow when receiving a high-fidelity prototype for review and reintegration planning (Jun 19 at 10:25 AM)
S2894 Abu expressed frustration that the agent forgot the Context Engineering prototype handoff workflow (discovery → reintegration → planning → implementation → verification → handoff). Created goal-writer skill to codify the post-prototype process and ensure agents follow gates in order while preserving prototype fidelity. (Jun 19 at 10:37 AM)
23721 10:38a ✅ abu-context-engineering plugin infrastructure and skills refactor underway
23724 10:39a 🔵 prototype-reintegration skill initialized but lacks agents/openai.yaml metadata
23725 " 🟣 goal-writer skill scaffold created for Context Engineering plugin
23727 " 🔵 goal-writer skill initialization has incomplete asset directory and default_prompt formatting issue
S3056 Comprehensive audit of Casper Gateway UI redesign against actual product intent and business logic; produce audit document and copy-paste prompt for design agents (Jun 19 at 10:46 AM)
### Jun 21, 2026
26561 12:51p 🔵 OneMem memory system not configured in casper-agentic project
26562 " ⚖️ Plan to reconcile explorer design with public/private route model
26563 " ✅ Prototype reintegration audit and designer correction prompt created for Casper GW redesign
26565 12:52p ✅ Audit and designer prompt updated with public/private explorer route model
S3060 Casper GW redesign correction: clarify that the Casper x402 explorer must be public infrastructure, not a gated dashboard page inside the app shell (Jun 21 at 12:53 PM)
26671 2:02p 🔵 Casper Gateway prototype audit identifies critical design misalignments requiring corrections before implementation
26672 2:03p 🔵 Prototype registry implementation includes unsupported private tools feature; research confirms public/private tool concept was not in design discussion
26678 2:05p ⚖️ V2 Casper Gateway prototype audit documents registry removal, blocks implementation planning until corrections accepted

Access 153k tokens of past work via get_observations([IDs]) or mem-search skill.
</claude-mem-context>
