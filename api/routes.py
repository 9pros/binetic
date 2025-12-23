"""
API Routes - HTTP endpoints for Binetic Control Center

Designed for Cloudflare Workers deployment.
"""

from dataclasses import dataclass
from typing import Any, Callable, Dict, List, Optional
from enum import Enum
import json
import time
import logging

from security.auth import AuthGateway, AuthContext, require_auth
from security.keys import KeyManager, KeyScope, APIKey
from security.policies import PolicyEngine, Policy, Permission, PermissionLevel, ResourceType
from security.sessions import SessionManager, Session
from core.brain import Brain, Thought, ThoughtType, Goal
from core.operators import OperatorRegistry
from core.network import EmergentNetwork
from core.memtools import MemtoolRegistry
from core.discovery import DiscoveryEngine

logger = logging.getLogger(__name__)


class HttpMethod(Enum):
    GET = "GET"
    POST = "POST"
    PUT = "PUT"
    PATCH = "PATCH"
    DELETE = "DELETE"
    OPTIONS = "OPTIONS"


@dataclass
class Request:
    """HTTP request abstraction"""
    method: HttpMethod
    path: str
    headers: Dict[str, str]
    query: Dict[str, str]
    body: Optional[Any] = None
    auth_context: Optional[AuthContext] = None


@dataclass
class Response:
    """HTTP response abstraction"""
    status: int = 200
    body: Any = None
    headers: Dict[str, str] = None
    
    def __post_init__(self):
        if self.headers is None:
            self.headers = {"Content-Type": "application/json"}
    
    def to_dict(self) -> Dict:
        return {
            "status": self.status,
            "body": self.body,
            "headers": self.headers,
        }


class Router:
    """Simple route matching for Cloudflare Workers"""
    
    def __init__(self):
        self._routes: Dict[str, Dict[str, Callable]] = {}
        self._middleware: List[Callable] = []
    
    def route(self, path: str, method: HttpMethod = HttpMethod.GET):
        """Decorator to register a route"""
        def decorator(handler: Callable):
            if path not in self._routes:
                self._routes[path] = {}
            self._routes[path][method.value] = handler
            return handler
        return decorator
    
    def use(self, middleware: Callable):
        """Add middleware"""
        self._middleware.append(middleware)
    
    async def handle(self, request: Request) -> Response:
        """Handle incoming request"""
        # Apply middleware
        for mw in self._middleware:
            result = await mw(request)
            if isinstance(result, Response):
                return result
        
        # Find matching route
        handler = self._find_handler(request.path, request.method.value)
        if not handler:
            return Response(status=404, body={"error": "Not found"})
        
        try:
            return await handler(request)
        except Exception as e:
            logger.error(f"Route error: {e}")
            return Response(status=500, body={"error": str(e)})
    
    def _find_handler(self, path: str, method: str) -> Optional[Callable]:
        """Find handler for path and method"""
        # Exact match
        if path in self._routes and method in self._routes[path]:
            return self._routes[path][method]
        
        # Pattern matching (simple :param style)
        for route_path, methods in self._routes.items():
            if self._path_matches(route_path, path) and method in methods:
                return methods[method]
        
        return None
    
    def _path_matches(self, pattern: str, path: str) -> bool:
        """Check if path matches pattern with :params"""
        pattern_parts = pattern.split("/")
        path_parts = path.split("/")
        
        if len(pattern_parts) != len(path_parts):
            return False
        
        for pp, cp in zip(pattern_parts, path_parts):
            if pp.startswith(":"):
                continue
            if pp != cp:
                return False
        
        return True


# Create main router
router = Router()


# ============================================================================
# Authentication Routes
# ============================================================================

@router.route("/api/auth/login", HttpMethod.POST)
async def login(request: Request) -> Response:
    """Authenticate with API key and get session token"""
    body = request.body or {}
    api_key = body.get("api_key")
    
    if not api_key:
        return Response(status=400, body={"error": "API key required"})
    
    from security.auth import get_auth_gateway
    gateway = get_auth_gateway()
    
    context = await gateway.authenticate(api_key)
    if not context.is_authenticated:
        return Response(status=401, body={"error": "Invalid API key"})
    
    # Create session
    from security.sessions import get_session_manager
    sessions = get_session_manager()
    session = await sessions.create_session(
        key_id=context.key_id,
        owner_id=context.owner_id,
    )
    
    # Generate token
    token = gateway.create_token(context)
    
    return Response(body={
        "token": token,
        "session_id": session.session_id,
        "expires_in": 3600,
        "scope": context.scope,
    })


@router.route("/api/auth/logout", HttpMethod.POST)
async def logout(request: Request) -> Response:
    """End session and invalidate token"""
    if not request.auth_context or not request.auth_context.is_authenticated:
        return Response(status=401, body={"error": "Not authenticated"})
    
    # Delete session
    session_id = request.body.get("session_id") if request.body else None
    if session_id:
        from security.sessions import get_session_manager
        sessions = get_session_manager()
        await sessions.delete_session(session_id)
    
    return Response(body={"status": "logged_out"})


@router.route("/api/auth/refresh", HttpMethod.POST)
async def refresh_token(request: Request) -> Response:
    """Refresh authentication token"""
    if not request.auth_context or not request.auth_context.is_authenticated:
        return Response(status=401, body={"error": "Not authenticated"})
    
    from security.auth import get_auth_gateway
    gateway = get_auth_gateway()
    
    token = gateway.create_token(request.auth_context)
    
    return Response(body={
        "token": token,
        "expires_in": 3600,
    })


# ============================================================================
# Key Management Routes
# ============================================================================

@router.route("/api/keys", HttpMethod.GET)
async def list_keys(request: Request) -> Response:
    """List API keys (admin only)"""
    if not request.auth_context:
        return Response(status=401, body={"error": "Not authenticated"})
    
    # Check admin permission
    from security.auth import get_auth_gateway
    gateway = get_auth_gateway()
    
    if not await gateway.authorize(
        request.auth_context,
        ResourceType.KEY,
        "*",
        PermissionLevel.READ,
    ):
        return Response(status=403, body={"error": "Insufficient permissions"})
    
    from security.keys import get_key_manager
    keys = get_key_manager()
    
    key_list = await keys.list_keys(
        owner_id=request.auth_context.owner_id,
        include_revoked=False,
    )
    
    return Response(body={
        "keys": [
            {
                "key_id": k.key_id,
                "scope": k.scope.value,
                "owner_id": k.owner_id,
                "created_at": k.created_at,
                "expires_at": k.expires_at,
                "status": k.status.value,
            }
            for k in key_list
        ]
    })


@router.route("/api/keys", HttpMethod.POST)
async def create_key(request: Request) -> Response:
    """Create a new API key"""
    if not request.auth_context:
        return Response(status=401, body={"error": "Not authenticated"})
    
    from security.auth import get_auth_gateway
    gateway = get_auth_gateway()
    
    if not await gateway.authorize(
        request.auth_context,
        ResourceType.KEY,
        "*",
        PermissionLevel.WRITE,
    ):
        return Response(status=403, body={"error": "Insufficient permissions"})
    
    body = request.body or {}
    scope = KeyScope(body.get("scope", "user"))
    policy_id = body.get("policy_id")
    expires_days = body.get("expires_days", 365)
    metadata = body.get("metadata", {})
    
    from security.keys import get_key_manager
    keys = get_key_manager()
    
    key, raw_key = await keys.create_key(
        scope=scope,
        owner_id=request.auth_context.owner_id,
        policy_id=policy_id,
        expires_days=expires_days,
        metadata=metadata,
    )
    
    # Return raw key only once - it cannot be retrieved again
    return Response(status=201, body={
        "key_id": key.key_id,
        "api_key": raw_key,  # Only returned at creation!
        "scope": key.scope.value,
        "expires_at": key.expires_at,
        "warning": "Store this API key securely. It cannot be retrieved again.",
    })


@router.route("/api/keys/:key_id", HttpMethod.DELETE)
async def revoke_key(request: Request) -> Response:
    """Revoke an API key"""
    if not request.auth_context:
        return Response(status=401, body={"error": "Not authenticated"})
    
    key_id = request.path.split("/")[-1]
    
    from security.auth import get_auth_gateway
    gateway = get_auth_gateway()
    
    if not await gateway.authorize(
        request.auth_context,
        ResourceType.KEY,
        key_id,
        PermissionLevel.WRITE,
    ):
        return Response(status=403, body={"error": "Insufficient permissions"})
    
    from security.keys import get_key_manager
    keys = get_key_manager()
    
    success = await keys.revoke_key(key_id)
    if not success:
        return Response(status=404, body={"error": "Key not found"})
    
    return Response(body={"status": "revoked", "key_id": key_id})


# ============================================================================
# Policy Management Routes
# ============================================================================

@router.route("/api/policies", HttpMethod.GET)
async def list_policies(request: Request) -> Response:
    """List policies"""
    if not request.auth_context:
        return Response(status=401, body={"error": "Not authenticated"})
    
    from security.auth import get_auth_gateway
    gateway = get_auth_gateway()
    
    if not await gateway.authorize(
        request.auth_context,
        ResourceType.POLICY,
        "*",
        PermissionLevel.READ,
    ):
        return Response(status=403, body={"error": "Insufficient permissions"})
    
    from security.policies import get_policy_engine
    policies = get_policy_engine()
    
    policy_list = list(policies._policies.values())
    
    return Response(body={
        "policies": [
            {
                "policy_id": p.policy_id,
                "name": p.name,
                "description": p.description,
                "permissions_count": len(p.permissions),
                "is_default": p.is_default,
            }
            for p in policy_list
        ]
    })


@router.route("/api/policies", HttpMethod.POST)
async def create_policy(request: Request) -> Response:
    """Create a new policy (master only)"""
    if not request.auth_context:
        return Response(status=401, body={"error": "Not authenticated"})
    
    from security.auth import get_auth_gateway
    gateway = get_auth_gateway()
    
    if not await gateway.authorize(
        request.auth_context,
        ResourceType.POLICY,
        "*",
        PermissionLevel.ADMIN,
    ):
        return Response(status=403, body={"error": "Insufficient permissions"})
    
    body = request.body or {}
    
    policy = Policy(
        policy_id=body.get("policy_id", f"policy_{int(time.time())}"),
        name=body.get("name", "Custom Policy"),
        description=body.get("description", ""),
    )
    
    # Parse permissions
    for perm_data in body.get("permissions", []):
        perm = Permission(
            resource_type=ResourceType(perm_data["resource_type"]),
            resource_id=perm_data.get("resource_id", "*"),
            level=PermissionLevel(perm_data.get("level", 1)),
        )
        policy.permissions.append(perm)
    
    from security.policies import get_policy_engine
    policies = get_policy_engine()
    policies.register_policy(policy)
    
    return Response(status=201, body={
        "policy_id": policy.policy_id,
        "name": policy.name,
    })


# ============================================================================
# Kernel Policy Routes (Global Guardrails)
# ============================================================================

@router.route("/api/kernel/policies", HttpMethod.GET)
async def list_kernel_policies(request: Request) -> Response:
    """List kernel policies (master only)"""
    if not request.auth_context:
        return Response(status=401, body={"error": "Not authenticated"})

    from security.auth import get_auth_gateway
    gateway = get_auth_gateway()

    allowed, _ = await gateway.check_access(
        request.auth_context,
        ResourceType.SYSTEM,
        resource_id="kernel",
        required_level=PermissionLevel.MASTER,
    )
    if not allowed:
        return Response(status=403, body={"error": "Insufficient permissions"})

    from security.kernel import get_kernel_enforcer
    enforcer = get_kernel_enforcer()

    return Response(
        body={
            "policies": [p.to_dict() for p in enforcer.list_kernel_policies(active_only=False)],
        }
    )


@router.route("/api/kernel/policies/:policy_id", HttpMethod.GET)
async def get_kernel_policy(request: Request) -> Response:
    """Get a kernel policy by id (master only)"""
    if not request.auth_context:
        return Response(status=401, body={"error": "Not authenticated"})

    from security.auth import get_auth_gateway
    gateway = get_auth_gateway()

    allowed, _ = await gateway.check_access(
        request.auth_context,
        ResourceType.SYSTEM,
        resource_id="kernel",
        required_level=PermissionLevel.MASTER,
    )
    if not allowed:
        return Response(status=403, body={"error": "Insufficient permissions"})

    policy_id = request.path.split("/")[-1]
    from security.policies import get_policy_engine
    pe = get_policy_engine()
    policy = await pe.get_policy(policy_id)
    if not policy or not policy.policy_id.startswith("kpol_"):
        return Response(status=404, body={"error": "Kernel policy not found"})

    return Response(body=policy.to_dict())


@router.route("/api/kernel/policies", HttpMethod.POST)
async def create_kernel_policy(request: Request) -> Response:
    """Create a kernel policy (master only)"""
    if not request.auth_context:
        return Response(status=401, body={"error": "Not authenticated"})

    from security.auth import get_auth_gateway
    gateway = get_auth_gateway()

    allowed, _ = await gateway.check_access(
        request.auth_context,
        ResourceType.SYSTEM,
        resource_id="kernel",
        required_level=PermissionLevel.MASTER,
    )
    if not allowed:
        return Response(status=403, body={"error": "Insufficient permissions"})

    body = request.body or {}

    # Create a kernel policy with explicit ID prefix
    policy_id = body.get("policy_id") or f"kpol_{int(time.time())}"
    if not str(policy_id).startswith("kpol_"):
        return Response(status=400, body={"error": "policy_id must start with 'kpol_'"})

    policy = Policy(
        policy_id=policy_id,
        name=body.get("name", "Kernel Policy"),
        description=body.get("description", ""),
        created_by=request.auth_context.key_id if request.auth_context else "unknown",
    )

    # Parse permissions
    perms = []
    for perm_data in body.get("permissions", []):
        try:
            perms.append(
                Permission(
                    resource_type=ResourceType(perm_data["resource_type"]),
                    resource_id=perm_data.get("resource_id"),
                    level=PermissionLevel(int(perm_data["level"])),
                )
            )
        except Exception as e:
            return Response(status=400, body={"error": f"Invalid permission: {e}"})
    policy.permissions = perms

    # Allow/deny lists
    policy.allowed_operators = body.get("allowed_operators", [])
    policy.denied_operators = body.get("denied_operators", [])
    policy.allowed_endpoints = body.get("allowed_endpoints", [])
    policy.denied_endpoints = body.get("denied_endpoints", [])

    # Activation
    if "is_active" in body:
        policy.is_active = bool(body.get("is_active"))

    from security.policies import get_policy_engine
    pe = get_policy_engine()
    pe._policies[policy.policy_id] = policy

    return Response(status=201, body=policy.to_dict())


@router.route("/api/kernel/policies/:policy_id", HttpMethod.PATCH)
async def update_kernel_policy(request: Request) -> Response:
    """Update a kernel policy (master only)."""
    if not request.auth_context:
        return Response(status=401, body={"error": "Not authenticated"})

    from security.auth import get_auth_gateway
    gateway = get_auth_gateway()

    allowed, _ = await gateway.check_access(
        request.auth_context,
        ResourceType.SYSTEM,
        resource_id="kernel",
        required_level=PermissionLevel.MASTER,
    )
    if not allowed:
        return Response(status=403, body={"error": "Insufficient permissions"})

    policy_id = request.path.split("/")[-1]
    if not policy_id.startswith("kpol_"):
        return Response(status=404, body={"error": "Kernel policy not found"})

    from security.policies import get_policy_engine
    pe = get_policy_engine()
    policy = await pe.get_policy(policy_id)
    if not policy:
        return Response(status=404, body={"error": "Kernel policy not found"})

    body = request.body or {}
    for key in [
        "name",
        "description",
        "allowed_operators",
        "denied_operators",
        "allowed_endpoints",
        "denied_endpoints",
        "is_active",
    ]:
        if key in body:
            setattr(policy, key, body[key])

    if "permissions" in body:
        perms = []
        for perm_data in body.get("permissions", []):
            try:
                perms.append(
                    Permission(
                        resource_type=ResourceType(perm_data["resource_type"]),
                        resource_id=perm_data.get("resource_id"),
                        level=PermissionLevel(int(perm_data["level"])),
                    )
                )
            except Exception as e:
                return Response(status=400, body={"error": f"Invalid permission: {e}"})
        policy.permissions = perms

    policy.updated_at = time.time()
    pe._policies[policy.policy_id] = policy

    return Response(body=policy.to_dict())


@router.route("/api/kernel/policies/:policy_id", HttpMethod.DELETE)
async def delete_kernel_policy(request: Request) -> Response:
    """Delete a kernel policy (master only)."""
    if not request.auth_context:
        return Response(status=401, body={"error": "Not authenticated"})

    from security.auth import get_auth_gateway
    gateway = get_auth_gateway()

    allowed, _ = await gateway.check_access(
        request.auth_context,
        ResourceType.SYSTEM,
        resource_id="kernel",
        required_level=PermissionLevel.MASTER,
    )
    if not allowed:
        return Response(status=403, body={"error": "Insufficient permissions"})

    policy_id = request.path.split("/")[-1]
    if not policy_id.startswith("kpol_"):
        return Response(status=404, body={"error": "Kernel policy not found"})

    from security.policies import get_policy_engine
    pe = get_policy_engine()
    ok = await pe.delete_policy(policy_id)
    if not ok:
        return Response(status=404, body={"error": "Kernel policy not found"})

    return Response(body={"deleted": True, "policy_id": policy_id})


# ============================================================================
# Brain/Intelligence Routes
# ============================================================================

@router.route("/api/brain/think", HttpMethod.POST)
async def think(request: Request) -> Response:
    """Submit a thought for processing"""
    if not request.auth_context:
        return Response(status=401, body={"error": "Not authenticated"})
    
    from security.auth import get_auth_gateway
    gateway = get_auth_gateway()
    
    if not await gateway.authorize(
        request.auth_context,
        ResourceType.SYSTEM,
        "brain",
        PermissionLevel.EXECUTE,
    ):
        return Response(status=403, body={"error": "Insufficient permissions"})
    
    body = request.body or {}
    
    thought = Thought(
        thought_id=f"thought_{int(time.time() * 1000)}",
        thought_type=ThoughtType(body.get("type", "query")),
        content=body.get("content"),
        context=body.get("context", {}),
        source=request.auth_context.key_id,
    )
    
    from core.brain import get_brain
    brain = await get_brain()
    
    result = await brain.think(thought)
    
    return Response(body={
        "thought_id": thought.thought_id,
        "result": result,
        "processed_at": thought.processed_at,
    })


@router.route("/api/brain/stats", HttpMethod.GET)
async def brain_stats(request: Request) -> Response:
    """Get brain statistics"""
    if not request.auth_context:
        return Response(status=401, body={"error": "Not authenticated"})
    
    from core.brain import get_brain
    brain = await get_brain()
    
    return Response(body=brain.stats())


@router.route("/api/brain/goals", HttpMethod.POST)
async def set_goal(request: Request) -> Response:
    """Set a new goal"""
    if not request.auth_context:
        return Response(status=401, body={"error": "Not authenticated"})
    
    body = request.body or {}
    
    goal = Goal(
        goal_id=f"goal_{int(time.time())}",
        description=body.get("description", ""),
        priority=body.get("priority", 0.5),
    )
    
    from core.brain import get_brain
    brain = await get_brain()
    await brain.set_goal(goal)
    
    return Response(status=201, body={
        "goal_id": goal.goal_id,
        "description": goal.description,
    })


# ============================================================================
# Network Routes
# ============================================================================

@router.route("/api/network/slots", HttpMethod.GET)
async def list_slots(request: Request) -> Response:
    """List network slots"""
    if not request.auth_context:
        return Response(status=401, body={"error": "Not authenticated"})
    
    from core.network import get_network
    network = get_network()
    
    slots = list(network._slots.values())
    
    return Response(body={
        "slots": [
            {
                "slot_id": s.slot_id,
                "state": s.state.value,
                "operators": [o.value for o in s.operators],
                "connections": list(s.connections),
            }
            for s in slots
        ]
    })


@router.route("/api/network/signal", HttpMethod.POST)
async def emit_signal(request: Request) -> Response:
    """Emit a signal to the network"""
    if not request.auth_context:
        return Response(status=401, body={"error": "Not authenticated"})
    
    from security.auth import get_auth_gateway
    gateway = get_auth_gateway()
    
    if not await gateway.authorize(
        request.auth_context,
        ResourceType.NETWORK,
        "*",
        PermissionLevel.EXECUTE,
    ):
        return Response(status=403, body={"error": "Insufficient permissions"})
    
    body = request.body or {}
    
    from core.network import Signal, get_network
    network = get_network()
    
    signal = Signal(
        signal_id=f"sig_{int(time.time() * 1000)}",
        signal_type=body.get("type", "data"),
        payload=body.get("payload"),
        source=body.get("source", "api"),
        target=body.get("target"),
    )
    
    await network.emit(signal)
    
    return Response(body={
        "signal_id": signal.signal_id,
        "emitted": True,
    })


# ============================================================================
# Discovery Routes
# ============================================================================

@router.route("/api/discovery/capabilities", HttpMethod.GET)
async def list_capabilities(request: Request) -> Response:
    """List discovered capabilities"""
    if not request.auth_context:
        return Response(status=401, body={"error": "Not authenticated"})
    
    from core.discovery import get_discovery_engine
    discovery = get_discovery_engine()
    
    capabilities = discovery.search_capabilities()
    
    return Response(body={
        "capabilities": [c.to_dict() for c in capabilities],
    })


@router.route("/api/discovery/discover", HttpMethod.POST)
async def trigger_discovery(request: Request) -> Response:
    """Trigger capability discovery"""
    if not request.auth_context:
        return Response(status=401, body={"error": "Not authenticated"})
    
    from security.auth import get_auth_gateway
    gateway = get_auth_gateway()
    
    if not await gateway.authorize(
        request.auth_context,
        ResourceType.SYSTEM,
        "discovery",
        PermissionLevel.ADMIN,
    ):
        return Response(status=403, body={"error": "Insufficient permissions"})
    
    from core.discovery import get_discovery_engine
    discovery = get_discovery_engine()
    
    results = await discovery.discover_all()
    
    return Response(body={
        "discovery_complete": True,
        "sources_probed": len(results),
        "total_capabilities": sum(len(caps) for caps in results.values()),
    })


# ============================================================================
# Memory Routes
# ============================================================================

@router.route("/api/memory/store", HttpMethod.POST)
async def store_memory(request: Request) -> Response:
    """Store a memory"""
    if not request.auth_context:
        return Response(status=401, body={"error": "Not authenticated"})
    
    body = request.body or {}
    
    from core.memtools import get_memtools
    memtools = get_memtools()
    
    memory = await memtools.store(
        content=body.get("content"),
        memory_type=body.get("type", "general"),
        importance=body.get("importance", 0.5),
        tags=set(body.get("tags", [])),
    )
    
    return Response(status=201, body={
        "memory_id": memory.memory_id,
        "stored": True,
    })


@router.route("/api/memory/recall", HttpMethod.POST)
async def recall_memory(request: Request) -> Response:
    """Recall memories"""
    if not request.auth_context:
        return Response(status=401, body={"error": "Not authenticated"})
    
    body = request.body or {}
    
    from core.memtools import get_memtools
    memtools = get_memtools()
    
    memories = await memtools.recall(
        memory_id=body.get("memory_id"),
        query=body.get("query"),
        tags=set(body.get("tags", [])) if body.get("tags") else None,
        memory_type=body.get("type"),
        limit=body.get("limit", 10),
    )
    
    return Response(body={
        "memories": [m.to_dict() for m in memories],
    })


@router.route("/api/memory/stats", HttpMethod.GET)
async def memory_stats(request: Request) -> Response:
    """Get memory statistics"""
    if not request.auth_context:
        return Response(status=401, body={"error": "Not authenticated"})
    
    from core.memtools import get_memtools
    memtools = get_memtools()
    
    return Response(body=memtools.stats())


# ============================================================================
# Operator Routes
# ============================================================================

@router.route("/api/operators", HttpMethod.GET)
async def list_operators(request: Request) -> Response:
    """List registered operators"""
    if not request.auth_context:
        return Response(status=401, body={"error": "Not authenticated"})
    
    from core.operators import get_operator_registry
    registry = get_operator_registry()
    
    operators = list(registry._operators.keys())
    
    return Response(body={
        "operators": operators,
    })


@router.route("/api/operators/:name/invoke", HttpMethod.POST)
async def invoke_operator(request: Request) -> Response:
    """Invoke an operator"""
    if not request.auth_context:
        return Response(status=401, body={"error": "Not authenticated"})
    
    from security.auth import get_auth_gateway
    gateway = get_auth_gateway()
    
    operator_name = request.path.split("/")[-2]
    
    if not await gateway.authorize(
        request.auth_context,
        ResourceType.OPERATOR,
        operator_name,
        PermissionLevel.EXECUTE,
    ):
        return Response(status=403, body={"error": "Insufficient permissions"})
    
    body = request.body or {}
    
    from core.operators import get_operator_registry
    registry = get_operator_registry()
    
    result = await registry.invoke(operator_name, body.get("input"))
    
    return Response(body={
        "operator": operator_name,
        "result": result,
    })


# ============================================================================
# Audit Routes
# ============================================================================

@router.route("/api/audit", HttpMethod.GET)
async def get_audit_log(request: Request) -> Response:
    """Get audit log (admin only)"""
    if not request.auth_context:
        return Response(status=401, body={"error": "Not authenticated"})
    
    from security.auth import get_auth_gateway
    gateway = get_auth_gateway()
    
    if not await gateway.authorize(
        request.auth_context,
        ResourceType.AUDIT,
        "*",
        PermissionLevel.READ,
    ):
        return Response(status=403, body={"error": "Insufficient permissions"})
    
    # In production, this would query D1
    return Response(body={
        "audit_entries": [],
        "note": "Audit log stored in Cloudflare D1",
    })


# ============================================================================
# Health Routes
# ============================================================================

@router.route("/api/health", HttpMethod.GET)
async def health_check(request: Request) -> Response:
    """Health check endpoint (no auth required)"""
    return Response(body={
        "status": "healthy",
        "timestamp": time.time(),
        "version": "1.0.0",
    })


@router.route("/api/health/detailed", HttpMethod.GET)
async def detailed_health(request: Request) -> Response:
    """Detailed health check"""
    if not request.auth_context:
        return Response(status=401, body={"error": "Not authenticated"})
    
    from core.brain import get_brain
    from core.network import get_network
    from core.discovery import get_discovery_engine
    
    brain = await get_brain()
    network = get_network()
    discovery = get_discovery_engine()
    
    return Response(body={
        "status": "healthy",
        "components": {
            "brain": {"state": brain.state.value},
            "network": {"slots": len(network._slots), "running": network._running},
            "discovery": discovery.stats(),
        },
        "timestamp": time.time(),
    })
