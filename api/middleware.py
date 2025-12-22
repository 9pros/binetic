"""
API Middleware - Request processing pipeline

Handles authentication, rate limiting, CORS, and request validation.
"""

from typing import Callable, Dict, List, Optional, Any
import time
import logging
import json

from .routes import Request, Response, HttpMethod

logger = logging.getLogger(__name__)


class CORSMiddleware:
    """Handle CORS for browser requests"""
    
    def __init__(
        self,
        allowed_origins: List[str] = None,
        allowed_methods: List[str] = None,
        allowed_headers: List[str] = None,
        max_age: int = 86400,
    ):
        self.allowed_origins = allowed_origins or ["*"]
        self.allowed_methods = allowed_methods or ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
        self.allowed_headers = allowed_headers or [
            "Authorization",
            "Content-Type",
            "X-API-Key",
            "X-Request-ID",
        ]
        self.max_age = max_age
    
    async def __call__(self, request: Request) -> Optional[Response]:
        """Process CORS headers"""
        origin = request.headers.get("Origin", "*")
        
        # Check if origin is allowed
        if self.allowed_origins != ["*"]:
            if origin not in self.allowed_origins:
                return Response(
                    status=403,
                    body={"error": "Origin not allowed"},
                )
        
        # Handle preflight
        if request.method == HttpMethod.OPTIONS:
            return Response(
                status=204,
                headers={
                    "Access-Control-Allow-Origin": origin,
                    "Access-Control-Allow-Methods": ", ".join(self.allowed_methods),
                    "Access-Control-Allow-Headers": ", ".join(self.allowed_headers),
                    "Access-Control-Max-Age": str(self.max_age),
                },
            )
        
        # Continue processing - CORS headers added to response elsewhere
        return None


class AuthMiddleware:
    """Handle authentication"""
    
    def __init__(self, public_paths: List[str] = None):
        self.public_paths = public_paths or [
            "/api/health",
            "/api/auth/login",
        ]
    
    async def __call__(self, request: Request) -> Optional[Response]:
        """Authenticate request"""
        # Skip auth for public paths
        for path in self.public_paths:
            if request.path.startswith(path):
                return None
        
        # Extract token
        auth_header = request.headers.get("Authorization", "")
        api_key_header = request.headers.get("X-API-Key", "")
        
        token = None
        api_key = None
        
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
        
        if api_key_header:
            api_key = api_key_header
        
        # Require some form of auth
        if not token and not api_key:
            return Response(
                status=401,
                body={"error": "Authentication required"},
            )
        
        # Authenticate
        from ..security.auth import get_auth_gateway
        gateway = get_auth_gateway()
        
        if token:
            context = await gateway.authenticate_token(token)
        else:
            context = await gateway.authenticate(api_key)
        
        if not context.is_authenticated:
            return Response(
                status=401,
                body={"error": "Invalid credentials"},
            )
        
        # Attach context to request
        request.auth_context = context
        
        return None


class RateLimitMiddleware:
    """Handle rate limiting"""
    
    def __init__(self, requests_per_minute: int = 60):
        self.requests_per_minute = requests_per_minute
        self._request_counts: Dict[str, List[float]] = {}
    
    async def __call__(self, request: Request) -> Optional[Response]:
        """Check rate limits"""
        # Get identifier
        if request.auth_context:
            identifier = request.auth_context.key_id
        else:
            identifier = request.headers.get("CF-Connecting-IP", "unknown")
        
        now = time.time()
        minute_ago = now - 60
        
        # Clean old entries
        if identifier in self._request_counts:
            self._request_counts[identifier] = [
                t for t in self._request_counts[identifier]
                if t > minute_ago
            ]
        else:
            self._request_counts[identifier] = []
        
        # Check limit
        if len(self._request_counts[identifier]) >= self.requests_per_minute:
            return Response(
                status=429,
                body={"error": "Rate limit exceeded"},
                headers={
                    "Content-Type": "application/json",
                    "Retry-After": "60",
                },
            )
        
        # Record request
        self._request_counts[identifier].append(now)
        
        return None


class RequestValidationMiddleware:
    """Validate request structure"""
    
    async def __call__(self, request: Request) -> Optional[Response]:
        """Validate request"""
        # Ensure body is parsed for POST/PUT/PATCH
        if request.method in (HttpMethod.POST, HttpMethod.PUT, HttpMethod.PATCH):
            content_type = request.headers.get("Content-Type", "")
            
            if "application/json" in content_type:
                if request.body and isinstance(request.body, str):
                    try:
                        request.body = json.loads(request.body)
                    except json.JSONDecodeError:
                        return Response(
                            status=400,
                            body={"error": "Invalid JSON body"},
                        )
        
        return None


class LoggingMiddleware:
    """Log requests"""
    
    async def __call__(self, request: Request) -> Optional[Response]:
        """Log request"""
        logger.info(
            f"{request.method.value} {request.path} "
            f"user={getattr(request.auth_context, 'owner_id', 'anonymous')}"
        )
        return None


class RequestIDMiddleware:
    """Add request ID for tracing"""
    
    async def __call__(self, request: Request) -> Optional[Response]:
        """Add request ID"""
        request_id = request.headers.get("X-Request-ID")
        if not request_id:
            import uuid
            request_id = str(uuid.uuid4())
        
        request.headers["X-Request-ID"] = request_id
        return None


def create_middleware_stack(
    allowed_origins: List[str] = None,
    requests_per_minute: int = 60,
    public_paths: List[str] = None,
) -> List[Callable]:
    """Create standard middleware stack"""
    return [
        RequestIDMiddleware(),
        LoggingMiddleware(),
        CORSMiddleware(allowed_origins=allowed_origins),
        RateLimitMiddleware(requests_per_minute=requests_per_minute),
        RequestValidationMiddleware(),
        AuthMiddleware(public_paths=public_paths),
    ]
