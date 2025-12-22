"""
Security Module - Authentication, Authorization, and Key Management

Designed for Cloudflare infrastructure:
- API keys stored in KV with encryption
- Policies stored in D1
- Sessions in KV with TTL
- Master key in Secrets
"""

from .auth import (
    AuthGateway,
    AuthToken,
    AuthContext,
    require_auth,
    get_auth_gateway,
)
from .keys import (
    KeyManager,
    APIKey,
    KeyScope,
    KeyStatus,
    get_key_manager,
)
from .policies import (
    PolicyEngine,
    Policy,
    Permission,
    PermissionLevel,
    ResourceType,
    RateLimit,
    Restriction,
    get_policy_engine,
    DEFAULT_POLICIES,
)
from .sessions import (
    SessionManager,
    Session,
    get_session_manager,
)

__all__ = [
    # Auth
    "AuthGateway",
    "AuthToken",
    "AuthContext",
    "require_auth",
    "get_auth_gateway",
    # Keys
    "KeyManager",
    "APIKey",
    "KeyScope",
    "KeyStatus",
    "get_key_manager",
    # Policies
    "PolicyEngine",
    "Policy",
    "Permission",
    "PermissionLevel",
    "ResourceType",
    "RateLimit",
    "Restriction",
    "get_policy_engine",
    "DEFAULT_POLICIES",
    # Sessions
    "SessionManager",
    "Session",
    "get_session_manager",
]
