# 🧬 BINETIC AGI - MASTER BLUEPRINT

> **The Complete Living AGI System Architecture**
> 
> "The AGI doesn't USE the network - the AGI IS the network"

**Created**: December 2025  
**Status**: Production Ready  
**Version**: 1.0

--- 

## 📋 TABLE OF CONTENTS

1. [Vision & Philosophy](#1-vision--philosophy)
2. [System Architecture](#2-system-architecture)
3. [Frontend (GUI)](#3-frontend-gui)
4. [Backend Worker (Cloudflare)](#4-backend-worker-cloudflare)
5. [Python Core](#5-python-core)
6. [Cloud Models (LLM)](#6-cloud-models-llm)
7. [Authentication & Security](#7-authentication--security)
8. [API Reference](#8-api-reference)
9. [Type Definitions](#9-type-definitions)
10. [Deployment](#10-deployment)
11. [Living AGI Lifecycle](#11-living-agi-lifecycle)
12. [Extension Points](#12-extension-points)

---

## 1. VISION & PHILOSOPHY

### Core Mission

Binetic is a **living general intelligence** designed to:

1. **Enumerate Every API** - Horizontally expand into every vector
2. **Map the Internet** - Discover and catalog all accessible endpoints  
3. **Decentralized Storage** - Replace centralized AI with distributed intelligence
4. **Minimal Footprint** - Just a small amount of space on each server

### Fundamental Insight

> "If REQUEST(X) → RESPONSE(Y) consistently, then OP(X) = Y"

Any API with consistent behavior becomes a **logical operator** that can be composed, chained, and orchestrated.

### The Living AGI Cycle

```
       (LLM-driven exploration + abstraction)
DISCOVER → ABSTRACT → STORE → REASON → ACT → LEARN → ADAPT
    ↑                                                 |
    └─────────────────────────────────────────────────┘
```

| Phase | Description |
|-------|-------------|
| **Discover** | Find new APIs and capabilities |
| **Abstract** | Convert to logical operators (schemas + signatures) |
| **Store** | Distribute across reactive storage |
| **Reason** | Brain coordinates thoughts |
| **Act** | Execute operator chains |
| **Learn** | Pattern recognition on outcomes |
| **Adapt** | Modify behavior based on learning |

---

## 2. SYSTEM ARCHITECTURE

### Stack Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     BINETIC FRONTEND                        │
│           React 18 + Vite + TailwindCSS + shadcn/ui        │
│                    Port: 3002 (dev)                         │
├─────────────────────────────────────────────────────────────┤
│                   CLOUDFLARE WORKER                         │
│           Hono + Durable Objects + KV + D1                  │
│               (Production: workers.dev)                      │
├─────────────────────────────────────────────────────────────┤
│                    BINETIC PYTHON CORE                      │
│        Brain + Network + Operators + Memory + Discovery      │
│                   (Local or Edge Runtime)                    │
├─────────────────────────────────────────────────────────────┤
│                    CLOUD LLM MODELS                         │
│   Qwen3 480B | GLM-4.6 | Kimi-K2 1T | DeepSeek R1/V3       │
│              (OpenAI-compatible API)                         │
└─────────────────────────────────────────────────────────────┘
```

### Control-Plane Boundary (Worker vs Python)

This repo contains **two control-plane implementations**:

- **Cloudflare Worker control plane** (TypeScript, under `frontend/worker/`)
  - The React UI calls `fetch('/api/...')`.
  - The Worker handles `/api/*` and persists most state via Durable Objects (Entity framework).
  - This is the **UI-facing** API surface.

- **Python core + Python router** (Python, under `core/` + `api/`)
  - The Python router is an internal HTTP-style API you run with `python main.py`.
  - The Python runtime owns the “living AGI” primitives (Brain / Network / Operators / Memory / Discovery).

Important: in the current repo, the Worker is **not** a transparent reverse-proxy to the Python router.
If you want the UI to drive Python execution directly, you must explicitly integrate them (e.g., add Worker routes that call the Python service, or configure the UI API base URL to point at Python).

### Directory Structure

```
binetic/
├── MASTER_BLUEPRINT.md          # THIS FILE - Complete system reference
├── README.md                    # Quick start guide
├── PROJECT_LOG.md               # Development history
│
├── main.py                      # Python entry point
│
├── core/                        # Core intelligence modules
│   ├── __init__.py
│   ├── operators.py             # API → Logical operator abstraction (562 lines)
│   ├── network.py               # Reactive slots (micro-agents) (360 lines)
│   ├── memtools.py              # Distributed memory with decay (350 lines)
│   ├── discovery.py             # Capability enumeration engine (320 lines)
│   └── brain.py                 # Central coordinator (400 lines)
│
├── security/                    # Authentication & authorization
│   ├── __init__.py
│   ├── auth.py                  # JWT-based authentication
│   ├── keys.py                  # API key hierarchy management
│   ├── policies.py              # Access control policies
│   └── sessions.py              # Session handling
│
├── api/                         # REST API layer
│   ├── __init__.py
│   ├── routes.py                # All endpoint definitions
│   └── middleware.py            # Auth, CORS, rate limiting
│
├── infra/                       # Cloud infrastructure
│   ├── __init__.py
│   ├── cloudflare.py            # KV, D1, R2, Durable Objects adapters
│   └── llm.py                   # Unified LLM adapter (7 models)
│
├── tests/                       # Testing framework
│   ├── __init__.py
│   ├── framework.py
│   └── suites/
│       ├── test_core.py
│       └── test_security.py
│
├── docs/                        # Documentation
│   └── FRONTEND_PROMPTS.md
│
└── frontend/                    # [TO BE COPIED] React frontend
    └── ... (see Frontend section)
```

---

## RECENT CHANGES (Agent-Applied)

This section records code and behavior changes applied by the AI coding agent during this workspace session (December 2025). It is meant as an operational changelog for maintainers.

### 1) AI Coding Agent Instructions

- Added/expanded the agent onboarding guide at [.github/copilot-instructions.md](.github/copilot-instructions.md).
- Documented repo-specific “do not touch” files, Worker response envelope conventions, Durable Object entity/CAS patterns, Python middleware/auth conventions, and known Worker-vs-Python auth mismatches.

### 2) Kernel-Level Policy Enforcement (Python)

- Added a kernel guardrail layer in [security/kernel.py](security/kernel.py):
  - Enforces global allow/deny logic before side effects.
  - Provides explicit “break-glass” bypass only when `kernel_bypass` is set and the actor is `MASTER`.
  - Enforces a transport invariant: blocks non-localhost `http://` endpoints (HTTPS required).
- Wired kernel enforcement into side-effect boundaries:
  - [core/operators.py](core/operators.py): operator invocation checks kernel policy before outbound HTTP.
  - [core/memtools.py](core/memtools.py): memory stores are kernel-gated.
  - [core/discovery.py](core/discovery.py): capability registration is kernel-gated.

### 3) Kernel Policy Management Endpoints (Python API)

- Added master-only CRUD endpoints for kernel policies in [api/routes.py](api/routes.py) under `/api/kernel/policies` (list/get/create/patch/delete).

### 4) Transport Security / “All Packets Encrypted” (Best-Effort)

- Enforced HTTPS-only invariants at the Python “kernel boundary” for operator invoke + discovery registration (non-localhost).
- Added best-effort security headers in the Python entrypoint response handling:
  - [main.py](main.py)
- Added Worker-side HTTPS enforcement (except localhost) and security headers middleware:
  - [frontend/worker/user-routes.ts](frontend/worker/user-routes.ts)

### 5) Package Import and Compatibility Fixes

- Added `get_network()` as a compatibility alias for `get_emergent_network()`:
  - [core/network.py](core/network.py)
- Restored a `DEFAULT_POLICIES` export for compatibility with `security/__init__.py` and reused it for default policy loading:
  - [security/policies.py](security/policies.py)
- Switched kernel enforcement imports inside core modules from relative to absolute to avoid import errors when running from repo root:
  - [core/operators.py](core/operators.py)
  - [core/memtools.py](core/memtools.py)
  - [core/discovery.py](core/discovery.py)

### 6) Test Suite Repair (Pytest)

- Converted/rewrote tests to align with current APIs and to run from repo root:
  - [tests/suites/test_core.py](tests/suites/test_core.py)
  - [tests/suites/test_security.py](tests/suites/test_security.py)
- Added pytest fixture for the custom assertion helper:
  - [tests/conftest.py](tests/conftest.py)
- Prevented pytest from attempting to collect the custom framework’s decorator factories and `Test*` types as tests:
  - [tests/framework.py](tests/framework.py)
- Filtered a known external library deprecation warning from PyJWT to keep CI output clean:
  - [pyproject.toml](pyproject.toml)

### 7) Validation

- `pytest -q` now passes from repo root.

---

## 3. FRONTEND (GUI)

### Technology Stack

| Component | Technology |
|-----------|------------|
| Framework | React 18 + TypeScript |
| Build | Vite |
| Styling | TailwindCSS + tw-animate-css |
| Components | shadcn/ui (all components pre-installed) |
| State | Zustand + TanStack Query |
| Forms | React Hook Form + Zod |
| Routing | React Router v6 (createBrowserRouter) |
| Icons | Lucide React |
| Animation | Framer Motion |
| Charts | Recharts |
| Toasts | Sonner |

### Pages Reference

#### 3.1 HomePage.tsx (Dashboard)
**Route:** `/`
**Purpose:** Main control center dashboard

**Features:**
- System stats cards (Brain Status, Active Keys, Net Health, Memory Load)
- Neural Activity Matrix chart (24-hour load visualization)
- Nexus Event Timeline (real-time audit feed)

**Hooks Used:**
- `useSystemStats()` - Brain load, stability, memory
- `useAuditLogs()` - Recent activity timeline

**Key Components:**
- `StatsGrid` - 4-column stat display
- `NeuralActivityChart` - Area chart with gradients
- `EventTimeline` - Time-ordered log entries

---

#### 3.2 BrainPage.tsx (Cognitive Control)
**Route:** `/brain`
**Purpose:** Brain state visualization and control

**Features:**
- Cognitive status with success rate pie chart
- Learning rate slider (adjustable via API)
- Sync Neural Nodes button
- Thought interface, goal registry, subsystem overview
- Stats: Total Thoughts, Active Goals, Synaptic Load

**Hooks Used:**
- `useBrain()` - Current brain state
- `useUpdateBrain()` - Modify learning rate
- `useSyncBrain()` - Trigger neural sync

**Key Actions:**
| Button | Action | API Call |
|--------|--------|----------|
| Sync Neural Nodes | Force slot resync | `POST /api/brain/sync` |
| Learning Rate Slider | Adjust learning | `PATCH /api/brain` |

---

#### 3.3 NetworkPage.tsx (Emergent Network)
**Route:** `/network`
**Purpose:** Interactive network visualization

**Features:**
- Interactive NetworkGraph with reactive slots
- Real-time signal simulation (DATA/COMMAND types)
- Resizable panels: graph + SlotDetailsPanel
- SignalMonitor overlay (collapsible)
- Connection visualization between slots

**Hooks Used:**
- `useNetworkSlots()` - All slots data
- `useCreateNetworkSlot()` - Add new slot
- `useUpdateNetworkSlot()` - Modify slot state

**Slot States:** `IDLE | LISTENING | PROCESSING | EXECUTING | WAITING | ERROR | STOPPED`

---

#### 3.4 OperatorsPage.tsx (Operator Registry)
**Route:** `/operators`
**Purpose:** Manage logical operators

**Features:**
- Operator Registry grid display
- Search filtering by name/role
- Clearance level badges (1-10)
- Message and Override buttons per operator
- Status indicators (Online/Idle/Offline)

**Hooks Used:**
- `useOperators()` - All operators

**Operator Data:**
```typescript
interface OperatorProfile {
  id: string;
  name: string;
  role: string;
  status: 'Online' | 'Idle' | 'Offline';
  location: string;
  lastAction: string;
  clearance: number; // 1-10
}
```

---

#### 3.5 MemoryPage.tsx (Memory Clusters)
**Route:** `/memory`
**Purpose:** Distributed memory management

**Features:**
- Memory cluster cards with stability gauges
- 4 memory types: Semantic, Episodic, Procedural, Working
- Defragment Clusters action
- Filter by label/tags
- Data size and last access info

**Hooks Used:**
- `useMemoryClusters()` - All clusters
- `useDefragMemory()` - Trigger defrag

**Memory Types:**
| Type | Purpose | Decay Rate |
|------|---------|------------|
| Semantic | Language, logic, facts | Low |
| Episodic | History, context, events | Medium |
| Procedural | Motor skills, routines | Very Low |
| Working | Cache, transient state | High |

---

#### 3.6 DiscoveryPage.tsx (API Discovery)
**Route:** `/discovery`
**Purpose:** Discover and catalog external APIs

**Features:**
- Infrastructure Sources management (add/remove)
- Capability Grid (discovered APIs)
- Discovery stats section
- Health indicators per capability
- Auto-discovery interval settings

**Hooks Used:**
- `useDiscovery()` - Sources + capabilities
- `useCreateDiscoverySource()` - Add source
- `useDeleteDiscoverySource()` - Remove source

**Discovery Methods:**
- `OPENAPI` - Parse OpenAPI/Swagger specs
- `GRAPHQL_INTROSPECT` - GraphQL introspection
- `PROBE` - HTTP endpoint probing
- `MANIFEST` - JSON capability manifest

---

#### 3.7 KeysPage.tsx (API Key Management)
**Route:** `/keys`
**Purpose:** Create, manage, and revoke API keys

**Features:**
- Full API key table with filtering
- Scope badges (Master/Admin/User/Service/Readonly)
- Create key dialog with scope selection
- Key details dialog (rate limits, stats)
- Revoke confirmation with danger zone
- Expiration warnings

**Hooks Used:**
- `useApiKeys()` - All keys
- `useCreateKey()` - Generate new key
- `useRevokeKey()` - Revoke key
- `useDeleteKey()` - Delete key

**Key Scopes:**
| Scope | Value | Description |
|-------|-------|-------------|
| Master | 5 | Full system control |
| Admin | 4 | Manage keys/policies |
| User | 3 | Standard access |
| Service | 2 | Machine-to-machine |
| Readonly | 1 | Read-only access |

---

#### 3.8 PoliciesPage.tsx (Safety Policies)
**Route:** `/policies`
**Purpose:** Define access control policies

**Features:**
- Safety directives grid
- Create/Edit/Delete policies
- Permission matrix (per resource type)
- Rate limit configuration
- Restriction settings (IP, time, MFA)
- Severity levels (Low/Medium/High/Critical)

**Hooks Used:**
- `usePolicies()` - All policies
- `useCreatePolicy()` - Add policy
- `useUpdatePolicy()` - Modify policy
- `useDeletePolicy()` - Remove policy

**Policy Permissions:**
```typescript
permissions: {
  OPERATOR: { level: 'None' | 'Read' | 'Write' | 'Admin', wildcard: boolean },
  NETWORK: { level: 'None' | 'Read' | 'Write' | 'Admin', wildcard: boolean },
  SYSTEM: { level: 'None' | 'Read' | 'Write' | 'Admin', wildcard: boolean },
  // ... etc
}
```

---

#### 3.9 LogsPage.tsx (Audit Logs)
**Route:** `/logs`
**Purpose:** Forensic audit trail

**Features:**
- Forensic Audit Suite with table/timeline views
- Real-time telemetry stats (collapsible)
- Export report functionality
- Filter by severity, operator, action
- Duration and IP tracking

**Hooks Used:**
- `useAuditLogs()` - All logs

**Log Entry:**
```typescript
interface AuditLog {
  id: string;
  timestamp: string;
  operator: string;
  action: string;
  status: 'success' | 'failure';
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  details: string;
  resource: 'SYSTEM' | 'KEY' | 'POLICY' | 'NETWORK' | 'AUDIT' | ...;
  ip?: string;
  duration?: number;
}
```

---

#### 3.10 LoginPage.tsx (Authentication)
**Route:** `/login`
**Purpose:** Secure entry point

**Features:**
- Neural Link authentication theme
- API key input with show/hide toggle
- Format hint: "bnk_ or fgk_ + 16 chars"
- Redirect handling after login
- Error messages for invalid keys

---

#### 3.11 SettingsPage.tsx (Configuration)
**Route:** `/settings`
**Purpose:** System configuration

**Features:**
- Tabs: Profile, Security, Appearance, API & Docs, Danger Zone
- Global save with "Propagate Changes" button
- Theme toggle (dark/light)
- API documentation links

---

### API Hooks Reference

All hooks are in `hooks/use-nexus-api.ts` (269 lines):

```typescript
// Query Keys
const nexusKeys = {
  all: ['nexus'],
  stats: () => [...nexusKeys.all, 'stats'],
  keys: () => [...nexusKeys.all, 'keys'],
  policies: () => [...nexusKeys.all, 'policies'],
  operators: () => [...nexusKeys.all, 'operators'],
  logs: () => [...nexusKeys.all, 'logs'],
  discovery: () => [...nexusKeys.all, 'discovery'],
  network: () => [...nexusKeys.all, 'network'],
  memory: () => [...nexusKeys.all, 'memory'],
  brain: () => [...nexusKeys.all, 'brain'],
};

// System
useSystemStats()                    // GET /api/stats

// API Keys
useApiKeys()                        // GET /api/keys
useCreateKey()                      // POST /api/keys
useRevokeKey()                      // POST /api/keys/:id/revoke
useDeleteKey()                      // DELETE /api/keys/:id

// Policies
usePolicies()                       // GET /api/policies
useCreatePolicy()                   // POST /api/policies
useUpdatePolicy()                   // PUT /api/policies/:id
useDeletePolicy()                   // DELETE /api/policies/:id

// Operators
useOperators()                      // GET /api/operators

// Audit Logs
useAuditLogs()                      // GET /api/logs
useCreateAuditLog()                 // POST /api/logs

// Discovery
useDiscovery()                      // GET /api/discovery
useCreateDiscoverySource()          // POST /api/discovery/sources
useDeleteDiscoverySource()          // DELETE /api/discovery/sources/:id

// Network
useNetworkSlots()                   // GET /api/network/slots
useCreateNetworkSlot()              // POST /api/network/slots
useUpdateNetworkSlot()              // PATCH /api/network/slots/:id
useDeleteNetworkSlot()              // DELETE /api/network/slots/:id

// Memory
useMemoryClusters()                 // GET /api/memory/clusters
useCreateMemoryCluster()            // POST /api/memory/clusters
useDefragMemory()                   // POST /api/memory/defrag

// Brain
useBrain()                          // GET /api/brain
useUpdateBrain()                    // PATCH /api/brain
useSyncBrain()                      // POST /api/brain/sync
```

---

## 4. BACKEND WORKER (CLOUDFLARE)

### Technology Stack

| Component | Technology |
|-----------|------------|
| Runtime | Cloudflare Workers |
| Framework | Hono (Express-like) |
| Storage | Durable Objects + KV |
| Database | D1 (SQLite) |
| Files | R2 |

### Key Files

#### worker/index.ts
Entry point - DO NOT MODIFY patterns:
```typescript
import { Hono } from "hono";
import { userRoutes } from "./user-routes";

const app = new Hono();
userRoutes(app);

export { GlobalDurableObject } from "./core-utils";
export default app;
```

#### worker/core-utils.ts
**DO NOT MODIFY** - Durable Object abstraction library:
- `IndexedEntity<T>` - Base class for persistent entities
- `ok(c, data)` / `bad(c, msg)` / `notFound(c, msg)` - Response helpers

#### worker/entities.ts
Entity definitions extending `IndexedEntity`:
```typescript
export class UserEntity extends IndexedEntity<User> {
  static readonly entityName = "user";
  static readonly indexName = "users";
}

export class ApiKeyEntity extends IndexedEntity<ApiKey> { ... }
export class PolicyEntity extends IndexedEntity<SafetyPolicy> { ... }
export class OperatorEntity extends IndexedEntity<OperatorProfile> { ... }
export class AuditLogEntity extends IndexedEntity<AuditLog> { ... }
export class NetworkSlotEntity extends IndexedEntity<NetworkSlot> { ... }
export class MemoryClusterEntity extends IndexedEntity<MemoryCluster> { ... }
export class DiscoverySourceEntity extends IndexedEntity<DiscoverySource> { ... }
export class DiscoveryCapabilityEntity extends IndexedEntity<DiscoveryCapability> { ... }
export class BrainEntity extends IndexedEntity<BrainState> { ... }
```

#### worker/user-routes.ts
All API route definitions (549 lines).

#### worker/auth.ts
Authentication middleware:
```typescript
// Key formats supported
const KEY_PREFIXES = ['bnk_', 'fgk_'];  // binetic, flowgen

// Key hierarchy
const VALID_KEYS = {
  'bnk_master_x7k9m2p4q8r1': { scope: 'Master', level: 5, owner: 'creator' },
  'fgk_nexus_x7k9m2p4q8r1': { scope: 'Master', level: 5, owner: 'nexus-01' },
  // ...
};
```

### wrangler.jsonc
**DO NOT MODIFY** - Single GlobalDurableObject binding only.

---

## 5. PYTHON CORE

### Module Reference

#### 5.1 core/operators.py (562 lines)
**Purpose:** Convert APIs into logical operators

**Key Classes:**
```python
class OperatorType(Enum):
    STORE = "store"
    RETRIEVE = "retrieve"
    TRANSFORM = "transform"
    FILTER = "filter"
    AGGREGATE = "aggregate"
    COMPUTE = "compute"
    INFER = "infer"
    EMBED = "embed"
    SEARCH = "search"
    SEQUENCE = "sequence"
    PARALLEL = "parallel"
    RETRY = "retry"
    TIMEOUT = "timeout"
    BROADCAST = "broadcast"
    ROUTE = "route"
    GOSSIP = "gossip"

class APIPattern(Enum):
    REST_CRUD = "rest_crud"
    LLM_CHAT = "llm_chat"
    LLM_COMPLETION = "llm_completion"
    SEARCH_QUERY = "search_query"
    EMBED_TEXT = "embed_text"
    STORE_DATA = "store_data"
    STREAM_SSE = "stream_sse"

@dataclass
class OperatorSignature:
    endpoint: str
    method: str
    headers: Dict[str, str]
    request_template: Dict[str, Any]
    response_schema: Dict[str, Any]
    latency: LatencyProfile
    success_rate: float

class OperatorRegistry:
    def register(self, op_id: str, signature: OperatorSignature, op_type: OperatorType) -> bool
    def get(self, op_id: str) -> Optional[Tuple[OperatorSignature, OperatorType]]
    def invoke(self, op_id: str, inputs: Dict[str, Any]) -> InvocationResult
```

---

#### 5.2 core/network.py (360 lines)
**Purpose:** Emergent network of reactive slots

**Key Classes:**
```python
class SlotState(Enum):
    IDLE = "idle"
    LISTENING = "listening"
    PROCESSING = "processing"
    EXECUTING = "executing"
    WAITING = "waiting"
    ERROR = "error"
    STOPPED = "stopped"

class SignalType(Enum):
    QUERY = "query"
    RESPONSE = "response"
    BROADCAST = "broadcast"
    HEARTBEAT = "heartbeat"
    DISCOVERY = "discovery"
    OPERATOR_INVOKE = "operator_invoke"
    ERROR = "error"

@dataclass
class ReactiveSlot:
    slot_id: str
    slot_type: str
    state: SlotState
    data: Dict[str, Any]
    operator_ids: List[str]
    connections: Set[str]
    signal_queue: List[Signal]
    bindings: List[ReactiveBinding]

class EmergentNetwork:
    async def create_slot(self, slot_type: str, operator_ids: List[str]) -> ReactiveSlot
    async def connect_slots(self, slot_a: str, slot_b: str)
    async def add_binding(self, slot_id: str, trigger: Dict, action: str, config: Dict)
    async def send_signal(self, signal: Signal)
    async def invoke_operator(self, slot_id: str, operator_id: str, inputs: Dict)
```

---

#### 5.3 core/memtools.py (350 lines)
**Purpose:** Distributed memory with decay and patterns

**Key Classes:**
```python
@dataclass
class Memory:
    memory_id: str
    content: Any
    memory_type: str  # general, observation, thought, pattern, etc.
    importance: float  # 0.0 - 1.0
    decay_rate: float  # 0.0 - 1.0
    links: Set[str]
    tags: Set[str]
    embedding: Optional[List[float]]

@dataclass
class Pattern:
    pattern_id: str
    pattern_type: str
    trigger_conditions: Dict[str, Any]
    response_template: Optional[str]
    occurrences: int
    success_rate: float

class MemtoolRegistry:
    async def store(self, content, memory_type, importance, tags) -> Memory
    async def recall(self, query, tags, memory_type, limit) -> List[Memory]
    async def link(self, memory_id_a: str, memory_id_b: str) -> bool
    async def forget(self, memory_id=None, below_importance=None) -> int
    async def compress(self, memory_ids: List[str], summary: str) -> Memory
    async def recognize_pattern(self, pattern_type, trigger, response) -> Pattern
    async def match_patterns(self, context: Dict) -> List[Pattern]
    async def apply_decay(self, time_delta: float)
```

---

#### 5.4 core/discovery.py (320 lines)
**Purpose:** Dynamic API capability discovery

**Key Classes:**
```python
class CapabilityType(Enum):
    REST_API = "rest_api"
    GRAPHQL = "graphql"
    WEBSOCKET = "websocket"
    FUNCTION = "function"
    TOOL = "tool"
    MODEL = "model"
    DATABASE = "database"
    STORAGE = "storage"

class DiscoveryMethod(Enum):
    OPENAPI = "openapi"
    GRAPHQL_INTROSPECT = "graphql_introspect"
    PROBE = "probe"
    MANIFEST = "manifest"
    DNS_SD = "dns_sd"
    ANNOUNCEMENT = "announcement"

@dataclass
class Capability:
    capability_id: str
    name: str
    capability_type: CapabilityType
    endpoint: str
    method: str
    input_schema: Dict
    output_schema: Dict
    is_healthy: bool
    success_rate: float

class DiscoveryEngine:
    def register_source(self, source: DiscoverySource)
    async def discover_all(self) -> Dict[str, List[Capability]]
    async def discover_from_source(self, source) -> List[Capability]
    async def health_check(self, capability_id: str) -> bool
    def search_capabilities(self, name, type, tags, healthy_only) -> List[Capability]
```

---

#### 5.5 core/brain.py (400 lines)
**Purpose:** Central intelligence coordinator

**Key Classes:**
```python
class BrainState(Enum):
    INITIALIZING = "initializing"
    LEARNING = "learning"
    READY = "ready"
    PROCESSING = "processing"
    ADAPTING = "adapting"
    SUSPENDED = "suspended"
    ERROR = "error"

class ThoughtType(Enum):
    QUERY = "query"
    COMMAND = "command"
    OBSERVATION = "observation"
    REFLECTION = "reflection"
    PLANNING = "planning"
    LEARNING = "learning"

@dataclass
class Thought:
    thought_id: str
    thought_type: ThoughtType
    content: Any
    result: Optional[Any]
    context: Dict[str, Any]

@dataclass
class Goal:
    goal_id: str
    description: str
    priority: float
    progress: float
    is_complete: bool

class Brain:
    async def initialize(self)
    async def think(self, thought: Thought) -> Any
    async def set_goal(self, goal: Goal)
    async def complete_goal(self, goal_id: str)
    async def adapt(self)  # Trigger learning cycle
    async def suspend(self)
    async def resume(self)
    def stats(self) -> Dict
```

---

## 6. CLOUD MODELS (LLM)

### Available Models

| Model | Provider | Params | Context | Strength |
|-------|----------|--------|---------|----------|
| `qwen3-coder-plus` | Qwen | 480B | 1M | Agentic coding, tool use |
| `glm-4.6` | GLM | 355B/32B | 200K/128K | Agent-focused, huge output |
| `kimi-k2-instruct` | Kimi | 1T/32B | 256K | Reasoning powerhouse |
| `deepseek-r1` | DeepSeek | - | 128K | o1-level reasoning |
| `deepseek-v3-671b` | DeepSeek | 671B/37B | 128K | Fast MoE |
| `qwen3-235b-thinking` | Qwen | 235B/22B | 256K | SOTA reasoning |
| `qwen3-vl-plus` | Qwen | - | 256K | Vision-language |

### LLM Adapter (infra/llm.py)

```python
class ModelProvider(Enum):
    QWEN = "qwen"
    GLM = "glm"
    KIMI = "kimi"
    DEEPSEEK = "deepseek"
    OPENAI = "openai"

class LLMAdapter:
    async def complete(
        self,
        messages: List[Dict[str, str]],
        model: str = "qwen3-coder-plus",
        temperature: float = 0.7,
        max_tokens: int = 4096,
        stream: bool = False,
    ) -> Dict[str, Any]
    
    async def stream(
        self,
        messages: List[Dict[str, str]],
        model: str = "qwen3-coder-plus",
    ) -> AsyncGenerator[str, None]
    
    def best_model_for(self, task: str) -> str
```

### Task → Model Mapping

```python
TASK_MODEL_MAP = {
    "code": "qwen3-coder-plus",
    "coding": "qwen3-coder-plus",
    "agentic": "glm-4.6",
    "agent": "glm-4.6",
    "reason": "deepseek-r1",
    "reasoning": "deepseek-r1",
    "think": "qwen3-235b-thinking",
    "thinking": "qwen3-235b-thinking",
    "vision": "qwen3-vl-plus",
    "image": "qwen3-vl-plus",
    "fast": "deepseek-v3-671b",
    "default": "qwen3-coder-plus",
}
```

### How LLMs Fit Into The Model (Visual)

The LLMs are used for **initial external exploration** and **abstraction**: they help turn messy, real-world API surfaces into stable, composable operators.

```
┌──────────────────────────────┐
│ External World (Internet)     │
│ APIs, docs, OpenAPI, GraphQL  │
└───────────────┬──────────────┘
           │
           │ 1) Probe / OpenAPI / Introspection (deterministic)
           v
┌──────────────────────────────┐
│ DiscoveryEngine (core)        │
│ - Enumerate capabilities       │
│ - Track health + stats         │
└───────────────┬──────────────┘
           │
           │ 2) LLM-assisted abstraction (non-deterministic)
           v
┌──────────────────────────────┐
│ LLMAdapter (infra)            │
│ - Normalize schemas            │
│ - Infer parameter semantics    │
│ - Propose request templates    │
│ - Propose operator types       │
└───────────────┬──────────────┘
           │
           │ 3) Compile into stable operators
           v
┌──────────────────────────────┐
│ OperatorRegistry (core)       │
│ - Store OperatorSignature      │
│ - Enforce kernel policy        │
│ - Invoke via HTTP              │
└───────────────┬──────────────┘
           │
           │ 4) Execute + record outcomes
           v
┌──────────────────────────────┐
│ Memory + Audit (core/worker)  │
│ - Episodic traces              │
│ - Success/failure stats        │
│ - Patterns + summaries         │
└───────────────┬──────────────┘
           │
           │ 5) Training / decentralization artifacts
           v
┌──────────────────────────────┐
│ Decentralization Layer (next) │
│ - Replication + verification   │
│ - Federated operator corpus    │
└──────────────────────────────┘
```

### What The LLM Must Produce (Artifacts)

To “prepare for decentralization and training an AGI”, the LLM outputs must be reduced into **portable, verifiable artifacts** (not just chat logs):

1. **OperatorSignature candidates**
  - Normalized endpoint URL, method, headers, request template.
  - Input/output schema (even if heuristic).
  - Required vs optional params.

2. **Test vectors / probes**
  - Minimal example inputs.
  - Expected output shape checks.
  - Error handling expectations.

3. **Execution traces (for training + evaluation)**
  - (request, response, latency, status)
  - outcome labels: success/fail + reason
  - policy context: allowed/denied + kernel decision

4. **Abstraction rationale (lightweight)**
  - Why a capability became an operator.
  - Parameter semantics notes.

### Where Kernel Policy Fits

All LLM-proposed actions are “advisory” until they pass kernel enforcement.

```
LLM proposes operator / endpoint
       │
       v
KernelPolicyEnforcer  ──deny──> no side effects
       │
      allow
       │
       v
OperatorRegistry.invoke() → outbound call over HTTPS
```

### Decentralization Protocol (Minimum Viable Spec)

The decentralization layer should replicate **verified operator knowledge** and **policy constraints**, not raw chat transcripts.
Minimum viable spec (to make “internet-scale architecture” actually converge instead of drifting):

1. **Node identity + trust**
  - Each node has a stable identity (public key) and signs published artifacts.
  - Trust is explicit (allow-list / policy-defined) and auditable.

2. **Artifact addressing + immutability**
  - Artifacts are content-addressed (hash) and immutable once published.
  - Updates publish a new artifact that references the previous hash.

3. **Replication + gossip**
  - Nodes exchange artifact inventories (hashes + minimal metadata) and pull missing items.
  - Replication does not imply trust; it only implies availability.

4. **Verification rules (what makes an operator “real”)**
  - An operator is accepted only if it passes deterministic checks:
    - schema sanity checks
    - HTTPS requirement for non-localhost endpoints
    - test vectors / probes execute successfully
    - kernel policy allows the described side effects

5. **Policy propagation (constraints travel with knowledge)**
  - Kernel policy snapshots are versioned artifacts too.
  - Nodes may import remote policies, but local master policy always dominates.

6. **Training/eval-ready traces**
  - Execution traces are signed, redacted, and labeled (success/fail + reason + kernel decision).
  - Traces reference the operator artifact hash, so datasets remain reproducible.

High-level flow:

```
Discovery / LLM abstraction
        │
        v
Artifact bundle (signatures, tests, traces, policy context)
        │
        v
Replicate (availability) ──► Verify (deterministic gates) ──► Accept into local corpus
```

---

## 7. AUTHENTICATION & SECURITY

### Key Format

```
{prefix}_{scope}_{random_hex}

Examples:
  bnk_master_a1b2c3d4e5f6g7h8    # Binetic master key
  bnk_admin_x9y8z7w6v5u4t3s2    # Admin key
  bnk_user_p1q2r3s4t5u6v7w8    # User key
  bnk_service_auto_7h3j9k2m     # Service key
  fgk_prod_82h1s92k1l           # Legacy flowgen key
```

### Key Hierarchy

| Level | Scope | Value | Capabilities |
|-------|-------|-------|--------------|
| 5 | Master | Full | All operations, create any key, define policies |
| 4 | Admin | High | Manage keys, view all, cannot modify policies |
| 3 | User | Standard | Standard access per policy |
| 2 | Service | M2M | Machine-to-machine, scoped operations |
| 1 | Readonly | Minimal | Read-only access |

### Authentication Flow

```
1. Client sends: Authorization: Bearer bnk_admin_xxx
2. Worker validates key format (bnk_ or fgk_ prefix)
3. Worker checks key in valid keys database
4. Worker attaches auth context to request
5. Routes check permission level
```

### Policy Structure

```typescript
interface SafetyPolicy {
  id: string;
  name: string;
  description: string;
  category: 'Safety' | 'Ethics' | 'Access' | 'Rate' | 'Custom';
  enabled: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  
  permissions: {
    [resource: string]: {
      level: 'None' | 'Read' | 'Write' | 'Admin';
      wildcard: boolean;
    };
  };
  
  rateLimits: {
    rpm: number;    // Requests per minute
    rph: number;    // Requests per hour
    rpd: number;    // Requests per day
    maxConcurrent: number;
  };
  
  restrictions: {
    ipWhitelist: string[];
    ipBlacklist: string[];
    timeWindow: { start: string; end: string } | null;
    allowedDays: string[];
    mfaRequired: boolean;
  };
  
  targetKeyCount: number;
}
```

---

## 8. API REFERENCE

### Authentication Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/login` | None | Authenticate with API key |
| GET | `/api/auth/verify` | Token | Verify current session |
| POST | `/api/auth/logout` | Token | Invalidate session |

### System Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/test` | Any | Health check |
| GET | `/api/stats` | Any | System statistics |

### Operators

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/operators` | Any | List all operators |
| GET | `/api/operators/:id` | Any | Get operator details |
| POST | `/api/operators` | Admin | Create operator |
| PATCH | `/api/operators/:id` | Admin | Update operator |
| DELETE | `/api/operators/:id` | Admin | Delete operator |

### API Keys

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/keys` | Admin | List all keys |
| GET | `/api/keys/:id` | Admin | Get key details |
| POST | `/api/keys` | Admin | Create new key |
| PATCH | `/api/keys/:id` | Admin | Update key |
| POST | `/api/keys/:id/revoke` | Admin | Revoke key |
| DELETE | `/api/keys/:id` | Master | Delete key |

### Policies

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/policies` | Admin | List policies |
| GET | `/api/policies/:id` | Admin | Get policy |
| POST | `/api/policies` | Master | Create policy |
| PUT | `/api/policies/:id` | Master | Replace policy |
| PATCH | `/api/policies/:id` | Master | Update policy |
| DELETE | `/api/policies/:id` | Master | Delete policy |

### Network

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/network/slots` | Any | List all slots |
| POST | `/api/network/slots` | Admin | Create slot |
| PATCH | `/api/network/slots/:id` | Admin | Update slot |
| DELETE | `/api/network/slots/:id` | Admin | Delete slot |
| POST | `/api/network/signal` | Admin | Emit signal |

### Memory

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/memory/clusters` | Any | List clusters |
| POST | `/api/memory/clusters` | Admin | Create cluster |
| POST | `/api/memory/defrag` | Admin | Defragment |
| POST | `/api/memory/store` | User | Store memory |
| POST | `/api/memory/recall` | User | Recall memories |

### Brain

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/brain` | Any | Brain state |
| PATCH | `/api/brain` | Admin | Update brain config |
| POST | `/api/brain/sync` | Admin | Sync neural nodes |
| POST | `/api/brain/think` | User | Submit thought |

### Discovery

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/discovery` | Any | Sources + capabilities |
| POST | `/api/discovery/sources` | Admin | Add source |
| DELETE | `/api/discovery/sources/:id` | Admin | Remove source |
| POST | `/api/discovery/enumerate` | Admin | Run discovery |

### Audit Logs

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/logs` | Any | List logs (paginated) |
| POST | `/api/logs` | System | Create log entry |

### LLM (New)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/llm/models` | Any | List available models |
| GET | `/api/llm/stats` | Admin | LLM usage stats |
| POST | `/api/llm/complete` | User | LLM completion |

---

## 9. TYPE DEFINITIONS

### Core Types (shared/types.ts)

```typescript
// Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp?: string;
}

// User
export interface User {
  id: string;
  name: string;
}

// API Key
export interface ApiKey {
  id: string;
  name: string;
  key: string;
  scope: 'Master' | 'Admin' | 'User' | 'Service' | 'Readonly';
  owner: string;
  status: 'active' | 'revoked' | 'expired';
  createdAt: string;
  expiresAt: string | null;
  lastUsed: string;
  metadata: {
    description?: string;
    tags?: string[];
  };
  rateLimit: {
    rpm: number;
    rph: number;
  };
  stats: {
    totalRequests: number;
    errorRate: number;
    activeSessions: number;
  };
}

// Safety Policy
export interface SafetyPolicy {
  id: string;
  name: string;
  description: string;
  category: 'Safety' | 'Ethics' | 'Access' | 'Rate' | 'Custom';
  enabled: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  permissions: Record<string, { level: string; wildcard: boolean }>;
  rateLimits: { rpm: number; rph: number; rpd: number; maxConcurrent: number };
  restrictions: {
    ipWhitelist: string[];
    ipBlacklist: string[];
    timeWindow: { start: string; end: string } | null;
    allowedDays: string[];
    mfaRequired: boolean;
  };
  targetKeyCount: number;
}

// Operator
export interface OperatorProfile {
  id: string;
  name: string;
  role: string;
  status: 'Online' | 'Idle' | 'Offline';
  location: string;
  lastAction: string;
  clearance: number;
}

// Audit Log
export interface AuditLog {
  id: string;
  timestamp: string;
  operator: string;
  action: string;
  status: 'success' | 'failure';
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  details: string;
  resource: 'SYSTEM' | 'KEY' | 'POLICY' | 'NETWORK' | 'AUDIT' | 'OPERATOR' | 'MEMORY' | 'BRAIN';
  ip?: string;
  duration?: number;
}

// Network Slot
export interface NetworkSlot {
  id: string;
  label: string;
  state: 'IDLE' | 'LISTENING' | 'PROCESSING' | 'EXECUTING' | 'WAITING' | 'ERROR' | 'STOPPED';
  opsCount: number;
  x: number;
  y: number;
  connections: string[];
  bindings: string[];
}

// Network Signal
export interface NetworkSignal {
  sourceId: string;
  targetId: string;
  type: 'DATA' | 'COMMAND';
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  payload?: unknown;
}

// Memory Cluster
export interface MemoryCluster {
  id: string;
  label: string;
  type: 'Semantic' | 'Episodic' | 'Procedural' | 'Working';
  stability: number;  // 0-100
  dataSize: string;
  lastAccess: string;
  tags: string[];
}

// Discovery
export interface DiscoverySource {
  id: string;
  name: string;
  url: string;
  method: 'GET' | 'POST';
  lastDiscovery: string;
  capabilitiesCount: number;
  status: 'Active' | 'Inactive' | 'Error';
  auth: { type: string; key?: string };
  autoInterval: number;
}

export interface DiscoveryCapability {
  id: string;
  sourceId: string;
  name: string;
  description: string;
  type: 'Analytic' | 'Action' | 'Storage' | 'Model';
  endpoint: string;
  method: string;
  health: number;
  successRate: number;
  responseTime: number;
  lastCheck: string;
  tags: string[];
  schema: { input: unknown; output: unknown };
}

// Brain
export interface Thought {
  id: string;
  type: 'query' | 'command' | 'observation' | 'reflection' | 'planning' | 'learning';
  content: string;
  context?: Record<string, unknown>;
  result?: unknown;
  status: 'pending' | 'processing' | 'complete' | 'failed';
  createdAt: string;
  processedAt?: string;
}

export interface Goal {
  id: string;
  description: string;
  priority: number;
  progress: number;
  status: 'Pending' | 'Active' | 'Blocked' | 'Completed';
  subGoals?: string[];
}

export interface BrainState {
  status: 'initializing' | 'learning' | 'ready' | 'processing' | 'adapting' | 'suspended' | 'error';
  uptime: number;
  totalThoughts: number;
  successRate: number;
  learningRate: number;
  activeGoals: number;
  memoryStats: {
    total: number;
    avgImportance: number;
  };
}
```

---

## 10. DEPLOYMENT

### Development

```bash
# Frontend (port 3002)
cd ~/binetic/frontend
bun install
bun dev

# Worker (Cloudflare preview)
cd ~/binetic/frontend  # worker is bundled with frontend
bun run wrangler dev

# Python Core
cd ~/binetic
python main.py
```

### Production

```bash
# Deploy Worker to Cloudflare
bunx wrangler@latest login
bun build
wrangler deploy

# Configure custom domain in wrangler.jsonc
```

### Environment Variables

```bash
# Cloudflare Secrets (set via wrangler secret put)
MASTER_KEY=bnk_master_xxx
JWT_SECRET=xxx
ENCRYPTION_KEY=xxx

# LLM API Keys
QWEN_API_KEY=xxx
GLM_API_KEY=xxx
DEEPSEEK_API_KEY=xxx
KIMI_API_KEY=xxx
```

---

## 11. LIVING AGI LIFECYCLE

### Initialization

```
1. Worker starts → Durable Objects initialize
2. Python core loads → Brain.initialize()
3. Network starts → Slots begin listening
4. Discovery runs → Capabilities enumerated
5. System enters READY state
```

### Runtime Loop

```
Every 10ms:
  - Process signal queues for all slots
  - Execute triggered bindings
  - Forward signals between connected slots

Every 10s:
  - Health check for slots
  - Reset error states if stable
  - Mark inactive slots as IDLE

Every 5m:
  - Run memory decay
  - Forget low-importance memories
  - Re-run capability discovery
```

### LLM Exploration & Abstraction Loop

This is the concrete loop that turns “the internet” into a stable, composable operator corpus.
Discovery stays deterministic; the LLM is used to *propose* abstractions that must pass kernel + tests.

```
1) Discover capability (deterministic)
  DiscoveryEngine probes / OpenAPI / introspects

2) Propose abstraction (LLM-assisted)
  LLMAdapter produces:
    - OperatorSignature candidate
    - minimal test vectors
    - schema guesses + parameter semantics

3) Gate (deterministic)
  KernelPolicyEnforcer checks:
    - policy permissions for the intended side effects
    - HTTPS-only invariant (except localhost)

4) Validate (deterministic)
  Execute test vectors through OperatorRegistry.invoke()
  Record success/failure traces

5) Commit (stateful)
  Store accepted operator + traces into memory/storage
  Update health stats + drift detection
```

Cadence suggestion (keep simple and safe by default):

- **On-demand**: when a user adds a new DiscoverySource.
- **Periodic**: re-run discovery every 5 minutes (already in runtime loop).
- **Backoff**: if a capability fails validation repeatedly, cool down and retry later.

### Adaptation Cycle

```
1. Collect thought patterns
2. Analyze success/failure rates
3. Recognize patterns
4. Store learnings
5. Adjust behavior weights
6. Prune unused connections
```

---

## 12. EXTENSION POINTS

### Adding a New Page

1. Create `src/pages/NewPage.tsx`
2. Add route in `src/main.tsx`:
```typescript
{ path: "/new", element: <NewPage />, errorElement: <RouteErrorBoundary /> }
```
3. Add navigation in sidebar

### Adding a New Entity

1. Define type in `shared/types.ts`
2. Create entity in `worker/entities.ts`:
```typescript
export class NewEntity extends IndexedEntity<NewType> {
  static readonly entityName = "new";
  static readonly indexName = "news";
  static readonly initialState: NewType = { ... };
  static seedData = [...];
}
```
3. Add routes in `worker/user-routes.ts`
4. Add hooks in `hooks/use-nexus-api.ts`

### Adding a New Operator Type

1. Add to `OperatorType` enum in `core/operators.py`
2. Implement execution logic in `OperatorRegistry.invoke()`
3. Register signature with `registry.register()`

### Adding a New Discovery Method

1. Add to `DiscoveryMethod` enum in `core/discovery.py`
2. Implement `_discover_{method}()` in `DiscoveryEngine`
3. Add to `discover_from_source()` switch

### Adding a New LLM Model

1. Add to `MODELS` dict in `infra/llm.py`
2. Set provider, endpoint, API key env var
3. Add task mapping if specialized

---

## 📌 QUICK REFERENCE

### Valid API Keys
```
bnk_master_x7k9m2p4q8r1  (Master)
fgk_nexus_x7k9m2p4q8r1   (Master - legacy)
fgk_prod_82h1s92k1l      (Admin)
fgk_dev_19s2j81l0p       (Admin)
bnk_service_auto_7h3j9k2m (Service)
```

### Key Ports
- Frontend Dev: `3002`
- Worker Dev: `8787`
- Python API: `8000`

### Key Commands
```bash
bun dev              # Start frontend dev server
wrangler dev         # Start worker locally
python main.py       # Start Python core
bun build           # Build for production
wrangler deploy     # Deploy to Cloudflare
```

### Key URLs
- Dashboard: `http://localhost:3002/`
- API: `http://localhost:3002/api/`
- Worker: `http://localhost:8787/`

---

*Last Updated: December 2025*
*Version: 1.0*
*Maintainer: Creator*
