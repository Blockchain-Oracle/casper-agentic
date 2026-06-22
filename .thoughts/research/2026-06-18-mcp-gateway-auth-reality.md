# Reality Research: MCP Gateway Auth And API Key Boundaries

## Scope

This pass clarifies where API keys, OAuth, MCP client auth, and Casper x402 wallet authorization belong in the proposed Casper Agent Commerce Gateway.

This is a reality/decision-boundary note, not an implementation plan.

## Sources Checked

- Model Context Protocol authorization tutorial: https://modelcontextprotocol.io/docs/tutorials/security/authorization
- Model Context Protocol draft authorization spec: https://modelcontextprotocol.io/specification/draft/basic/authorization
- Claude MCP connector docs: https://platform.claude.com/docs/en/agents-and-tools/mcp-connector
- CSPR.cloud x402 facilitator docs:
  - https://docs.cspr.cloud/x402-facilitator-api/verify.md
  - https://docs.cspr.cloud/x402-facilitator-api/settle.md
- Context7 attempted for MCP auth queries, but returned `fetch failed`; primary docs were used instead.

## Verified Facts

### MCP Remote Auth Uses OAuth/Bearer Tokens

- MCP authorization docs say authorization is optional but strongly recommended for servers that access user-specific data, need auditing, grant API access requiring consent, support enterprise environments, or need per-user rate limits.
- MCP authorization follows OAuth 2.1 conventions.
- The draft authorization spec says a protected MCP server acts as an OAuth 2.1 resource server, the MCP client acts as an OAuth 2.1 client, and the authorization server issues access tokens.
- MCP servers must use Protected Resource Metadata for authorization server discovery.
- MCP clients use `Authorization: Bearer <access-token>` on HTTP requests to protected remote MCP servers.

### Local stdio Auth Is Different From Remote MCP Auth

- MCP docs distinguish local STDIO servers from remote HTTP-based transports.
- Local STDIO MCP servers can use environment-provided credentials or library-specific auth because the server runs locally.
- OAuth flows are designed for HTTP-based remote MCP servers where the client authorizes access to a remotely hosted MCP server.

### Claude MCP Connector Expects A Token For Protected Remote Servers

- Claude MCP connector docs say that for MCP servers requiring OAuth, API consumers need to obtain an access token and pass it as `authorization_token`.
- The docs say API consumers are expected to handle token refresh as needed.

### x402 Payment Authorization Is Not The Same As MCP Login/Auth

- CSPR.cloud `/verify` docs define x402 `paymentPayload`, `paymentRequirements`, and protected `resource.url`.
- CSPR.cloud `/settle` docs say settlement submits a Casper payment transaction, with the facilitator paying gas and CEP-18 tokens transferring through `transfer_with_authorization`.
- Therefore, x402 wallet/payment authorization proves and settles a paid call; it does not replace user login, dashboard access control, provider auth storage, or MCP client authorization.

## Inferences

- "API key" should not be a single concept in the product. There are at least three credential boundaries:
  1. Provider upstream credentials: API keys/OAuth tokens the provider gives the gateway so it can call the original API/MCP/server.
  2. Consumer/MCP client auth: OAuth/Bearer token/API key proving the user or agent operator is allowed to connect to our hosted MCP endpoint.
  3. Agent wallet authorization: Casper x402 payment signature and settlement proving a paid call was authorized and paid.
- Provider upstream credentials should stay server-side in the gateway and should not be exposed to Cursor, Claude, agents, or consumers.
- For hosted remote MCP, OAuth 2.1 is the standards-aligned target. Static API keys or Bearer headers are simpler but weaker and less portable across clients.
- For hackathon scope, a dual-path auth story may be more realistic: OAuth-compatible hosted MCP as the ideal, plus generated scoped tokens/API keys or a local connector for clients that cannot complete OAuth cleanly.
- The later spec should keep auth/account identity separate from wallet/payment identity. A user can log in as an operator, connect/fund a Casper wallet, and then authorize paid calls through x402.

## Unknowns And Questions

- Which MCP clients must work in the demo: Cursor, Claude Desktop, Claude Code, Claude API connector, or generic MCP Inspector.
- Whether we need full OAuth 2.1 during the hackathon MVP or can present a scoped bearer/API-key fallback with clear non-goals.
- Whether wallet identity should be linked to platform user identity, or whether agent wallets can operate as independent payment identities with optional platform accounts.
- Whether provider upstream OAuth should be supported in MVP, or whether static API-key/header vaulting is enough for the first demo.

## Not Included

- No final auth architecture.
- No chosen identity provider.
- No implementation plan.
- No claim that API keys are safe enough for production remote MCP without scoping, rotation, and audit controls.
