
import uvicorn
import json
from api.routes import router
from api.middleware import create_middleware_stack
from core.brain import get_brain
import asyncio

# Create a simple ASGI app wrapper around the router
async def app(scope, receive, send):
    if scope['type'] != 'http':
        return

    # Log incoming request
    print(f"Request: {scope['method']} {scope['path']}")

    # Handle CORS Preflight (OPTIONS)
    if scope['method'] == 'OPTIONS':
        print("Handling OPTIONS preflight")
        await send({
            'type': 'http.response.start',
            'status': 204,
            'headers': [
                (b'access-control-allow-origin', b'*'),
                (b'access-control-allow-methods', b'GET, POST, PUT, DELETE, OPTIONS'),
                (b'access-control-allow-headers', b'Content-Type, Authorization, X-API-Key'),
            ],
        })
        await send({'type': 'http.response.body', 'body': b''})
        return

    # Create request object
    from api.routes import Request, HttpMethod, Response
    
    path = scope['path']
    method = HttpMethod(scope['method'])
    headers = {k.decode(): v.decode() for k, v in scope['headers']}
    query_string = scope['query_string'].decode()
    query = {}
    if query_string:
        for q in query_string.split('&'):
            if '=' in q:
                k, v = q.split('=', 1)
                query[k] = v
    
    # Read body
    body = b''
    more_body = True
    while more_body:
        message = await receive()
        body += message.get('body', b'')
        more_body = message.get('more_body', False)
    
    json_body = None
    if body:
        try:
            json_body = json.loads(body)
        except:
            pass

    # Mock auth context for local dev
    from security.auth import AuthContext
    from security.keys import APIKey, KeyScope, KeyStatus
    from security.policies import get_policy_engine, Policy, Permission, PermissionLevel, ResourceType
    
    # Ensure master policy exists
    pe = get_policy_engine()
    if "pol_master" not in pe._policies:
        pe.register_policy(Policy(
            policy_id="pol_master",
            name="Master Policy",
            permissions=[
                Permission(ResourceType.SYSTEM, None, PermissionLevel.MASTER),
                Permission(ResourceType.OPERATOR, None, PermissionLevel.MASTER),
                Permission(ResourceType.NETWORK, None, PermissionLevel.MASTER),
                Permission(ResourceType.USER, None, PermissionLevel.MASTER),
                Permission(ResourceType.AUDIT, None, PermissionLevel.MASTER),
            ]
        ))

    dummy_key = APIKey(
        key_id="key_local",
        key_hash="hash",
        key_prefix="bnk_mast",
        scope=KeyScope.MASTER,
        policy_id="pol_master",
        owner_id="user_local",
        status=KeyStatus.ACTIVE,
        created_at=0.0
    )
    
    auth_context = AuthContext(
        authenticated=True,
        key=dummy_key,
        owner_id="user_local",
        policy_id="pol_master"
    )

    request = Request(
        method=method,
        path=path,
        headers=headers,
        query=query,
        body=json_body,
        auth_context=auth_context
    )

    # Handle request
    try:
        # Initialize brain if needed
        await get_brain()
        
        # Register default sources if not already registered
        from core.discovery import get_discovery_engine, DiscoverySource, DiscoveryMethod
        engine = get_discovery_engine()
        if not engine._sources:
            print("Registering default discovery sources...")
            engine.register_source(DiscoverySource(
                source_id="src_internet",
                name="Global Internet Search",
                base_url="https://api.search.mock",
                discovery_method=DiscoveryMethod.MANIFEST
            ))
            engine.register_source(DiscoverySource(
                source_id="src_local_fs",
                name="Local Filesystem",
                base_url="file://local",
                discovery_method=DiscoveryMethod.MANIFEST
            ))
            engine.register_source(DiscoverySource(
                source_id="src_self",
                name="Self Loopback",
                base_url="http://localhost:8000/api",
                discovery_method=DiscoveryMethod.PROBE
            ))
        
        response = await router.handle(request)
    except Exception as e:
        import traceback
        traceback.print_exc()
        response = Response(status=500, body={"error": str(e)})

    # Send response
    await send({
        'type': 'http.response.start',
        'status': response.status,
        'headers': [
            (b'content-type', b'application/json'),
            (b'access-control-allow-origin', b'*'),
        ],
    })
    
    # Wrap in ApiResponse envelope
    if 200 <= response.status < 300:
        final_body = {"success": True, "data": response.body}
    else:
        error_msg = response.body.get("error") if isinstance(response.body, dict) else str(response.body)
        final_body = {"success": False, "error": error_msg}
        
    response_body = json.dumps(final_body).encode()
    
    await send({
        'type': 'http.response.body',
        'body': response_body,
    })

if __name__ == "__main__":
    print("Starting Binetic Python Core on http://0.0.0.0:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000)
