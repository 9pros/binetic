"""
Authentication Gateway - Secure Entry Point

All requests must pass through this gateway.
Handles:
- API key validation
- Session management
- Token generation
- Request context building
"""

from dataclasses import dataclass, field
from typing import Any, Dict, Optional, Callable, Awaitable
from functools import wraps
import time
import hashlib
import secrets
import jwt
import logging

from .keys import KeyManager, APIKey, get_key_manager
from .policies import PolicyEngine, get_policy_engine, PermissionLevel, ResourceType

logger = logging.getLogger(__name__)


# JWT configuration (override with secrets in production)
JWT_SECRET = "CHANGE_THIS_IN_PRODUCTION"
JWT_ALGORITHM = "HS256"
JWT_EXPIRY = 3600  # 1 hour


@dataclass
class AuthToken:
    """An authentication token for a session"""
    token_id: str
    key_id: str
    owner_id: str
    policy_id: str
    issued_at: float
    expires_at: float
    scope: str
    
    def to_dict(self) -> Dict:
        return {
            "token_id": self.token_id,
            "key_id": self.key_id,
            "owner_id": self.owner_id,
            "policy_id": self.policy_id,
            "iat": self.issued_at,
            "exp": self.expires_at,
            "scope": self.scope,
        }
    
    @classmethod
    def from_dict(cls, data: Dict) -> "AuthToken":
        return cls(
            token_id=data["token_id"],
            key_id=data["key_id"],
            owner_id=data["owner_id"],
            policy_id=data["policy_id"],
            issued_at=data["iat"],
            expires_at=data["exp"],
            scope=data["scope"],
        )
    
    def is_expired(self) -> bool:
        return time.time() > self.expires_at
    
    def encode(self, secret: str = JWT_SECRET) -> str:
        """Encode token to JWT string"""
        return jwt.encode(self.to_dict(), secret, algorithm=JWT_ALGORITHM)
    
    @classmethod
    def decode(cls, token_str: str, secret: str = JWT_SECRET) -> Optional["AuthToken"]:
        """Decode JWT string to token"""
        try:
            data = jwt.decode(token_str, secret, algorithms=[JWT_ALGORITHM])
            return cls.from_dict(data)
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None


@dataclass
class AuthContext:
    """Context for an authenticated request"""
    authenticated: bool = False
    key: Optional[APIKey] = None
    token: Optional[AuthToken] = None
    policy_id: Optional[str] = None
    owner_id: Optional[str] = None
    error: Optional[str] = None
    
    # Request context
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    request_id: Optional[str] = None
    
    def to_dict(self) -> Dict:
        return {
            "authenticated": self.authenticated,
            "key_id": self.key.key_id if self.key else None,
            "policy_id": self.policy_id,
            "owner_id": self.owner_id,
            "error": self.error,
        }


class AuthGateway:
    """
    Authentication Gateway - All requests pass through here.
    """
    
    def __init__(
        self,
        key_manager: Optional[KeyManager] = None,
        policy_engine: Optional[PolicyEngine] = None,
        jwt_secret: str = JWT_SECRET,
    ):
        self.key_manager = key_manager or get_key_manager()
        self.policy_engine = policy_engine or get_policy_engine()
        self.jwt_secret = jwt_secret
        
        # Rate limit tracking
        self._rate_limits: Dict[str, Dict] = {}
    
    async def authenticate(
        self,
        api_key: Optional[str] = None,
        bearer_token: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> AuthContext:
        """
        Authenticate a request.
        
        Accepts either:
        - API key (X-API-Key header)
        - Bearer token (Authorization: Bearer ...)
        """
        context = AuthContext(
            ip_address=ip_address,
            user_agent=user_agent,
            request_id=secrets.token_hex(8),
        )
        
        # Try API key first
        if api_key:
            key, error = await self.key_manager.verify_key(api_key)
            if key:
                context.authenticated = True
                context.key = key
                context.policy_id = key.policy_id
                context.owner_id = key.owner_id
                
                # Record usage
                await self.key_manager.record_usage(key.key_id)
                
                return context
            else:
                context.error = error
                return context
        
        # Try bearer token
        if bearer_token:
            token = AuthToken.decode(bearer_token, self.jwt_secret)
            if token:
                if token.is_expired():
                    context.error = "Token expired"
                    return context
                
                context.authenticated = True
                context.token = token
                context.policy_id = token.policy_id
                context.owner_id = token.owner_id
                
                # Get the associated key
                key = await self.key_manager.get_key(token.key_id)
                if key:
                    context.key = key
                
                return context
            else:
                context.error = "Invalid token"
                return context
        
        context.error = "No authentication provided"
        return context
    
    async def create_token(self, api_key: str, expiry: int = JWT_EXPIRY) -> Optional[AuthToken]:
        """
        Create a session token from an API key.
        
        Tokens are short-lived and can be refreshed.
        """
        key, error = await self.key_manager.verify_key(api_key)
        if not key:
            return None
        
        now = time.time()
        
        token = AuthToken(
            token_id=secrets.token_hex(16),
            key_id=key.key_id,
            owner_id=key.owner_id,
            policy_id=key.policy_id,
            issued_at=now,
            expires_at=now + expiry,
            scope=key.scope.value,
        )
        
        return token
    
    async def refresh_token(self, token_str: str) -> Optional[AuthToken]:
        """Refresh an existing token"""
        old_token = AuthToken.decode(token_str, self.jwt_secret)
        if not old_token:
            return None
        
        # Check if key is still valid
        key = await self.key_manager.get_key(old_token.key_id)
        if not key:
            return None
        
        valid, _ = key.is_valid()
        if not valid:
            return None
        
        # Create new token
        now = time.time()
        
        new_token = AuthToken(
            token_id=secrets.token_hex(16),
            key_id=key.key_id,
            owner_id=key.owner_id,
            policy_id=key.policy_id,
            issued_at=now,
            expires_at=now + JWT_EXPIRY,
            scope=key.scope.value,
        )
        
        return new_token
    
    async def check_access(
        self,
        context: AuthContext,
        resource_type: ResourceType,
        resource_id: Optional[str] = None,
        required_level: PermissionLevel = PermissionLevel.READ,
    ) -> tuple[bool, str]:
        """Check if authenticated context has access to a resource"""
        if not context.authenticated:
            return False, "Not authenticated"
        
        if not context.policy_id:
            return False, "No policy assigned"
        
        return await self.policy_engine.check_access(
            context.policy_id,
            resource_type,
            resource_id,
            required_level,
            context={"ip": context.ip_address},
        )

    async def authorize(
        self,
        context: AuthContext,
        resource_type: ResourceType,
        resource_id: Optional[str] = None,
        required_level: PermissionLevel = PermissionLevel.READ,
    ) -> bool:
        """Simple authorization check returning boolean"""
        allowed, _ = await self.check_access(context, resource_type, resource_id, required_level)
        return allowed
    
    async def check_rate_limit(self, context: AuthContext) -> tuple[bool, str]:
        """Check if request is within rate limits"""
        if not context.authenticated or not context.key:
            return True, "OK"  # Unauthenticated requests handled elsewhere
        
        key_id = context.key.key_id
        policy = await self.policy_engine.get_policy(context.policy_id)
        
        if not policy:
            return False, "Policy not found"
        
        limits = policy.rate_limits
        now = time.time()
        
        if key_id not in self._rate_limits:
            self._rate_limits[key_id] = {
                "minute": {"count": 0, "start": now},
                "hour": {"count": 0, "start": now},
                "day": {"count": 0, "start": now},
            }
        
        rl = self._rate_limits[key_id]
        
        # Reset windows if needed
        if now - rl["minute"]["start"] > 60:
            rl["minute"] = {"count": 0, "start": now}
        if now - rl["hour"]["start"] > 3600:
            rl["hour"] = {"count": 0, "start": now}
        if now - rl["day"]["start"] > 86400:
            rl["day"] = {"count": 0, "start": now}
        
        # Check limits
        if rl["minute"]["count"] >= limits.requests_per_minute:
            return False, "Rate limit exceeded (per minute)"
        if rl["hour"]["count"] >= limits.requests_per_hour:
            return False, "Rate limit exceeded (per hour)"
        if rl["day"]["count"] >= limits.requests_per_day:
            return False, "Rate limit exceeded (per day)"
        
        # Increment counters
        rl["minute"]["count"] += 1
        rl["hour"]["count"] += 1
        rl["day"]["count"] += 1
        
        return True, "OK"


# Decorator for requiring authentication
def require_auth(
    resource_type: ResourceType = ResourceType.SYSTEM,
    required_level: PermissionLevel = PermissionLevel.READ,
):
    """Decorator to require authentication on a route"""
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Get auth context from kwargs or first arg
            context = kwargs.get("auth_context")
            if not context:
                raise ValueError("auth_context required")
            
            if not context.authenticated:
                raise PermissionError(f"Authentication required: {context.error}")
            
            # Check access
            gateway = get_auth_gateway()
            allowed, reason = await gateway.check_access(
                context,
                resource_type,
                required_level=required_level,
            )
            
            if not allowed:
                raise PermissionError(f"Access denied: {reason}")
            
            return await func(*args, **kwargs)
        
        return wrapper
    return decorator


def authenticate(func: Callable):
    """Simple decorator that just requires authentication (any level)"""
    @wraps(func)
    async def wrapper(*args, **kwargs):
        context = kwargs.get("auth_context")
        if not context or not context.authenticated:
            raise PermissionError("Authentication required")
        return await func(*args, **kwargs)
    return wrapper


# Global auth gateway
_gateway: Optional[AuthGateway] = None


def get_auth_gateway() -> AuthGateway:
    """Get or create global auth gateway"""
    global _gateway
    if _gateway is None:
        _gateway = AuthGateway()
    return _gateway
