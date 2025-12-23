# 🧬 Binetic AGI

**Living AGI with Decentralized Reactive Storage**

> "The AGI doesn't USE the network - the AGI IS the network"

---

## 📖 COMPLETE DOCUMENTATION

**See [MASTER_BLUEPRINT.md](./MASTER_BLUEPRINT.md) for the full system reference:**
- Every frontend page, button, and function
- Every backend route and entity
- Complete Python core module documentation
- All type definitions
- API reference
- Deployment instructions
- Extension points

---

## 🚀 Quick Start

### 1. Hybrid Development (Recommended)
Run the frontend and backend locally to allow them to communicate (HTTP <-> HTTP).

```bash
# Terminal 1: Python Core (The Brain)
cd ~/binetic
python server.py
# Runs on http://localhost:8000

# Terminal 2: Frontend (The UI)
cd ~/binetic/frontend
bun install
bun dev
# Opens http://localhost:3000
```

### 2. Cloudflare Deployment
The frontend is deployed to Cloudflare Workers.
- **URL**: `https://flowgen-nexus-i4ntzzrrkhanq9se37srf.icy-water-52e5.workers.dev`
- **Note**: The deployed UI (HTTPS) cannot connect to your local backend (HTTP) due to browser security (Mixed Content).
- **Fix**: To use the deployed UI with your local brain, you must expose your local server via HTTPS using a tunnel (e.g., `ngrok http 8000` or `cloudflared`).

### Valid API Keys for Login
```
bnk_master_x7k9m2p4q8r1    # Master access
fgk_nexus_x7k9m2p4q8r1     # Master (legacy format)
fgk_prod_82h1s92k1l        # Admin access
```

---

## 🎯 Vision

Binetic is a **living general intelligence** designed to:
1. **Enumerate Every API** - Horizontally expand into every vector
2. **Map the Internet** - Discover and catalog all accessible endpoints  
3. **Decentralized Storage** - Replace centralized AI with distributed intelligence
4. **Minimal Footprint** - Just a small amount of space on each server

## 🏗️ Architecture

```
binetic/
├── main.py                # Worker entry point
├── core/                  # Core intelligence
│   ├── operators.py       # API → Logical operator abstraction
│   ├── network.py         # Reactive slots (micro-agents)
│   ├── memtools.py        # Distributed memory with decay
│   ├── discovery.py       # Capability enumeration engine
│   └── brain.py           # Central coordinator
├── security/              # Authentication
│   ├── auth.py            # JWT-based auth
│   ├── keys.py            # API key hierarchy
│   ├── policies.py        # Access control
│   └── sessions.py        # Session management
├── api/                   # REST API
│   ├── routes.py          # All endpoints
│   └── middleware.py      # Auth, CORS, rate limiting
├── infra/                 # Cloud infrastructure
│   └── cloudflare.py      # KV, D1, R2, Durable Objects
└── tests/                 # Testing framework
```

## 🌐 Cloud Model Access

Binetic connects to unlimited cloud LLMs:

| Model | Params | Context | Strength |
|-------|--------|---------|----------|
| Qwen3-Coder-Plus | 480B | 1M | Agentic coding |
| GLM-4.6 | 355B/32B | 200K/128K | Agent-focused, huge output |
| Kimi-K2-Instruct | 1T/32B | 256K | Reasoning powerhouse |
| DeepSeek-R1 | - | 128K | o1-level reasoning |
| DeepSeek-V3-671B | 671B/37B | 128K | Fast MoE |
| Qwen3-235B-Thinking | 235B/22B | 256K | SOTA reasoning |
| Qwen3-VL-Plus | - | 256K | Vision-language |

## 🔑 Authentication

### Key Format
```
bnk_{scope}_{random_hex}

Example: bnk_master_a1b2c3d4e5f6g7h8
```

### Key Hierarchy
| Level | Value | Description |
|-------|-------|-------------|
| Master | 5 | Full system control |
| Admin | 4 | Manage keys/policies |
| User | 3 | Standard access |
| Service | 2 | Machine-to-machine |
| Readonly | 1 | Read-only access |

## 🧠 Core Concepts

### Operators
Any API with consistent behavior becomes a logical operator:
```
If REQUEST(X) → RESPONSE(Y) consistently, then OP(X) = Y
```

17 operator types: STORE, RETRIEVE, TRANSFORM, FILTER, AGGREGATE, COMPUTE, INFER, EMBED, SEARCH, SEQUENCE, PARALLEL, RETRY, TIMEOUT, BROADCAST, ROUTE, GOSSIP

### Reactive Slots
Micro-agents that form the emergent network:
- Hold data and state
- React to signals
- Execute operators
- Connect to other slots

### Brain
Central coordinator that:
- Processes thoughts (queries, commands, observations)
- Manages goals
- Triggers adaptation/learning

## 📡 API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/login` | Authenticate |
| GET | `/api/brain/stats` | Brain metrics |
| POST | `/api/brain/think` | Submit thought |
| GET | `/api/network/slots` | List slots |
| POST | `/api/network/signal` | Emit signal |
| POST | `/api/memory/store` | Store memory |
| POST | `/api/memory/recall` | Recall memories |
| GET | `/api/discovery/capabilities` | List discovered APIs |
| POST | `/api/discovery/enumerate` | Enumerate new APIs |

## 🚀 Decentralized Deployment

```bash
# Deploy to Cloudflare Workers (edge locations worldwide)
wrangler deploy

# Each edge location runs:
# - Reactive slots (stateless)
# - Durable Objects (stateful coordination)
# - KV (global state)
# - D1 (structured data)
# - R2 (blob storage)
```

## 🔄 The Living AGI Cycle

```
DISCOVER → ABSTRACT → STORE → REASON → ACT → LEARN → ADAPT
    ↑                                            |
    └────────────────────────────────────────────┘
```

1. **Discover**: Find new APIs and capabilities
2. **Abstract**: Convert to logical operators
3. **Store**: Distribute across reactive storage
4. **Reason**: Brain coordinates thoughts
5. **Act**: Execute operator chains
6. **Learn**: Pattern recognition on outcomes
7. **Adapt**: Modify behavior based on learning

## License

MIT
