"""
Policy Engine - Creator-Defined Access Control

The creator (you) defines policies that control what each API key can do.
Policies are the source of truth for all authorization decisions.
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional, Set
import time
import json
import hashlib
import logging

logger = logging.getLogger(__name__)


class PermissionLevel(Enum):
    """Permission levels for hierarchical access"""
    NONE = 0
    READ = 1
    EXECUTE = 2
    WRITE = 3
    ADMIN = 4
    MASTER = 5


class ResourceType(Enum):
    """Types of resources that can be protected"""
    OPERATOR = "operator"
    SLOT = "slot"
    NETWORK = "network"
    KEY = "key"
    POLICY = "policy"
    USER = "user"
    AUDIT = "audit"
    SYSTEM = "system"


@dataclass
class Permission:
    """A single permission grant"""
    resource_type: ResourceType
    resource_id: Optional[str]  # None = all resources of type
    level: PermissionLevel
    
    def to_dict(self) -> Dict:
        return {
            "resource_type": self.resource_type.value,
            "resource_id": self.resource_id,
            "level": self.level.value,
        }
    
    @classmethod
    def from_dict(cls, data: Dict) -> "Permission":
        return cls(
            resource_type=ResourceType(data["resource_type"]),
            resource_id=data.get("resource_id"),
            level=PermissionLevel(data["level"]),
        )


@dataclass
class RateLimit:
    """Rate limiting configuration"""
    requests_per_minute: int = 60
    requests_per_hour: int = 1000
    requests_per_day: int = 10000
    max_concurrent: int = 10
    
    def to_dict(self) -> Dict:
        return {
            "requests_per_minute": self.requests_per_minute,
            "requests_per_hour": self.requests_per_hour,
            "requests_per_day": self.requests_per_day,
            "max_concurrent": self.max_concurrent,
        }
    
    @classmethod
    def from_dict(cls, data: Dict) -> "RateLimit":
        return cls(**data)


@dataclass
class Restriction:
    """Access restrictions"""
    ip_whitelist: List[str] = field(default_factory=list)
    ip_blacklist: List[str] = field(default_factory=list)
    valid_from: Optional[float] = None
    valid_until: Optional[float] = None
    require_2fa: bool = False
    allowed_origins: List[str] = field(default_factory=list)
    
    def to_dict(self) -> Dict:
        return {
            "ip_whitelist": self.ip_whitelist,
            "ip_blacklist": self.ip_blacklist,
            "valid_from": self.valid_from,
            "valid_until": self.valid_until,
            "require_2fa": self.require_2fa,
            "allowed_origins": self.allowed_origins,
        }
    
    @classmethod
    def from_dict(cls, data: Dict) -> "Restriction":
        return cls(**data)
    
    def is_valid_time(self) -> bool:
        """Check if current time is within valid window"""
        now = time.time()
        if self.valid_from and now < self.valid_from:
            return False
        if self.valid_until and now > self.valid_until:
            return False
        return True
    
    def is_valid_ip(self, ip: str) -> bool:
        """Check if IP is allowed"""
        if self.ip_blacklist and ip in self.ip_blacklist:
            return False
        if self.ip_whitelist and ip not in self.ip_whitelist:
            return False
        return True


@dataclass
class Policy:
    """
    A complete access control policy.
    
    Policies are created by the master (you) and assigned to API keys.
    They define exactly what each key can and cannot do.
    """
    policy_id: str
    name: str
    description: str = ""
    
    # What this policy allows
    permissions: List[Permission] = field(default_factory=list)
    
    # Operator-specific permissions
    allowed_operators: List[str] = field(default_factory=list)  # Empty = all
    denied_operators: List[str] = field(default_factory=list)
    
    # Endpoint-specific permissions
    allowed_endpoints: List[str] = field(default_factory=list)  # Empty = all
    denied_endpoints: List[str] = field(default_factory=list)
    
    # Rate limits
    rate_limits: RateLimit = field(default_factory=RateLimit)
    
    # Restrictions
    restrictions: Restriction = field(default_factory=Restriction)
    
    # Metadata
    created_by: str = ""  # Key ID of creator
    created_at: float = field(default_factory=time.time)
    updated_at: float = field(default_factory=time.time)
    is_active: bool = True
    
    def to_dict(self) -> Dict:
        return {
            "policy_id": self.policy_id,
            "name": self.name,
            "description": self.description,
            "permissions": [p.to_dict() for p in self.permissions],
            "allowed_operators": self.allowed_operators,
            "denied_operators": self.denied_operators,
            "allowed_endpoints": self.allowed_endpoints,
            "denied_endpoints": self.denied_endpoints,
            "rate_limits": self.rate_limits.to_dict(),
            "restrictions": self.restrictions.to_dict(),
            "created_by": self.created_by,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "is_active": self.is_active,
        }
    
    @classmethod
    def from_dict(cls, data: Dict) -> "Policy":
        return cls(
            policy_id=data["policy_id"],
            name=data["name"],
            description=data.get("description", ""),
            permissions=[Permission.from_dict(p) for p in data.get("permissions", [])],
            allowed_operators=data.get("allowed_operators", []),
            denied_operators=data.get("denied_operators", []),
            allowed_endpoints=data.get("allowed_endpoints", []),
            denied_endpoints=data.get("denied_endpoints", []),
            rate_limits=RateLimit.from_dict(data.get("rate_limits", {})),
            restrictions=Restriction.from_dict(data.get("restrictions", {})),
            created_by=data.get("created_by", ""),
            created_at=data.get("created_at", time.time()),
            updated_at=data.get("updated_at", time.time()),
            is_active=data.get("is_active", True),
        )
    
    def can_access_operator(self, operator_id: str) -> bool:
        """Check if policy allows access to an operator"""
        if operator_id in self.denied_operators:
            return False
        if self.allowed_operators and operator_id not in self.allowed_operators:
            return False
        return True
    
    def can_access_endpoint(self, endpoint: str) -> bool:
        """Check if policy allows access to an endpoint"""
        if any(endpoint.startswith(e) for e in self.denied_endpoints):
            return False
        if self.allowed_endpoints:
            if not any(endpoint.startswith(e) for e in self.allowed_endpoints):
                return False
        return True
    
    def get_permission_level(
        self,
        resource_type: ResourceType,
        resource_id: Optional[str] = None,
    ) -> PermissionLevel:
        """Get the permission level for a resource"""
        max_level = PermissionLevel.NONE
        
        for perm in self.permissions:
            if perm.resource_type == resource_type:
                # Check if matches specific resource or wildcard
                if perm.resource_id is None or perm.resource_id == resource_id:
                    if perm.level.value > max_level.value:
                        max_level = perm.level
        
        return max_level


class PolicyEngine:
    """
    Engine for managing and evaluating policies.
    
    This is the core authorization system. All access decisions go through here.
    """
    
    def __init__(self, storage=None):
        self._policies: Dict[str, Policy] = {}
        self._storage = storage  # Cloudflare D1 adapter
        self._cache: Dict[str, Policy] = {}
    
    async def create_policy(
        self,
        name: str,
        permissions: List[Permission],
        created_by: str,
        **kwargs,
    ) -> Policy:
        """Create a new policy"""
        policy_id = f"pol_{hashlib.sha256(f'{name}:{time.time()}'.encode()).hexdigest()[:12]}"
        
        policy = Policy(
            policy_id=policy_id,
            name=name,
            permissions=permissions,
            created_by=created_by,
            **kwargs,
        )
        
        self._policies[policy_id] = policy
        
        # Persist to storage
        if self._storage:
            await self._storage.save_policy(policy)
        
        logger.info(f"Created policy: {policy_id} ({name})")
        return policy
    
    async def get_policy(self, policy_id: str) -> Optional[Policy]:
        """Get a policy by ID"""
        # Check cache first
        if policy_id in self._policies:
            return self._policies[policy_id]
        
        # Try storage
        if self._storage:
            policy = await self._storage.get_policy(policy_id)
            if policy:
                self._policies[policy_id] = policy
                return policy
        
        return None
    
    async def list_policies(self) -> List[Policy]:
        """List all policies"""
        return list(self._policies.values())
    
    async def update_policy(self, policy_id: str, updates: Dict[str, Any]) -> Optional[Policy]:
        """Update a policy"""
        policy = await self.get_policy(policy_id)
        if not policy:
            return None
        
        for key, value in updates.items():
            if hasattr(policy, key):
                setattr(policy, key, value)
        
        policy.updated_at = time.time()
        
        if self._storage:
            await self._storage.save_policy(policy)
        
        return policy
    
    async def delete_policy(self, policy_id: str) -> bool:
        """Delete a policy"""
        if policy_id in self._policies:
            del self._policies[policy_id]
            
            if self._storage:
                await self._storage.delete_policy(policy_id)
            
            logger.info(f"Deleted policy: {policy_id}")
            return True
        
        return False
    
    async def check_access(
        self,
        policy_id: str,
        resource_type: ResourceType,
        resource_id: Optional[str],
        required_level: PermissionLevel,
        context: Dict[str, Any] = None,
    ) -> tuple[bool, str]:
        """
        Check if a policy allows access to a resource.
        
        Returns: (allowed: bool, reason: str)
        """
        context = context or {}
        
        policy = await self.get_policy(policy_id)
        if not policy:
            return False, "Policy not found"
        
        if not policy.is_active:
            return False, "Policy is inactive"
        
        # Check time restrictions
        if not policy.restrictions.is_valid_time():
            return False, "Outside valid time window"
        
        # Check IP restrictions
        client_ip = context.get("ip", "")
        if client_ip and not policy.restrictions.is_valid_ip(client_ip):
            return False, "IP not allowed"
        
        # Check permission level
        level = policy.get_permission_level(resource_type, resource_id)
        if level.value < required_level.value:
            return False, f"Insufficient permission: {level.name} < {required_level.name}"
        
        return True, "Access granted"
    
    async def check_operator_access(
        self,
        policy_id: str,
        operator_id: str,
        context: Dict[str, Any] = None,
    ) -> tuple[bool, str]:
        """Check if a policy allows invoking an operator"""
        policy = await self.get_policy(policy_id)
        if not policy:
            return False, "Policy not found"
        
        if not policy.can_access_operator(operator_id):
            return False, f"Operator {operator_id} not allowed by policy"
        
        return await self.check_access(
            policy_id,
            ResourceType.OPERATOR,
            operator_id,
            PermissionLevel.EXECUTE,
            context,
        )
    
    async def check_endpoint_access(
        self,
        policy_id: str,
        endpoint: str,
        method: str,
        context: Dict[str, Any] = None,
    ) -> tuple[bool, str]:
        """Check if a policy allows accessing an endpoint"""
        policy = await self.get_policy(policy_id)
        if not policy:
            return False, "Policy not found"
        
        if not policy.can_access_endpoint(endpoint):
            return False, f"Endpoint {endpoint} not allowed by policy"
        
        # Map HTTP methods to permission levels
        method_levels = {
            "GET": PermissionLevel.READ,
            "HEAD": PermissionLevel.READ,
            "POST": PermissionLevel.EXECUTE,
            "PUT": PermissionLevel.WRITE,
            "PATCH": PermissionLevel.WRITE,
            "DELETE": PermissionLevel.ADMIN,
        }
        
        required_level = method_levels.get(method.upper(), PermissionLevel.READ)
        
        return await self.check_access(
            policy_id,
            ResourceType.SYSTEM,
            endpoint,
            required_level,
            context,
        )


# Default policies
def create_default_policies() -> Dict[str, Policy]:
    """Create the default set of policies"""
    return {
        "master": Policy(
            policy_id="pol_master",
            name="Master",
            description="Full access to everything. For creator only.",
            permissions=[
                Permission(ResourceType.OPERATOR, None, PermissionLevel.MASTER),
                Permission(ResourceType.SLOT, None, PermissionLevel.MASTER),
                Permission(ResourceType.NETWORK, None, PermissionLevel.MASTER),
                Permission(ResourceType.KEY, None, PermissionLevel.MASTER),
                Permission(ResourceType.POLICY, None, PermissionLevel.MASTER),
                Permission(ResourceType.USER, None, PermissionLevel.MASTER),
                Permission(ResourceType.AUDIT, None, PermissionLevel.MASTER),
                Permission(ResourceType.SYSTEM, None, PermissionLevel.MASTER),
            ],
            rate_limits=RateLimit(
                requests_per_minute=1000,
                requests_per_hour=50000,
                requests_per_day=1000000,
                max_concurrent=100,
            ),
            created_by="system",
        ),
        "admin": Policy(
            policy_id="pol_admin",
            name="Admin",
            description="Administrative access. Can manage keys and view audit.",
            permissions=[
                Permission(ResourceType.OPERATOR, None, PermissionLevel.ADMIN),
                Permission(ResourceType.SLOT, None, PermissionLevel.ADMIN),
                Permission(ResourceType.NETWORK, None, PermissionLevel.ADMIN),
                Permission(ResourceType.KEY, None, PermissionLevel.WRITE),
                Permission(ResourceType.POLICY, None, PermissionLevel.READ),
                Permission(ResourceType.USER, None, PermissionLevel.WRITE),
                Permission(ResourceType.AUDIT, None, PermissionLevel.READ),
                Permission(ResourceType.SYSTEM, None, PermissionLevel.ADMIN),
            ],
            rate_limits=RateLimit(
                requests_per_minute=300,
                requests_per_hour=10000,
                requests_per_day=100000,
                max_concurrent=50,
            ),
            created_by="system",
        ),
        "user": Policy(
            policy_id="pol_user",
            name="User",
            description="Standard user access. Can invoke operators and view status.",
            permissions=[
                Permission(ResourceType.OPERATOR, None, PermissionLevel.EXECUTE),
                Permission(ResourceType.SLOT, None, PermissionLevel.READ),
                Permission(ResourceType.NETWORK, None, PermissionLevel.READ),
                Permission(ResourceType.SYSTEM, None, PermissionLevel.READ),
            ],
            rate_limits=RateLimit(
                requests_per_minute=60,
                requests_per_hour=1000,
                requests_per_day=10000,
                max_concurrent=10,
            ),
            created_by="system",
        ),
        "readonly": Policy(
            policy_id="pol_readonly",
            name="Read Only",
            description="Read-only access. Can view but not modify.",
            permissions=[
                Permission(ResourceType.OPERATOR, None, PermissionLevel.READ),
                Permission(ResourceType.SLOT, None, PermissionLevel.READ),
                Permission(ResourceType.NETWORK, None, PermissionLevel.READ),
                Permission(ResourceType.SYSTEM, None, PermissionLevel.READ),
            ],
            rate_limits=RateLimit(
                requests_per_minute=30,
                requests_per_hour=500,
                requests_per_day=5000,
                max_concurrent=5,
            ),
            created_by="system",
        ),
    }


# Backward-compatible constant export
DEFAULT_POLICIES: Dict[str, Policy] = create_default_policies()


# Global policy engine
_engine: Optional[PolicyEngine] = None


def get_policy_engine() -> PolicyEngine:
    """Get or create global policy engine"""
    global _engine
    if _engine is None:
        _engine = PolicyEngine()
        # Load default policies
        for policy in DEFAULT_POLICIES.values():
            _engine._policies[policy.policy_id] = policy
    return _engine
