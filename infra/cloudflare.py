"""
Cloudflare Infrastructure Adapters

Adapters for Cloudflare Workers, KV, D1, and R2.
"""

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional
import json
import time
import logging

logger = logging.getLogger(__name__)


# ============================================================================
# KV Storage Adapter
# ============================================================================

class KVAdapter:
    """
    Adapter for Cloudflare KV storage.
    
    In production, this wraps the Cloudflare KV binding.
    For local development, uses in-memory storage.
    """
    
    def __init__(self, namespace: str = "default", kv_binding=None):
        self.namespace = namespace
        self._binding = kv_binding
        self._local: Dict[str, tuple] = {}  # (value, expires_at)
    
    async def get(self, key: str) -> Optional[Any]:
        """Get value from KV"""
        full_key = f"{self.namespace}:{key}"
        
        if self._binding:
            # Cloudflare KV
            value = await self._binding.get(full_key, type="json")
            return value
        
        # Local fallback
        if full_key in self._local:
            value, expires_at = self._local[full_key]
            if expires_at is None or time.time() < expires_at:
                return value
            else:
                del self._local[full_key]
        
        return None
    
    async def set(
        self,
        key: str,
        value: Any,
        ttl: Optional[int] = None,
    ):
        """Set value in KV"""
        full_key = f"{self.namespace}:{key}"
        
        if self._binding:
            # Cloudflare KV
            options = {}
            if ttl:
                options["expirationTtl"] = ttl
            await self._binding.put(full_key, json.dumps(value), **options)
            return
        
        # Local fallback
        expires_at = time.time() + ttl if ttl else None
        self._local[full_key] = (value, expires_at)
    
    async def delete(self, key: str):
        """Delete from KV"""
        full_key = f"{self.namespace}:{key}"
        
        if self._binding:
            await self._binding.delete(full_key)
            return
        
        if full_key in self._local:
            del self._local[full_key]
    
    async def list(self, prefix: str = "") -> List[str]:
        """List keys with prefix"""
        full_prefix = f"{self.namespace}:{prefix}"
        
        if self._binding:
            result = await self._binding.list(prefix=full_prefix)
            return [k.name.replace(f"{self.namespace}:", "") for k in result.keys]
        
        # Local fallback
        return [
            k.replace(f"{self.namespace}:", "")
            for k in self._local.keys()
            if k.startswith(full_prefix)
        ]


# ============================================================================
# D1 Database Adapter
# ============================================================================

@dataclass
class D1Result:
    """Result from D1 query"""
    success: bool = True
    results: List[Dict] = field(default_factory=list)
    meta: Dict = field(default_factory=dict)
    error: Optional[str] = None


class D1Adapter:
    """
    Adapter for Cloudflare D1 database.
    
    In production, wraps the D1 binding.
    For local development, uses in-memory SQLite-like storage.
    """
    
    def __init__(self, d1_binding=None):
        self._binding = d1_binding
        self._local_tables: Dict[str, List[Dict]] = {}
    
    async def execute(self, sql: str, params: List[Any] = None) -> D1Result:
        """Execute SQL query"""
        params = params or []
        
        if self._binding:
            # Cloudflare D1
            try:
                stmt = self._binding.prepare(sql)
                if params:
                    stmt = stmt.bind(*params)
                result = await stmt.run()
                return D1Result(
                    success=result.success,
                    results=result.results or [],
                    meta=result.meta or {},
                )
            except Exception as e:
                return D1Result(success=False, error=str(e))
        
        # Local fallback - very basic SQL simulation
        return await self._local_execute(sql, params)
    
    async def batch(self, statements: List[tuple]) -> List[D1Result]:
        """Execute batch of SQL statements"""
        results = []
        for sql, params in statements:
            result = await self.execute(sql, params)
            results.append(result)
        return results
    
    async def _local_execute(self, sql: str, params: List[Any]) -> D1Result:
        """Local SQL simulation for development"""
        sql_lower = sql.lower().strip()
        
        try:
            if sql_lower.startswith("create table"):
                table_name = sql.split("(")[0].split()[-1].strip('"')
                if table_name not in self._local_tables:
                    self._local_tables[table_name] = []
                return D1Result(success=True)
            
            elif sql_lower.startswith("insert"):
                # Basic INSERT handling
                table_name = sql_lower.split("into")[1].split("(")[0].strip().strip('"')
                if table_name not in self._local_tables:
                    self._local_tables[table_name] = []
                
                # Very simplified - assumes VALUES clause
                columns_match = sql[sql.find("(")+1:sql.find(")")].split(",")
                columns = [c.strip().strip('"') for c in columns_match]
                
                row = {columns[i]: params[i] for i in range(len(columns)) if i < len(params)}
                self._local_tables[table_name].append(row)
                
                return D1Result(success=True, meta={"changes": 1})
            
            elif sql_lower.startswith("select"):
                # Basic SELECT handling
                if "from" in sql_lower:
                    parts = sql_lower.split("from")
                    table_name = parts[1].split()[0].strip().strip('"')
                    
                    results = self._local_tables.get(table_name, [])
                    
                    # Very basic WHERE
                    if "where" in sql_lower:
                        # This is a simplified handler
                        pass
                    
                    return D1Result(success=True, results=results)
                
                return D1Result(success=True, results=[])
            
            elif sql_lower.startswith("update"):
                return D1Result(success=True, meta={"changes": 0})
            
            elif sql_lower.startswith("delete"):
                return D1Result(success=True, meta={"changes": 0})
            
            else:
                return D1Result(success=True)
                
        except Exception as e:
            return D1Result(success=False, error=str(e))


# ============================================================================
# R2 Storage Adapter
# ============================================================================

@dataclass
class R2Object:
    """R2 object metadata"""
    key: str
    size: int = 0
    etag: str = ""
    uploaded: float = field(default_factory=time.time)
    custom_metadata: Dict[str, str] = field(default_factory=dict)


class R2Adapter:
    """
    Adapter for Cloudflare R2 object storage.
    
    In production, wraps the R2 binding.
    For local development, uses in-memory storage.
    """
    
    def __init__(self, bucket_name: str = "default", r2_binding=None):
        self.bucket_name = bucket_name
        self._binding = r2_binding
        self._local: Dict[str, tuple] = {}  # (data, metadata)
    
    async def get(self, key: str) -> Optional[bytes]:
        """Get object from R2"""
        if self._binding:
            obj = await self._binding.get(key)
            if obj:
                return await obj.arrayBuffer()
            return None
        
        if key in self._local:
            return self._local[key][0]
        return None
    
    async def put(
        self,
        key: str,
        data: bytes,
        content_type: str = "application/octet-stream",
        custom_metadata: Dict[str, str] = None,
    ) -> R2Object:
        """Put object to R2"""
        if self._binding:
            options = {"httpMetadata": {"contentType": content_type}}
            if custom_metadata:
                options["customMetadata"] = custom_metadata
            await self._binding.put(key, data, **options)
            return R2Object(key=key, size=len(data))
        
        # Local fallback
        metadata = R2Object(
            key=key,
            size=len(data),
            custom_metadata=custom_metadata or {},
        )
        self._local[key] = (data, metadata)
        return metadata
    
    async def delete(self, key: str):
        """Delete object from R2"""
        if self._binding:
            await self._binding.delete(key)
            return
        
        if key in self._local:
            del self._local[key]
    
    async def list(self, prefix: str = "", limit: int = 1000) -> List[R2Object]:
        """List objects in R2"""
        if self._binding:
            result = await self._binding.list(prefix=prefix, limit=limit)
            return [
                R2Object(
                    key=obj.key,
                    size=obj.size,
                    etag=obj.etag,
                )
                for obj in result.objects
            ]
        
        # Local fallback
        return [
            metadata for key, (_, metadata) in self._local.items()
            if key.startswith(prefix)
        ][:limit]
    
    async def head(self, key: str) -> Optional[R2Object]:
        """Get object metadata without downloading"""
        if self._binding:
            obj = await self._binding.head(key)
            if obj:
                return R2Object(
                    key=key,
                    size=obj.size,
                    etag=obj.etag,
                )
            return None
        
        if key in self._local:
            return self._local[key][1]
        return None


# ============================================================================
# Workers Environment
# ============================================================================

@dataclass
class CloudflareEnv:
    """Cloudflare Workers environment bindings"""
    
    # Storage
    kv_sessions: Optional[KVAdapter] = None
    kv_keys: Optional[KVAdapter] = None
    d1: Optional[D1Adapter] = None
    r2: Optional[R2Adapter] = None
    
    # Secrets
    jwt_secret: str = ""
    master_key_hash: str = ""
    
    # Config
    environment: str = "development"
    
    @classmethod
    def from_worker_env(cls, env) -> "CloudflareEnv":
        """Create from Cloudflare Worker environment"""
        return cls(
            kv_sessions=KVAdapter("sessions", getattr(env, "KV_SESSIONS", None)),
            kv_keys=KVAdapter("keys", getattr(env, "KV_KEYS", None)),
            d1=D1Adapter(getattr(env, "D1_DATABASE", None)),
            r2=R2Adapter("binetic", getattr(env, "R2_BUCKET", None)),
            jwt_secret=getattr(env, "JWT_SECRET", "dev-secret"),
            master_key_hash=getattr(env, "MASTER_KEY_HASH", ""),
            environment=getattr(env, "ENVIRONMENT", "development"),
        )
    
    @classmethod
    def local(cls) -> "CloudflareEnv":
        """Create local development environment"""
        return cls(
            kv_sessions=KVAdapter("sessions"),
            kv_keys=KVAdapter("keys"),
            d1=D1Adapter(),
            r2=R2Adapter("binetic"),
            jwt_secret="local-dev-secret-change-in-production",
            environment="development",
        )


# ============================================================================
# Worker Entry Point
# ============================================================================

async def handle_request(request, env) -> dict:
    """
    Main Cloudflare Worker entry point.
    
    Converts Cloudflare request to internal Request and routes it.
    """
    from ..api.routes import router, Request as InternalRequest, HttpMethod
    from ..api.middleware import create_middleware_stack
    
    # Setup environment
    cf_env = CloudflareEnv.from_worker_env(env)
    
    # Initialize middleware
    for mw in create_middleware_stack():
        router.use(mw)
    
    # Convert to internal request
    internal_request = InternalRequest(
        method=HttpMethod(request.method),
        path=request.url.replace(request.origin, "").split("?")[0],
        headers=dict(request.headers),
        query=dict(request.query) if hasattr(request, "query") else {},
        body=await request.json() if request.method in ("POST", "PUT", "PATCH") else None,
    )
    
    # Route request
    response = await router.handle(internal_request)
    
    # Return Cloudflare response format
    return {
        "status": response.status,
        "headers": response.headers,
        "body": json.dumps(response.body) if response.body else "",
    }


# Export for wrangler
__all__ = [
    "KVAdapter",
    "D1Adapter", 
    "R2Adapter",
    "CloudflareEnv",
    "handle_request",
]
