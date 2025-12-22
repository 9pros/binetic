"""
Binetic Core - Entry Point for Cloudflare Workers

This is the main entry point for the Cloudflare Worker deployment.
"""

import json
from .infra.cloudflare import CloudflareEnv, handle_request as cf_handle_request
from .api.routes import router, Request as InternalRequest, Response, HttpMethod
from .api.middleware import create_middleware_stack


# Version info
__version__ = "1.0.0"
__name__ = "binetic-core"


async def initialize(env=None):
    """
    Initialize Binetic systems.
    
    Call this once when the Worker starts or for local development.
    """
    from .core.brain import get_brain
    from .security.policies import get_policy_engine, DEFAULT_POLICIES
    
    # Initialize policy engine with defaults
    policy_engine = get_policy_engine()
    for policy in DEFAULT_POLICIES.values():
        policy_engine.register_policy(policy)
    
    # Initialize brain
    brain = await get_brain()
    
    return {
        "status": "initialized",
        "brain_state": brain.state.value,
        "policies_loaded": len(policy_engine._policies),
    }


async def handle_request(request, env=None):
    """
    Main request handler.
    
    Converts incoming requests to internal format and routes them.
    Compatible with Cloudflare Workers.
    """
    # Setup environment
    if env:
        cf_env = CloudflareEnv.from_worker_env(env)
    else:
        cf_env = CloudflareEnv.local()
    
    # Initialize middleware
    middleware_stack = create_middleware_stack(
        allowed_origins=["*"],  # Configure for production
        requests_per_minute=60,
        public_paths=["/api/health", "/api/auth/login"],
    )
    
    for mw in middleware_stack:
        router.use(mw)
    
    # Parse request
    try:
        if hasattr(request, "method"):
            # Cloudflare request object
            method = HttpMethod(request.method.upper())
            path = str(request.url).split("?")[0]
            if "://" in path:
                path = "/" + path.split("/", 3)[-1] if path.count("/") > 2 else "/"
            
            headers = dict(request.headers) if hasattr(request, "headers") else {}
            
            body = None
            if method in (HttpMethod.POST, HttpMethod.PUT, HttpMethod.PATCH):
                try:
                    body = await request.json()
                except:
                    body = {}
            
            internal_request = InternalRequest(
                method=method,
                path=path,
                headers=headers,
                query={},
                body=body,
            )
        else:
            # Dict-like request (testing)
            internal_request = InternalRequest(
                method=HttpMethod(request.get("method", "GET").upper()),
                path=request.get("path", "/"),
                headers=request.get("headers", {}),
                query=request.get("query", {}),
                body=request.get("body"),
            )
    except Exception as e:
        return Response(
            status=400,
            body={"error": "Invalid request", "details": str(e)},
        )
    
    # Route request
    response = await router.handle(internal_request)
    
    # Format response for Cloudflare
    return {
        "status": response.status,
        "headers": {
            **response.headers,
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Authorization, Content-Type, X-API-Key",
            # Transport/security headers (effective only over HTTPS)
            "Strict-Transport-Security": "max-age=15552000; includeSubDomains; preload",
            "X-Content-Type-Options": "nosniff",
            "Referrer-Policy": "no-referrer",
        },
        "body": json.dumps(response.body) if response.body else "",
    }


# Cloudflare Worker export
async def fetch(request, env, ctx):
    """
    Cloudflare Worker fetch handler.
    
    This is the main entry point for Cloudflare Workers.
    """
    try:
        result = await handle_request(request, env)
        
        return Response(
            body=result["body"],
            status=result["status"],
            headers=result["headers"],
        )
    except Exception as e:
        return Response(
            body=json.dumps({"error": "Internal server error", "message": str(e)}),
            status=500,
            headers={"Content-Type": "application/json"},
        )


# Export for different deployment targets
__all__ = [
    "__version__",
    "initialize",
    "handle_request",
    "fetch",
    "router",
]
