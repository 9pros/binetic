# Binetic Core

A clean, production-ready emergent AGI system designed for Cloudflare infrastructure.

## 🏗️ Architecture

```
binetic-core/
├── main.py                # Worker entry point
├── core/                  # Core intelligence modules
│   ├── operators.py       # Composable logic operators
│   ├── network.py         # Emergent network with reactive slots
│   ├── memtools.py        # Memory with decay and patterns
│   ├── discovery.py       # Capability discovery engine
│   └── brain.py           # Central intelligence coordinator
├── security/              # Authentication & authorization
│   ├── auth.py            # JWT-based authentication
│   ├── keys.py            # API key management
│   ├── policies.py        # Policy-based access control
│   └── sessions.py        # Session management
├── api/                   # REST API
│   ├── routes.py          # All endpoints
│   └── middleware.py      # Auth, CORS, rate limiting
├── infra/                 # Cloud infrastructure
│   └── cloudflare.py      # KV, D1, R2 adapters
├── tests/                 # Non-intrusive testing
│   ├── framework.py       # Test runner
│   └── suites/            # Test suites
└── docs/                  # Documentation
    └── FRONTEND_PROMPTS.md # UI generation prompts
```

## 🚀 Quick Start

### Local Development

```bash
# Install dependencies
pip install -r requirements.txt

# Run tests
python -m pytest tests/

# Start local server
python -m uvicorn main:app --reload
```

### Deploy to Cloudflare

```bash
# Install Wrangler
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Create KV namespaces
wrangler kv:namespace create KV_SESSIONS
wrangler kv:namespace create KV_KEYS

# Create D1 database
wrangler d1 create binetic-db

# Create R2 bucket
wrangler r2 bucket create binetic

# Set secrets
wrangler secret put JWT_SECRET
wrangler secret put MASTER_KEY_HASH

# Deploy
wrangler deploy
```

## 🔐 Security

### Key Hierarchy
- **Master Key**: Full access, cannot be revoked
- **Admin Key**: Manage keys and policies
- **User Key**: Standard access
- **Service Key**: Machine-to-machine
- **Readonly Key**: Read-only access

### Key Format
```
fgk_{scope}_{random_hex}

Example: fgk_user_a1b2c3d4e5f6g7h8
```

### Permission Levels
| Level | Value | Description |
|-------|-------|-------------|
| NONE | 0 | No access |
| READ | 1 | Read data |
| EXECUTE | 2 | Execute operations |
| WRITE | 3 | Write/modify data |
| ADMIN | 4 | Full resource control |
| MASTER | 5 | System-wide control |

## 📡 API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/login` | Login with API key |
| GET | `/api/keys` | List API keys |
| POST | `/api/keys` | Create new key |
| GET | `/api/policies` | List policies |
| POST | `/api/brain/think` | Submit a thought |
| GET | `/api/brain/stats` | Get brain statistics |
| GET | `/api/network/slots` | List network slots |
| POST | `/api/network/signal` | Emit a signal |
| POST | `/api/memory/store` | Store memory |
| POST | `/api/memory/recall` | Recall memories |
| GET | `/api/discovery/capabilities` | List capabilities |
| GET | `/api/health` | Health check |

## 🧠 Core Concepts

### Brain
The central coordinator that orchestrates all subsystems:
- Processes thoughts (queries, commands, observations)
- Manages goals
- Triggers adaptation and learning

### Network
Emergent intelligence substrate:
- Reactive slots (micro-agents)
- Signal-based communication
- Dynamic bindings

### Operators
Composable logic units:
- Discovered from APIs
- Chained into pipelines
- 17 operator types (map, filter, reduce, etc.)

### Memory
Persistent memory with:
- Importance-based decay
- Pattern recognition
- Semantic search (with embeddings)

## 🎨 Frontend

See [docs/FRONTEND_PROMPTS.md](docs/FRONTEND_PROMPTS.md) for comprehensive prompts to generate the Control Center UI.

The UI should be built with:
- Next.js 14+ (App Router)
- Tailwind CSS (dark mode)
- Deployed to Cloudflare Pages

## 📊 Testing

```bash
# Run all tests
python -c "
import asyncio
from tests import get_test_runner
runner = get_test_runner()
results = asyncio.run(runner.run_all())
print(f'Passed: {results[\"summary\"][\"passed\"]}/{results[\"summary\"][\"total\"]}')
"
```

## 📝 Documentation

- [PROJECT_LOG.md](PROJECT_LOG.md) - Complete action log and decisions
- [docs/FRONTEND_PROMPTS.md](docs/FRONTEND_PROMPTS.md) - UI generation prompts

## 🔧 Configuration

### Environment Variables
| Variable | Description | Required |
|----------|-------------|----------|
| `JWT_SECRET` | Secret for JWT signing | Yes |
| `MASTER_KEY_HASH` | SHA-256 hash of master key | Yes |
| `ENVIRONMENT` | `development` or `production` | No |

### Cloudflare Bindings
| Binding | Type | Purpose |
|---------|------|---------|
| `KV_SESSIONS` | KV | Session storage |
| `KV_KEYS` | KV | Key cache |
| `D1_DATABASE` | D1 | Persistent storage |
| `R2_BUCKET` | R2 | File storage |

## License

MIT
