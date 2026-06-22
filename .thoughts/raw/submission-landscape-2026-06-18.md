# Source Notes: Submission And Repo Landscape

Research date: 2026-06-18

Purpose: preserve the search surfaces used for the Casper Agentic Buildathon opportunity-landscape pass. This is not an exhaustive list of submissions.

## Official And Platform Sources

- DoraHacks buildathon page: https://dorahacks.io/hackathon/casper-agentic-buildathon/buidl
- DoraHacks detail page: https://dorahacks.io/hackathon/casper-agentic-buildathon/detail
- Casper AI Toolkit: https://www.casper.network/ai

## DoraHacks Submission Search Hits

Searches used:

- `site:dorahacks.io/buidl Casper Agentic Buildathon x402 RWA Oracle Agent Casper DiFi Agent AgentPay Chainleash cred402`
- `site:dorahacks.io/buidl "Casper RWA Oracle Agent"`
- `site:dorahacks.io/buidl "AgentPay-x402" "Casper"`
- `site:dorahacks.io/buidl "CasperRWA-Agent"`
- `site:dorahacks.io/buidl "Quorum" "Casper Agentic Buildathon"`
- `site:dorahacks.io/buidl "Verity" "x402" "Casper"`

Observed hits:

- Casper DiFi Agent: https://dorahacks.io/buidl/44571
- Casper DiFi Agent milestones: https://dorahacks.io/buidl/44571/milestones
- Agent Casper: https://dorahacks.io/buidl/44340
- Casper RWA Oracle Agent: https://dorahacks.io/buidl/44468
- Chainleash: https://dorahacks.io/buidl/44271
- CasperRWA-Agent: https://dorahacks.io/buidl/44481
- AgentPay-x402: https://dorahacks.io/buidl/44260
- EffortXq milestones: https://dorahacks.io/buidl/44150/milestones
- cred402 appeared in DoraHacks global buidl search snippets but a stable direct DoraHacks page URL was not captured in this pass.

## GitHub Search Commands

Command:

```bash
gh search repos "casper agentic buildathon" --limit 50 --json fullName,description,createdAt,updatedAt,pushedAt,language,url,stargazersCount
```

Observed hits returned by GitHub:

| Repo | Description signal | Language | Created | Pushed |
| --- | --- | --- | --- | --- |
| https://github.com/AiFinPay/aifinpay-casper | AI agent settlement layer | Rust | 2026-06-03 | 2026-06-03 |
| https://github.com/ryonzhang/casper-quorum | Multi-agent treasury council | TypeScript | 2026-06-10 | 2026-06-15 |
| https://github.com/kite-builds/casper-rwa-agent | x402-paying RWA rent settlement agent | Rust | 2026-06-08 | 2026-06-17 |
| https://github.com/3078024889/casperguard | RWA compliance oracle agent | HTML | 2026-06-16 | 2026-06-16 |
| https://github.com/qanzhi111/x402-api-casper | x402 crypto API | JavaScript | 2026-06-02 | 2026-06-06 |
| https://github.com/msanlisavas/chainleash | Protocol-governed autonomous treasury agent | C# | 2026-06-05 | 2026-06-16 |
| https://github.com/prakash023-hub/Pharmaguard-chain | Clinical compliance attestation agent | Python | 2026-06-14 | 2026-06-14 |
| https://github.com/codebycinar/aegis402 | x402-native risk gate | TypeScript | 2026-06-17 | 2026-06-17 |
| https://github.com/Bekirerdem/casper-trust-layer | Identity, escrow-derived reputation, agent-to-agent escrow | Rust | 2026-06-17 | 2026-06-17 |
| https://github.com/gogrowth-co/sasha-x402-kit | Verifiable/payable DeFi book over x402 | Go | 2026-06-10 | 2026-06-10 |
| https://github.com/zhangyunhaibot/VouchAgent | Trust layer, reputation, hire escrow, adversarial verification | HTML | 2026-06-16 | 2026-06-18 |
| https://github.com/lingjieheti-ops/kismet-bazaar | Parametric insurance bazaar underwritten by machines | TypeScript | 2026-06-12 | 2026-06-12 |
| https://github.com/tang-vu/verity | Reputation-staked x402 signal oracle and DeFi agent | TypeScript | 2026-06-17 | 2026-06-18 |
| https://github.com/antidumpalways/ParkFlow-Agent | Multi-role swarm with x402, CSPR.cloud MCP, CSPR.trade MCP | TypeScript | 2026-06-08 | 2026-06-15 |

Command:

```bash
gh search repos "casper x402" --limit 50 --json fullName,description,createdAt,updatedAt,pushedAt,language,url,stargazersCount
```

Observed hits returned by GitHub:

| Repo | Description signal | Language | Created | Pushed |
| --- | --- | --- | --- | --- |
| https://github.com/make-software/casper-x402 | x402 Facilitator for Casper | Go | 2026-05-12 | 2026-06-17 |
| https://github.com/Adarsh-Dhar/casper-x402 | Unlabeled Casper x402 repo | Rust | 2025-12-16 | 2025-12-29 |
| https://github.com/odradev/casper-x402-poc | Casper x402 proof of concept | Rust | 2026-03-17 | 2026-05-27 |

## Representative README Checks

Metadata and README slices were checked with `gh repo view` and `gh api repos/<owner>/<repo>/readme` for:

- https://github.com/wangyichang-studo/casper-rwa-oracle-agent
- https://github.com/icohangar-ops/AgentPay
- https://github.com/caelum0x/cred402
- https://github.com/tang-vu/verity
- https://github.com/ryonzhang/casper-quorum
- https://github.com/kite-builds/casper-rwa-agent
- https://github.com/alsaecas/cspr-agentpay-guard
- https://github.com/kei99-web3/casper-proofpay-rwa-agent

## Caveats

- GitHub search is query-dependent and can miss repos whose README/description does not use the exact searched terms.
- DoraHacks pages can be difficult to fetch directly because of platform protections, so search result snippets and GitHub evidence were combined with the user-provided brief.
- Repository README claims were not independently replayed unless already covered in earlier local docs-repo research. Treat live transaction links as claims requiring later verification before build decisions.
