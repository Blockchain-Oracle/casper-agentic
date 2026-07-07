# Casper GW — demo video + 5-slide deck prompt (for an AI agent)

Paste this whole file to an AI agent (or a slides/video tool). It has three parts:
**(A) the facts** it must stay accurate to, **(B) a 5-slide deck spec**, and
**(C) a ~3-minute demo-video script** modeled on the real first-run flow. Do not
invent metrics or say "anonymous/untraceable" — this is a payments gateway, not a
privacy tool. Every "settled" claim is backed by a real Casper deploy hash.

---

## A. Facts (ground truth — do not contradict)

- **What it is:** Casper GW is **MCPay, on Casper** — an x402 payment gateway. A provider
  prices MCP/API tools in WCSPR; an AI agent pays **per call** with a scoped `casper_` API
  key; the gateway signs the x402 payment with its own funded Casper wallet, settles it via
  the **CSPR.cloud x402 facilitator**, and returns a **real Casper deploy hash**.
- **Live:** testnet **https://cspr-gw.xyz**, mainnet **https://mainnet.cspr-gw.xyz**
  (network is per-domain), explorer **https://cspr-gw.xyz/explorer**, source
  **https://github.com/Blockchain-Oracle/casper-agentic**.
- **The proof:** every paid call is public — tool · amount · deploy hash on `/explorer` and
  `/receipt/[id]`, a 3-layer receipt (gateway context → x402 verify/settle → Casper proof),
  linking straight to cspr.live.
- **Honesty:** gateway signer is a managed wallet (not user custody); mainnet is deployed but
  real-money settlement waits on a funded mainnet wallet; WCSPR is the settle-able asset.
- **Why agentic:** the API key IS the agent's spend boundary — allowed tools · spend cap ·
  funded WCSPR tab. Agents pay for services autonomously, with cryptographic proof per call.

## B. 5-slide deck spec

Aesthetic: **Proof-Print** — dark carbon background (#0b0b0c), bone/near-white text, one
reserved accent Casper red **#FF473E**, monospace eyebrows, tabular numerals. Reuse the
repo banner and rendered diagrams in `assets/` and `assets/diagrams/`.

1. **Title** — "Casper GW — proof for every agent payment." Subtitle: "An x402 payment
   gateway on Casper. Agents pay per call; every settlement is on-chain." Show the banner
   (`assets/banner.png`) and the URL `cspr-gw.xyz`.
2. **Problem** — AI agents can call tools but can't *pay* for them natively. Providers can't
   meter/charge per call without building billing. Answer: pay-per-call with on-chain proof.
3. **Solution** — the agentic loop in one line: *register a server → price tools in WCSPR →
   agent pays with an API key → gateway settles on Casper → verify the deploy.* Use
   `assets/diagrams/architecture.png`.
4. **How a paid call settles** — the sequence: key verified → gateway signs x402 → CSPR.cloud
   facilitator verify/settle → WCSPR transfer to the provider → real deploy hash → tool runs.
   Use `assets/diagrams/settle-sequence.png`. Callout: "a rejected key never settles."
5. **Proof & CTA** — a real receipt with a deploy-hash link to cspr.live; the evidence table
   (deploy `829f0704…`, `37a85c9a…`). CTA: "Browse the explorer — no sign-in — at
   cspr-gw.xyz/explorer. Testnet now, mainnet-ready at mainnet.cspr-gw.xyz."

## C. Demo-video script (~3:00, 140 wpm; jump-cut the on-chain waits with an honest timer)

Pre-stage: a funded `casper_` key ready; the gateway wallet holding WCSPR; a browser on
`cspr-gw.xyz`; an MCP client (Cursor/Claude) connected to a registered server; the explorer
open in a second tab.

### [0:00 — HOOK]
AI agents can *do* almost anything now — except pay for what they use. Every API, every tool,
still assumes a human with a credit card. Casper GW fixes that: agents pay **per call**, on
Casper, and every payment leaves a receipt anyone can verify.

### [0:18 — REGISTER & PRICE]
Here's the provider side. I point the gateway at an MCP server — it discovers the tools. I
price one in WCSPR, and the payout goes to **my own connected wallet**. Publish. That tool is
now a paid endpoint.

### [0:45 — GET A FUNDED KEY]
Now the agent side. I mint a `casper_` key — scoped to specific tools, with a spend cap — and
fund it by depositing CSPR. It wraps to WCSPR automatically and credits the key. The key is
the agent's wallet.

### [1:10 — PAY PER CALL]
From my MCP client, the agent calls the tool with that key. The gateway checks the key, signs
an x402 payment with its own Casper wallet, and settles it through CSPR.cloud. A second later:
the tool result comes back — **and** a payment response with a real deploy hash.

### [1:45 — VERIFY THE PROOF]
This is the part that matters. Open the explorer — public, no sign-in. There's the call: the
tool, the amount, the deploy hash. Click it — straight to cspr.live, a real accepted Casper
deploy. The receipt breaks it into three honest layers: what the gateway saw, the x402
verify/settle, and the on-chain proof.

### [2:15 — HONESTY + NETWORK]
We never fake it. A revoked or over-budget key returns an error and **never** settles. The
gateway wallet is managed, and we say so. And the network is the domain: this is
`cspr-gw.xyz` on testnet; `mainnet.cspr-gw.xyz` is the same app on Casper mainnet.

### [2:40 — CLOSE]
Register a server, price a tool, hand an agent a key — and every payment it makes is proven on
Casper. That's Casper GW. Browse it yourself at cspr-gw dot xyz.

---

**Production notes:** narrate over real screen capture of `cspr-gw.xyz` (don't mock UI).
Show one real deploy on cspr.live. Keep the reserved red accent for CTAs/proof only. Export a
`demo-thumbnail.jpg` (the receipt with the deploy hash) for the README video embed.
