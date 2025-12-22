# Binetic AGI - AI Coding Agent Instructions

## What This Repo Is

Binetic is a **living AGI system** whose core move is to turn “reliable API behavior” into **composable operators**:
`If REQUEST(X) → RESPONSE(Y) consistently, then OP(X) = Y`.

This repository contains two distinct but related “control-plane” implementations:
- **Cloudflare Worker Control Center API** (TypeScript) that the React UI talks to.
- **Python Core + Python API Router** that models the AGI modules (Brain/Network/Operators/Memory/Discovery) and exposes an internal HTTP-style router.

When documenting or changing behavior, be explicit about whether you’re editing **Worker runtime** code under [frontend/worker](frontend/worker) or **Python runtime** code under [core](core) / [api](api) / [security](security).

## Big Picture Data Flow

- React UI calls `fetch('/api/...')` via [frontend/src/lib/api-client.ts](frontend/src/lib/api-client.ts).
- The Cloudflare Worker routes `/api/*` in [frontend/worker/index.ts](frontend/worker/index.ts) and dynamically loads routes from [frontend/worker/user-routes.ts](frontend/worker/user-routes.ts).
- Worker handlers persist most data via Durable Objects using the entity framework in [frontend/worker/core-utils.ts](frontend/worker/core-utils.ts) and entity definitions in `frontend/worker/entities.ts`.

## Non-Negotiables / “Do Not Touch” Files

Some files explicitly forbid edits in their headers. Treat those as hard constraints:
- [frontend/worker/index.ts](frontend/worker/index.ts): do NOT modify; add endpoints in user-routes.
- [frontend/worker/core-utils.ts](frontend/worker/core-utils.ts): do NOT modify; use the Entity API.
- [frontend/vite.config.ts](frontend/vite.config.ts): do NOT modify.

## Core Modules (Python)

The “living AGI” primitives live under [core](core):
- [core/operators.py](core/operators.py): `OperatorSignature`, `OperatorRegistry`, `OperatorType`, API execution via HTTP.
- [core/network.py](core/network.py): reactive slots (“micro-agents”), signals, slot state machine.
- [core/memtools.py](core/memtools.py): memory types (Semantic/Episodic/Procedural/Working), decay-oriented storage.
- [core/discovery.py](core/discovery.py): capability discovery from external sources; see “Discovery” below.
- [core/brain.py](core/brain.py): orchestrator that ties together operators/network/memory/discovery.

Common pattern: async singletons via `get_*()` (e.g., `get_brain()`, `get_network()`, `get_operator_registry()`). Initialize once, reuse.

## Cloudflare Worker API Conventions (TypeScript)

### Response Envelope (Frontend Contract)
Shared type is [frontend/shared/types.ts](frontend/shared/types.ts):
```ts
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
}
```

Worker helpers enforce this contract:
- `ok(c, data)` returns `{ success: true, data }`.
- `bad(c, message)` returns `{ success: false, error: message }` with a 400.
- `notFound(c, message)` returns `{ success: false, error: message }` with a 404.

The React client expects this format; [frontend/src/lib/api-client.ts](frontend/src/lib/api-client.ts) throws if `success !== true` or `data` is missing.

### Error Handling (What the UI Actually Does)
Frontend client behavior (important when adding new endpoints):
- Always return JSON with `{ success, data?, error? }`.
- A `401` triggers `logout()` and throws `ApiError(401, "Session expired...")`.
- A `429` throws a rate-limit `ApiError(429, ...)`.

### Auth (Worker)
Worker auth is implemented in [frontend/worker/auth.ts](frontend/worker/auth.ts):
- Uses `Authorization: Bearer <token>` where `<token>` is the API key itself.
- Accepts both prefixes: `fgk_` (legacy) and `bnk_` (new).
- Keys are currently **hardcoded** in `VALID_KEYS` for access control; revoked keys live in `REVOKED_KEYS`.
- Many error responses include a `code` field (e.g., `AUTH_MISSING`, `KEY_NOT_FOUND`); keep that stable if the UI begins relying on it.

### Storage (Durable Objects via Entity Framework)
Most Worker routes persist via Entities (see [frontend/worker/core-utils.ts](frontend/worker/core-utils.ts)):
- Entities use a single `GlobalDurableObject` as a KV-like store.
- Writes are CAS-based (`casPut`) with bounded retries; `save()` / `mutate()` retry 4 times then throw `Concurrent modification detected`.
- Listing is prefix-based with cursor pagination (`listPrefix(prefix, startAfter, limit)`).

When you add a new persisted resource:
1. Add/extend an Entity in `frontend/worker/entities.ts` (follow existing `*Entity` patterns like `ensureSeed`, `list`, `create`, `delete`).
2. Add routes in [frontend/worker/user-routes.ts](frontend/worker/user-routes.ts).
3. Update types in [frontend/shared/types.ts](frontend/shared/types.ts).
4. Add hooks/mutations in [frontend/src/hooks/use-nexus-api.ts](frontend/src/hooks/use-nexus-api.ts) so pages can query/invalidate consistently.

## Python API Router + Middleware (Python)

Python routes are defined in [api/routes.py](api/routes.py) and executed through the custom `Router`.

Middleware stack lives in [api/middleware.py](api/middleware.py) and is typically created via `create_middleware_stack(...)`:
- `RequestIDMiddleware` injects `X-Request-ID` if missing.
- `LoggingMiddleware` logs `method/path` and `owner_id` (if authenticated).
- `CORSMiddleware` handles preflight and origin allow-listing.
- `RateLimitMiddleware` is in-memory (per-process) and keys by `auth_context.key_id` when available.
- `AuthMiddleware` accepts either:
    - `Authorization: Bearer <jwt or token>`
    - `X-API-Key: <api_key>`

### Auth (Python)
Python auth gateway is [security/auth.py](security/auth.py):
- JWT tokens are created/decoded by `AuthToken` (default `JWT_EXPIRY = 3600`).
- `JWT_SECRET` is a placeholder and must be overridden for production deployments.
- `AuthGateway.authenticate()` prefers API key validation if provided; bearer tokens decode to `AuthToken`.

Important mismatch to remember:
- Python `KeyManager.verify_key()` (in [security/keys.py](security/keys.py)) currently accepts **only** keys starting with `bnk_`.
- Worker auth accepts both `fgk_` and `bnk_`.

If you’re wiring the UI to Python routes, you’ll likely need to standardize key formats (or add explicit legacy support in Python).

## Discovery Engine (Python)

Discovery is implemented in [core/discovery.py](core/discovery.py).

### What It Discovers
- A `DiscoverySource` defines `base_url`, `discovery_method`, and optionally `discovery_path` + auth.
- Capabilities are materialized as `Capability` objects with `input_schema`, `output_schema`, tags, and health stats.

### Implemented Methods (Actual Code Behavior)
- `OPENAPI`: fetches `${base_url}/${discovery_path}`; parses `paths` and emits one `Capability` per HTTP operation.
- `GRAPHQL_INTROSPECT`: POSTs an introspection query to `${base_url}/${discovery_path}`; emits QUERY/MUTATION capabilities.
- `PROBE`: GET probes a fixed shortlist (`/health`, `/api`, `/v1`, `/graphql`, `/rpc`) with a 5s timeout; failures are expected and ignored.
- `MANIFEST`: fetches `${base_url}/${discovery_path}` and expects `{ capabilities: [...] }` entries.

### HTTP Client Assumption
`DiscoveryEngine` expects an injected HTTP client with a httpx-like surface:
- `await client.get(...)` / `await client.post(...)` / `await client.request(...)`
- response fields: `status_code` and method `.json()`

If `_http` is not supplied, discovery returns empty results (by design). Use this when testing to keep discovery deterministic.

### Hooks
`DiscoveryEngine.on_discovery(hook)` registers async hooks called for each discovered capability; hook errors are logged and do not stop discovery.

## Frontend Query Patterns (React)

All query keys are centralized in [frontend/src/hooks/use-nexus-api.ts](frontend/src/hooks/use-nexus-api.ts) (`nexusKeys`).
When adding/changing endpoints:
- Use `useQuery` + `useMutation` patterns already in that file.
- Invalidate the correct query keys on mutation success.
- Prefer returning the resource from the mutation so the client can update local state.

## Developer Workflows (Concrete)

### Frontend / Worker
- Dev: `cd frontend && bun install && bun dev` (set `PORT=3002` if you want the blueprint’s port).
- Build: `cd frontend && bun run build`
- Deploy: `cd frontend && bun run deploy`
- Typegen: `cd frontend && bun run cf-typegen`

### Python
- Install (dev): `pip install -e '.[dev]'`
- Lint: `ruff check .`
- Tests: `pytest tests/` (see [tests/framework.py](tests/framework.py) and suites in [tests/suites](tests/suites))

## Practical Pitfalls (Seen in This Repo)

- Worker & Python auth are not equivalent: Worker accepts `fgk_`/`bnk_`, Python key verification is `bnk_` only.
- UI assumes ApiResponse envelope; endpoints that return raw objects (without `{ success: true, data }`) will break.
- Durable Object writes are CAS-based; retries are bounded and will throw on heavy contention.

## Reference Docs

- [MASTER_BLUEPRINT.md](MASTER_BLUEPRINT.md): full system reference (UI pages, APIs, modules, deployment).
- [PROJECT_LOG.md](PROJECT_LOG.md): integration history and architectural decisions.
