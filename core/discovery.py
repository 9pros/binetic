"""
Discovery - Dynamic Capability Discovery Engine

Probes external systems and APIs to discover available capabilities.
"""

from dataclasses import dataclass, field
from typing import Any, Callable, Dict, List, Optional, Set
from enum import Enum
import time
import logging
import asyncio
import hashlib
import json

logger = logging.getLogger(__name__)

# Try to import MCP client components
try:
    from mcp import ClientSession
    from mcp.client.sse import sse_client
    from mcp.client.stdio import stdio_client
    MCP_AVAILABLE = True
except ImportError:
    MCP_AVAILABLE = False
    logger.warning("MCP client libraries not available. MCP discovery will be disabled.")


class CapabilityType(Enum):
    """Types of discoverable capabilities"""
    REST_API = "rest_api"
    GRAPHQL = "graphql"
    WEBSOCKET = "websocket"
    FUNCTION = "function"
    TOOL = "tool"
    MODEL = "model"
    DATABASE = "database"
    STORAGE = "storage"
    QUEUE = "queue"
    STREAM = "stream"


class DiscoveryMethod(Enum):
    """Methods for discovering capabilities"""
    OPENAPI = "openapi"       # OpenAPI/Swagger spec
    GRAPHQL_INTROSPECT = "graphql_introspect"
    PROBE = "probe"           # HTTP probing
    MANIFEST = "manifest"     # JSON manifest file
    DNS_SD = "dns_sd"         # DNS service discovery
    ANNOUNCEMENT = "announcement"  # Capability broadcast
    MCP = "mcp"               # Model Context Protocol


@dataclass
class Capability:
    """A discovered capability"""
    capability_id: str
    name: str
    capability_type: CapabilityType
    
    # Endpoint info
    endpoint: str
    method: str = "POST"
    
    # Schema
    input_schema: Dict[str, Any] = field(default_factory=dict)
    output_schema: Dict[str, Any] = field(default_factory=dict)
    
    # Metadata
    description: str = ""
    version: str = "1.0"
    tags: Set[str] = field(default_factory=set)
    
    # Discovery info
    discovered_at: float = field(default_factory=time.time)
    discovery_method: DiscoveryMethod = DiscoveryMethod.PROBE
    source: str = ""
    
    # Health
    last_health_check: float = 0.0
    is_healthy: bool = True
    response_time_ms: float = 0.0
    
    # Usage stats
    call_count: int = 0
    success_count: int = 0
    
    @property
    def success_rate(self) -> float:
        if self.call_count == 0:
            return 1.0
        return self.success_count / self.call_count
    
    def to_dict(self) -> Dict:
        return {
            "capability_id": self.capability_id,
            "name": self.name,
            "capability_type": self.capability_type.value,
            "endpoint": self.endpoint,
            "method": self.method,
            "input_schema": self.input_schema,
            "output_schema": self.output_schema,
            "description": self.description,
            "version": self.version,
            "tags": list(self.tags),
            "discovered_at": self.discovered_at,
            "discovery_method": self.discovery_method.value,
            "source": self.source,
            "is_healthy": self.is_healthy,
            "success_rate": self.success_rate,
        }


@dataclass
class DiscoverySource:
    """A source for capability discovery"""
    source_id: str
    name: str
    base_url: str
    discovery_method: DiscoveryMethod
    
    # Auth
    auth_type: str = "none"  # none, api_key, bearer, basic
    auth_credentials: Optional[Dict[str, str]] = None
    
    # Discovery config
    discovery_path: str = ""  # e.g., /openapi.json
    refresh_interval: int = 3600
    
    # State
    last_discovery: float = 0.0
    capabilities_found: int = 0
    is_active: bool = True


class DiscoveryEngine:
    """
    Dynamic capability discovery engine.
    
    Probes sources to discover and catalog available capabilities.
    """
    
    def __init__(self, http_client=None):
        self._sources: Dict[str, DiscoverySource] = {}
        self._capabilities: Dict[str, Capability] = {}
        self._http = http_client  # HTTP client for probing
        self._discovery_hooks: List[Callable] = []
    
    def register_source(self, source: DiscoverySource):
        """Register a discovery source"""
        self._sources[source.source_id] = source
        logger.info(f"Registered discovery source: {source.name}")
    
    def on_discovery(self, hook: Callable):
        """Register hook for when capabilities are discovered"""
        self._discovery_hooks.append(hook)
    
    async def discover_all(self) -> Dict[str, List[Capability]]:
        """Run discovery on all sources"""
        results = {}
        
        for source_id, source in self._sources.items():
            if not source.is_active:
                continue
            
            try:
                capabilities = await self.discover_from_source(source)
                results[source_id] = capabilities
                source.last_discovery = time.time()
                source.capabilities_found = len(capabilities)
            except Exception as e:
                logger.error(f"Discovery failed for {source_id}: {e}")
                results[source_id] = []
        
        return results
    
    async def discover_from_source(self, source: DiscoverySource) -> List[Capability]:
        """Discover capabilities from a specific source"""
        capabilities = []
        
        if source.discovery_method == DiscoveryMethod.OPENAPI:
            capabilities = await self._discover_openapi(source)
        elif source.discovery_method == DiscoveryMethod.GRAPHQL_INTROSPECT:
            capabilities = await self._discover_graphql(source)
        elif source.discovery_method == DiscoveryMethod.PROBE:
            capabilities = await self._discover_probe(source)
        elif source.discovery_method == DiscoveryMethod.MANIFEST:
            capabilities = await self._discover_manifest(source)
        elif source.discovery_method == DiscoveryMethod.MCP:
            capabilities = await self._discover_mcp(source)
        
        # Register discovered capabilities
        for cap in capabilities:
            # Kernel-level enforcement (global guardrails)
            try:
                from security.kernel import get_kernel_enforcer

                enforcer = get_kernel_enforcer()
                decision = await enforcer.enforce_discovery_register(
                    capability_type=cap.capability_type.value,
                    endpoint=cap.endpoint,
                    method=cap.method,
                    actor_context={"source_id": source.source_id},
                )
                if not decision.allowed:
                    logger.warning(f"Discovery rejected capability {cap.capability_id}: {decision.reason}")
                    continue
            except Exception as e:
                # Fail-safe: if enforcement crashes, do not register new capabilities.
                logger.error(f"Kernel enforcement error during discovery: {e}")
                continue

            self._capabilities[cap.capability_id] = cap
            
            # Notify hooks
            for hook in self._discovery_hooks:
                try:
                    await hook(cap)
                except Exception as e:
                    logger.error(f"Discovery hook error: {e}")
        
        logger.info(f"Discovered {len(capabilities)} capabilities from {source.name}")
        return capabilities
    
    async def _discover_mcp(self, source: DiscoverySource) -> List[Capability]:
        """Discover capabilities from an MCP server"""
        if not MCP_AVAILABLE:
            logger.error("MCP client not available")
            return []

        capabilities = []
        
        # Determine transport based on base_url
        # If http/https -> SSE
        # If not -> Stdio (command)
        
        try:
            if source.base_url.startswith("http"):
                async with sse_client(source.base_url) as (read, write):
                    async with ClientSession(read, write) as session:
                        await session.initialize()
                        
                        # List tools
                        result = await session.list_tools()
                        tools = result.tools
                        
                        for tool in tools:
                            cap = Capability(
                                capability_id=f"mcp-{source.source_id}-{tool.name}",
                                name=tool.name,
                                capability_type=CapabilityType.TOOL,
                                endpoint=source.base_url, # Virtual endpoint
                                method="MCP",
                                input_schema=tool.inputSchema,
                                description=tool.description or "",
                                discovery_method=DiscoveryMethod.MCP,
                                source=source.source_id,
                                tags={"mcp", "tool"}
                            )
                            capabilities.append(cap)
                            
                        # List resources (optional, treat as DATABASE/STORAGE?)
                        # resources = await session.list_resources()
                        # ...
            else:
                # Assume command line for stdio
                # base_url might be "npx -y @modelcontextprotocol/server-filesystem /path"
                # We need to parse it.
                import shutil
                parts = source.base_url.split(" ")
                command = parts[0]
                args = parts[1:]
                
                # Security check: only allow specific commands or paths?
                # For now, we assume the source is trusted if configured by admin.
                
                # We need environment variables?
                env = None
                if source.auth_credentials:
                    env = source.auth_credentials
                
                async with stdio_client(
                    command=command,
                    args=args,
                    env=env
                ) as (read, write):
                    async with ClientSession(read, write) as session:
                        await session.initialize()
                        
                        result = await session.list_tools()
                        tools = result.tools
                        
                        for tool in tools:
                            cap = Capability(
                                capability_id=f"mcp-{source.source_id}-{tool.name}",
                                name=tool.name,
                                capability_type=CapabilityType.TOOL,
                                endpoint=source.base_url,
                                method="MCP",
                                input_schema=tool.inputSchema,
                                description=tool.description or "",
                                discovery_method=DiscoveryMethod.MCP,
                                source=source.source_id,
                                tags={"mcp", "tool", "stdio"}
                            )
                            capabilities.append(cap)

        except Exception as e:
            logger.error(f"MCP discovery failed for {source.source_id}: {e}")
            
        return capabilities

    async def _discover_openapi(self, source: DiscoverySource) -> List[Capability]:
        """Discover from OpenAPI spec"""
        capabilities = []
        
        if not self._http:
            return capabilities
        
        url = f"{source.base_url.rstrip('/')}/{source.discovery_path.lstrip('/')}"
        
        try:
            response = await self._http.get(
                url,
                headers=self._get_auth_headers(source),
            )
            spec = response.json()
            
            paths = spec.get("paths", {})
            for path, methods in paths.items():
                for method, details in methods.items():
                    if method in ("get", "post", "put", "delete", "patch"):
                        cap = self._parse_openapi_operation(
                            source, path, method.upper(), details
                        )
                        capabilities.append(cap)
        except Exception as e:
            logger.error(f"OpenAPI discovery failed: {e}")
        
        return capabilities
    
    def _parse_openapi_operation(
        self,
        source: DiscoverySource,
        path: str,
        method: str,
        details: Dict,
    ) -> Capability:
        """Parse OpenAPI operation into capability"""
        operation_id = details.get("operationId", f"{method}_{path}".replace("/", "_"))
        
        # Extract input schema from requestBody
        input_schema = {}
        if "requestBody" in details:
            content = details["requestBody"].get("content", {})
            if "application/json" in content:
                input_schema = content["application/json"].get("schema", {})
        
        # Extract output schema from responses
        output_schema = {}
        if "200" in details.get("responses", {}):
            content = details["responses"]["200"].get("content", {})
            if "application/json" in content:
                output_schema = content["application/json"].get("schema", {})
        
        return Capability(
            capability_id=f"cap_{hashlib.sha256(f'{source.base_url}{path}{method}'.encode()).hexdigest()[:12]}",
            name=operation_id,
            capability_type=CapabilityType.REST_API,
            endpoint=f"{source.base_url.rstrip('/')}{path}",
            method=method,
            input_schema=input_schema,
            output_schema=output_schema,
            description=details.get("summary", details.get("description", "")),
            tags=set(details.get("tags", [])),
            discovery_method=DiscoveryMethod.OPENAPI,
            source=source.source_id,
        )
    
    async def _discover_graphql(self, source: DiscoverySource) -> List[Capability]:
        """Discover from GraphQL introspection"""
        capabilities = []
        
        if not self._http:
            return capabilities
        
        introspection_query = """
        query {
            __schema {
                queryType { name fields { name description args { name type { name } } } }
                mutationType { name fields { name description args { name type { name } } } }
            }
        }
        """
        
        try:
            url = f"{source.base_url.rstrip('/')}/{source.discovery_path.lstrip('/')}"
            response = await self._http.post(
                url,
                json={"query": introspection_query},
                headers=self._get_auth_headers(source),
            )
            schema = response.json().get("data", {}).get("__schema", {})
            
            # Parse queries
            for field in schema.get("queryType", {}).get("fields", []):
                cap = Capability(
                    capability_id=f"gql_{source.source_id}_{field['name']}",
                    name=field["name"],
                    capability_type=CapabilityType.GRAPHQL,
                    endpoint=url,
                    method="QUERY",
                    description=field.get("description", ""),
                    discovery_method=DiscoveryMethod.GRAPHQL_INTROSPECT,
                    source=source.source_id,
                )
                capabilities.append(cap)
            
            # Parse mutations
            for field in schema.get("mutationType", {}).get("fields", []):
                cap = Capability(
                    capability_id=f"gql_{source.source_id}_{field['name']}",
                    name=field["name"],
                    capability_type=CapabilityType.GRAPHQL,
                    endpoint=url,
                    method="MUTATION",
                    description=field.get("description", ""),
                    discovery_method=DiscoveryMethod.GRAPHQL_INTROSPECT,
                    source=source.source_id,
                )
                capabilities.append(cap)
        except Exception as e:
            logger.error(f"GraphQL introspection failed: {e}")
        
        return capabilities
    
    async def _discover_probe(self, source: DiscoverySource) -> List[Capability]:
        """Discover by probing common endpoints"""
        capabilities = []
        
        if not self._http:
            return capabilities
        
        # Common endpoints to probe
        probe_paths = [
            "/health",
            "/api",
            "/v1",
            "/graphql",
            "/rpc",
        ]
        
        for path in probe_paths:
            try:
                url = f"{source.base_url.rstrip('/')}{path}"
                start = time.time()
                response = await self._http.get(
                    url,
                    headers=self._get_auth_headers(source),
                    timeout=5.0,
                )
                response_time = (time.time() - start) * 1000
                
                if response.status_code < 400:
                    cap = Capability(
                        capability_id=f"probe_{hashlib.sha256(url.encode()).hexdigest()[:12]}",
                        name=f"endpoint_{path.strip('/').replace('/', '_')}",
                        capability_type=CapabilityType.REST_API,
                        endpoint=url,
                        method="GET",
                        discovery_method=DiscoveryMethod.PROBE,
                        source=source.source_id,
                        response_time_ms=response_time,
                    )
                    capabilities.append(cap)
            except Exception:
                pass  # Probing failure is expected for some paths
        
        return capabilities
    
    async def _discover_manifest(self, source: DiscoverySource) -> List[Capability]:
        """Discover from JSON manifest"""
        capabilities = []
        
        if not self._http:
            return capabilities
        
        try:
            url = f"{source.base_url.rstrip('/')}/{source.discovery_path.lstrip('/')}"
            response = await self._http.get(
                url,
                headers=self._get_auth_headers(source),
            )
            manifest = response.json()
            
            for item in manifest.get("capabilities", []):
                cap = Capability(
                    capability_id=item.get("id", f"man_{hashlib.sha256(item['name'].encode()).hexdigest()[:12]}"),
                    name=item["name"],
                    capability_type=CapabilityType(item.get("type", "rest_api")),
                    endpoint=item.get("endpoint", source.base_url),
                    method=item.get("method", "POST"),
                    input_schema=item.get("input_schema", {}),
                    output_schema=item.get("output_schema", {}),
                    description=item.get("description", ""),
                    tags=set(item.get("tags", [])),
                    discovery_method=DiscoveryMethod.MANIFEST,
                    source=source.source_id,
                )
                capabilities.append(cap)
        except Exception as e:
            logger.error(f"Manifest discovery failed: {e}")
        
        return capabilities
    
    def _get_auth_headers(self, source: DiscoverySource) -> Dict[str, str]:
        """Get authentication headers for source"""
        if source.auth_type == "none" or not source.auth_credentials:
            return {}
        
        if source.auth_type == "api_key":
            key_name = source.auth_credentials.get("header", "X-API-Key")
            return {key_name: source.auth_credentials.get("key", "")}
        elif source.auth_type == "bearer":
            return {"Authorization": f"Bearer {source.auth_credentials.get('token', '')}"}
        elif source.auth_type == "basic":
            import base64
            creds = f"{source.auth_credentials.get('username', '')}:{source.auth_credentials.get('password', '')}"
            encoded = base64.b64encode(creds.encode()).decode()
            return {"Authorization": f"Basic {encoded}"}
        
        return {}
    
    async def health_check(self, capability_id: str) -> bool:
        """Check if capability is healthy"""
        if capability_id not in self._capabilities:
            return False
        
        cap = self._capabilities[capability_id]
        
        if not self._http:
            return cap.is_healthy
        
        try:
            start = time.time()
            response = await self._http.request(
                cap.method if cap.method != "QUERY" else "POST",
                cap.endpoint,
                timeout=10.0,
            )
            cap.response_time_ms = (time.time() - start) * 1000
            cap.is_healthy = response.status_code < 500
            cap.last_health_check = time.time()
        except Exception:
            cap.is_healthy = False
        
        return cap.is_healthy
    
    async def health_check_all(self) -> Dict[str, bool]:
        """Check health of all capabilities"""
        results = {}
        for cap_id in self._capabilities:
            results[cap_id] = await self.health_check(cap_id)
        return results
    
    def get_capability(self, capability_id: str) -> Optional[Capability]:
        """Get capability by ID"""
        return self._capabilities.get(capability_id)
    
    def search_capabilities(
        self,
        name: Optional[str] = None,
        capability_type: Optional[CapabilityType] = None,
        tags: Optional[Set[str]] = None,
        healthy_only: bool = False,
    ) -> List[Capability]:
        """Search for capabilities"""
        results = list(self._capabilities.values())
        
        if name:
            results = [c for c in results if name.lower() in c.name.lower()]
        
        if capability_type:
            results = [c for c in results if c.capability_type == capability_type]
        
        if tags:
            results = [c for c in results if tags & c.tags]
        
        if healthy_only:
            results = [c for c in results if c.is_healthy]
        
        return results
    
    def stats(self) -> Dict:
        """Get discovery statistics"""
        return {
            "total_sources": len(self._sources),
            "active_sources": len([s for s in self._sources.values() if s.is_active]),
            "total_capabilities": len(self._capabilities),
            "healthy_capabilities": len([c for c in self._capabilities.values() if c.is_healthy]),
            "by_type": {
                t.value: len([c for c in self._capabilities.values() if c.capability_type == t])
                for t in CapabilityType
            },
        }


# Global discovery engine
_engine: Optional[DiscoveryEngine] = None


def get_discovery_engine() -> DiscoveryEngine:
    """Get or create global discovery engine"""
    global _engine
    if _engine is None:
        try:
            import httpx
            client = httpx.AsyncClient(timeout=10.0)
        except ImportError:
            client = None
            logger.warning("httpx not installed, HTTP discovery disabled")
            
        _engine = DiscoveryEngine(http_client=client)
    return _engine
