"""
API Key Management - Secure Key Provisioning

Creator-controlled key provisioning system:
1. Master key (you) creates policies
2. Keys are generated with specific policies
3. Each key inherits permissions from its policy
4. Keys can be rotated, revoked, rate-limited
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional
import time
import secrets
import hashlib
import hmac
import base64
import logging

from .policies import Policy, PolicyEngine, get_policy_engine

logger = logging.getLogger(__name__)


class KeyScope(Enum):
    """Scope of an API key"""
    MASTER = "master"     # Full access (creator only)
    ADMIN = "admin"       # Administrative access
    USER = "user"         # Standard user access
    SERVICE = "service"   # Machine-to-machine
    READONLY = "readonly" # Read-only access
    CUSTOM = "custom"     # Custom policy


class KeyStatus(Enum):
    """Status of an API key"""
    ACTIVE = "active"
    SUSPENDED = "suspended"
    REVOKED = "revoked"
    EXPIRED = "expired"


@dataclass
class APIKey:
    """
    An API key with associated policy and metadata.
    
    Key format: fgk_{scope}_{random}
    Example: fgk_user_a1b2c3d4e5f6g7h8
    """
    key_id: str
    key_hash: str  # SHA-256 hash of actual key (we don't store raw key)
    key_prefix: str  # First 8 chars for identification
    
    # Owner
    owner_id: str
    owner_email: Optional[str] = None
    
    # Policy
    policy_id: str = "pol_user"
    scope: KeyScope = KeyScope.USER
    
    # Status
    status: KeyStatus = KeyStatus.ACTIVE
    
    # Usage tracking
    created_at: float = field(default_factory=time.time)
    expires_at: Optional[float] = None
    last_used_at: Optional[float] = None
    use_count: int = 0
    
    # Rate limit state (per-key override)
    rate_limit_override: Optional[Dict[str, int]] = None
    
    # Metadata
    name: str = ""
    description: str = ""
    
    def to_dict(self, include_hash: bool = False) -> Dict:
        data = {
            "key_id": self.key_id,
            "key_prefix": self.key_prefix,
            "owner_id": self.owner_id,
            "owner_email": self.owner_email,
            "policy_id": self.policy_id,
            "scope": self.scope.value,
            "status": self.status.value,
            "created_at": self.created_at,
            "expires_at": self.expires_at,
            "last_used_at": self.last_used_at,
            "use_count": self.use_count,
            "name": self.name,
            "description": self.description,
        }
        if include_hash:
            data["key_hash"] = self.key_hash
        return data
    
    @classmethod
    def from_dict(cls, data: Dict) -> "APIKey":
        return cls(
            key_id=data["key_id"],
            key_hash=data["key_hash"],
            key_prefix=data["key_prefix"],
            owner_id=data["owner_id"],
            owner_email=data.get("owner_email"),
            policy_id=data.get("policy_id", "pol_user"),
            scope=KeyScope(data.get("scope", "user")),
            status=KeyStatus(data.get("status", "active")),
            created_at=data.get("created_at", time.time()),
            expires_at=data.get("expires_at"),
            last_used_at=data.get("last_used_at"),
            use_count=data.get("use_count", 0),
            rate_limit_override=data.get("rate_limit_override"),
            name=data.get("name", ""),
            description=data.get("description", ""),
        )
    
    def is_valid(self) -> tuple[bool, str]:
        """Check if key is valid for use"""
        if self.status == KeyStatus.REVOKED:
            return False, "Key has been revoked"
        if self.status == KeyStatus.SUSPENDED:
            return False, "Key is suspended"
        if self.status == KeyStatus.EXPIRED:
            return False, "Key has expired"
        if self.expires_at and time.time() > self.expires_at:
            return False, "Key has expired"
        return True, "OK"
    
    def verify(self, raw_key: str) -> bool:
        """Verify a raw key against this key's hash"""
        computed_hash = hashlib.sha256(raw_key.encode()).hexdigest()
        return hmac.compare_digest(computed_hash, self.key_hash)


class KeyManager:
    """
    Manages API key lifecycle.
    
    The creator (master key holder) uses this to:
    1. Create keys for users with specific policies
    2. Rotate keys periodically
    3. Revoke compromised keys
    4. Monitor key usage
    """
    
    def __init__(self, storage=None, policy_engine: Optional[PolicyEngine] = None):
        self._keys: Dict[str, APIKey] = {}
        self._keys_by_hash: Dict[str, str] = {}  # hash -> key_id
        self._storage = storage  # Cloudflare KV adapter
        self._policy_engine = policy_engine or get_policy_engine()
    
    def generate_key(self, scope: KeyScope = KeyScope.USER) -> str:
        """Generate a new random API key"""
        random_part = secrets.token_urlsafe(24)
        return f"fgk_{scope.value}_{random_part}"
    
    async def create_key(
        self,
        owner_id: str,
        policy_id: str = "pol_user",
        scope: KeyScope = KeyScope.USER,
        owner_email: Optional[str] = None,
        expires_in_days: Optional[int] = None,
        name: str = "",
        description: str = "",
    ) -> tuple[APIKey, str]:
        """
        Create a new API key.
        
        Returns: (APIKey object, raw key string)
        
        IMPORTANT: The raw key is only returned once. Store it securely.
        """
        # Validate policy exists
        policy = await self._policy_engine.get_policy(policy_id)
        if not policy:
            raise ValueError(f"Policy not found: {policy_id}")
        
        # Generate key
        raw_key = self.generate_key(scope)
        key_hash = hashlib.sha256(raw_key.encode()).hexdigest()
        key_prefix = raw_key[:16]
        key_id = f"key_{secrets.token_hex(8)}"
        
        # Calculate expiration
        expires_at = None
        if expires_in_days:
            expires_at = time.time() + (expires_in_days * 86400)
        
        api_key = APIKey(
            key_id=key_id,
            key_hash=key_hash,
            key_prefix=key_prefix,
            owner_id=owner_id,
            owner_email=owner_email,
            policy_id=policy_id,
            scope=scope,
            expires_at=expires_at,
            name=name,
            description=description,
        )
        
        self._keys[key_id] = api_key
        self._keys_by_hash[key_hash] = key_id
        
        # Persist to storage
        if self._storage:
            await self._storage.save_key(api_key)
        
        logger.info(f"Created API key: {key_id} ({scope.value}) for {owner_id}")
        
        return api_key, raw_key
    
    async def verify_key(self, raw_key: str) -> tuple[Optional[APIKey], str]:
        """
        Verify an API key and return its metadata.
        
        Returns: (APIKey or None, error message)
        """
        if not raw_key or not raw_key.startswith("fgk_"):
            return None, "Invalid key format"
        
        key_hash = hashlib.sha256(raw_key.encode()).hexdigest()
        
        # Check cache
        if key_hash in self._keys_by_hash:
            key_id = self._keys_by_hash[key_hash]
            api_key = self._keys.get(key_id)
            if api_key:
                valid, reason = api_key.is_valid()
                if not valid:
                    return None, reason
                return api_key, "OK"
        
        # Check storage
        if self._storage:
            api_key = await self._storage.get_key_by_hash(key_hash)
            if api_key:
                self._keys[api_key.key_id] = api_key
                self._keys_by_hash[key_hash] = api_key.key_id
                
                valid, reason = api_key.is_valid()
                if not valid:
                    return None, reason
                return api_key, "OK"
        
        return None, "Key not found"
    
    async def get_key(self, key_id: str) -> Optional[APIKey]:
        """Get an API key by ID"""
        if key_id in self._keys:
            return self._keys[key_id]
        
        if self._storage:
            api_key = await self._storage.get_key(key_id)
            if api_key:
                self._keys[key_id] = api_key
                self._keys_by_hash[api_key.key_hash] = key_id
                return api_key
        
        return None
    
    async def list_keys(
        self,
        owner_id: Optional[str] = None,
        scope: Optional[KeyScope] = None,
        status: Optional[KeyStatus] = None,
    ) -> List[APIKey]:
        """List API keys with optional filters"""
        keys = list(self._keys.values())
        
        if owner_id:
            keys = [k for k in keys if k.owner_id == owner_id]
        if scope:
            keys = [k for k in keys if k.scope == scope]
        if status:
            keys = [k for k in keys if k.status == status]
        
        return keys
    
    async def rotate_key(self, key_id: str) -> tuple[Optional[APIKey], Optional[str]]:
        """
        Rotate an API key, returning a new key with same policy.
        
        The old key is revoked.
        """
        old_key = await self.get_key(key_id)
        if not old_key:
            return None, None
        
        # Create new key with same settings
        new_key, raw_key = await self.create_key(
            owner_id=old_key.owner_id,
            policy_id=old_key.policy_id,
            scope=old_key.scope,
            owner_email=old_key.owner_email,
            name=f"{old_key.name} (rotated)",
            description=old_key.description,
        )
        
        # Revoke old key
        await self.revoke_key(key_id)
        
        logger.info(f"Rotated key {key_id} -> {new_key.key_id}")
        
        return new_key, raw_key
    
    async def revoke_key(self, key_id: str) -> bool:
        """Revoke an API key"""
        api_key = await self.get_key(key_id)
        if not api_key:
            return False
        
        api_key.status = KeyStatus.REVOKED
        
        # Remove from hash lookup (but keep in keys for audit)
        if api_key.key_hash in self._keys_by_hash:
            del self._keys_by_hash[api_key.key_hash]
        
        if self._storage:
            await self._storage.save_key(api_key)
        
        logger.info(f"Revoked key: {key_id}")
        return True
    
    async def suspend_key(self, key_id: str) -> bool:
        """Suspend an API key (can be reactivated)"""
        api_key = await self.get_key(key_id)
        if not api_key:
            return False
        
        api_key.status = KeyStatus.SUSPENDED
        
        if self._storage:
            await self._storage.save_key(api_key)
        
        logger.info(f"Suspended key: {key_id}")
        return True
    
    async def reactivate_key(self, key_id: str) -> bool:
        """Reactivate a suspended key"""
        api_key = await self.get_key(key_id)
        if not api_key:
            return False
        
        if api_key.status == KeyStatus.REVOKED:
            return False  # Cannot reactivate revoked keys
        
        api_key.status = KeyStatus.ACTIVE
        
        if self._storage:
            await self._storage.save_key(api_key)
        
        logger.info(f"Reactivated key: {key_id}")
        return True
    
    async def record_usage(self, key_id: str) -> None:
        """Record that a key was used"""
        api_key = await self.get_key(key_id)
        if api_key:
            api_key.last_used_at = time.time()
            api_key.use_count += 1
            
            if self._storage:
                await self._storage.save_key(api_key)
    
    async def update_policy(self, key_id: str, policy_id: str) -> bool:
        """Update the policy assigned to a key"""
        api_key = await self.get_key(key_id)
        if not api_key:
            return False
        
        policy = await self._policy_engine.get_policy(policy_id)
        if not policy:
            return False
        
        api_key.policy_id = policy_id
        
        if self._storage:
            await self._storage.save_key(api_key)
        
        logger.info(f"Updated key {key_id} to policy {policy_id}")
        return True


# Global key manager
_manager: Optional[KeyManager] = None


def get_key_manager() -> KeyManager:
    """Get or create global key manager"""
    global _manager
    if _manager is None:
        _manager = KeyManager()
    return _manager
