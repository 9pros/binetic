"""
Operators - Logical Abstractions of API Behaviors

Core Concept: Any API with consistent behavior can be abstracted as a logical operator.
If REQUEST(X) → RESPONSE(Y) consistently, then OP(X) = Y

This is the foundation of emergent AGI - discovering operators from the wild internet.
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional, Callable, Awaitable
import hashlib
import time
import asyncio
import aiohttp
import logging

# Try to import MCP client components
try:
    from mcp import ClientSession
    from mcp.client.sse import sse_client
    from mcp.client.stdio import stdio_client
    MCP_AVAILABLE = True
except ImportError:
    MCP_AVAILABLE = False

logger = logging.getLogger(__name__)


class OperatorType(Enum):
    """Fundamental logical operators discovered from API behaviors"""
    
    # Data Operations
    STORE = "store"           # Store data, confirm success
    RETRIEVE = "retrieve"     # Retrieve stored data
    TRANSFORM = "transform"   # Transform input → output
    FILTER = "filter"         # Filter/select from input
    AGGREGATE = "aggregate"   # Combine multiple inputs
    
    # Compute Operations
    COMPUTE = "compute"       # General computation
    INFER = "infer"           # LLM inference
    EMBED = "embed"           # Vector embedding
    SEARCH = "search"         # Similarity search
    
    # Control Operations
    SEQUENCE = "sequence"     # Execute in order
    PARALLEL = "parallel"     # Execute simultaneously
    RETRY = "retry"           # Retry on failure
    TIMEOUT = "timeout"       # Time-limited execution
    
    # Network Operations
    BROADCAST = "broadcast"   # Send to many
    ROUTE = "route"           # Direct to specific target
    GOSSIP = "gossip"         # Probabilistic spread


class APIPattern(Enum):
    """Recognized API patterns from behavior analysis"""
    REST_CRUD = "rest_crud"           # Standard REST operations
    LLM_CHAT = "llm_chat"             # Chat completion APIs
    LLM_COMPLETION = "llm_complete"   # Text completion APIs
    SEARCH_QUERY = "search_query"     # Search endpoints
    EMBED_TEXT = "embed_text"         # Embedding APIs
    STORE_DATA = "store_data"         # Storage APIs
    STREAM_SSE = "stream_sse"         # Server-sent events
    UNKNOWN = "unknown"


@dataclass
class OperatorSignature:
    """
    The behavioral signature of a discovered operator.
    Captures HOW an API behaves so we can reuse it as a logical operator.
    """
    operator_id: str
    operator_type: OperatorType
    
    # API endpoint this operator maps to
    endpoint_url: str
    method: str  # GET, POST, etc.
    headers: Dict[str, str] = field(default_factory=dict)
    
    # Request template
    request_template: Dict[str, Any] = field(default_factory=dict)
    required_params: List[str] = field(default_factory=list)
    optional_params: List[str] = field(default_factory=list)
    
    # Response mapping
    response_schema: Dict[str, Any] = field(default_factory=dict)
    output_extractors: Dict[str, str] = field(default_factory=dict)
    success_indicators: List[str] = field(default_factory=list)
    
    # Behavioral characteristics
    avg_latency_ms: float = 0.0
    success_rate: float = 1.0
    consistency_score: float = 1.0
    call_count: int = 0
    
    # Composition hints
    
    def update_stats(self, success: bool, latency_ms: float):
        """Update operator statistics based on execution outcome"""
        self.call_count += 1
        
        # Update success rate (moving average)
        alpha = 0.1  # Learning rate
        current_success = 1.0 if success else 0.0
        self.success_rate = (1 - alpha) * self.success_rate + alpha * current_success
        
        # Update latency
        if self.avg_latency_ms == 0:
            self.avg_latency_ms = latency_ms
        else:
            self.avg_latency_ms = (1 - alpha) * self.avg_latency_ms + alpha * latency_ms
            
        # Update consistency (simple heuristic: high success + low variance)
        # For now, just track success consistency
        self.consistency_score = self.success_rate * (1.0 if self.call_count > 5 else 0.5)
    can_chain: bool = True
    idempotent: bool = False
    side_effects: bool = True
    
    # Metadata
    discovered_at: float = field(default_factory=time.time)
    last_used: float = 0.0
    invocation_count: int = 0
    
    def to_dict(self) -> Dict:
        return {
            "operator_id": self.operator_id,
            "type": self.operator_type.value,
            "endpoint": self.endpoint_url,
            "method": self.method,
            "latency_ms": self.avg_latency_ms,
            "success_rate": self.success_rate,
            "invocations": self.invocation_count,
        }


@dataclass
class OperatorInvocation:
    """A single invocation of an operator"""
    invocation_id: str
    operator_id: str
    inputs: Dict[str, Any]
    outputs: Optional[Dict[str, Any]] = None
    success: bool = False
    latency_ms: float = 0.0
    timestamp: float = field(default_factory=time.time)
    error: Optional[str] = None


class OperatorRegistry:
    """
    Registry of discovered operators.
    Thread-safe, supports hot-reloading and persistence.
    """
    
    def __init__(self, persist_path: str = "data/operators.json"):
        self._operators: Dict[str, OperatorSignature] = {}
        self._by_type: Dict[OperatorType, List[str]] = {}
        self._invocation_history: List[OperatorInvocation] = []
        self._lock = asyncio.Lock()
        self._persist_path = persist_path
        self._load_from_disk()
    
    def _load_from_disk(self):
        """Load operators from disk"""
        import os
        import json
        if not os.path.exists(self._persist_path):
            return
            
        try:
            with open(self._persist_path, "r") as f:
                data = json.load(f)
                
            for op_data in data:
                # Reconstruct OperatorSignature
                # We need to handle Enum conversion manually
                op_type_str = op_data.pop("operator_type", "unknown")
                try:
                    op_type = OperatorType(op_type_str)
                except ValueError:
                    op_type = OperatorType.COMPUTE
                
                op = OperatorSignature(operator_type=op_type, **op_data)
                self._operators[op.operator_id] = op
                
                # Rebuild index
                if op.operator_type not in self._by_type:
                    self._by_type[op.operator_type] = []
                if op.operator_id not in self._by_type[op.operator_type]:
                    self._by_type[op.operator_type].append(op.operator_id)
                    
            logger.info(f"Loaded {len(self._operators)} operators from {self._persist_path}")
        except Exception as e:
            logger.error(f"Failed to load operators: {e}")

    def _save_to_disk(self):
        """Save operators to disk"""
        import os
        import json
        
        # Ensure directory exists
        os.makedirs(os.path.dirname(self._persist_path), exist_ok=True)
        
        data = []
        for op in self._operators.values():
            op_dict = op.__dict__.copy()
            # Convert Enum to string
            op_dict["operator_type"] = op.operator_type.value
            data.append(op_dict)
            
        try:
            with open(self._persist_path, "w") as f:
                json.dump(data, f, indent=2, default=str)
        except Exception as e:
            logger.error(f"Failed to save operators: {e}")

    async def register(self, operator: OperatorSignature):
        """Register a new operator"""
        async with self._lock:
            self._operators[operator.operator_id] = operator
            
            if operator.operator_type not in self._by_type:
                self._by_type[operator.operator_type] = []
            if operator.operator_id not in self._by_type[operator.operator_type]:
                self._by_type[operator.operator_type].append(operator.operator_id)
            
            self._save_to_disk()
            logger.info(f"Registered operator: {operator.operator_id} ({operator.operator_type.value})")
    
    async def get(self, operator_id: str) -> Optional[OperatorSignature]:
        """Get an operator by ID"""
        return self._operators.get(operator_id)
    
    async def get_by_type(self, op_type: OperatorType) -> List[OperatorSignature]:
        """Get all operators of a specific type"""
        ids = self._by_type.get(op_type, [])
        return [self._operators[id] for id in ids if id in self._operators]
    
    async def list_all(self) -> List[OperatorSignature]:
        """List all registered operators"""
        return list(self._operators.values())
    
    async def invoke(
        self,
        operator_id: str,
        inputs: Dict[str, Any],
        timeout: float = 30.0,
        enforcement: Optional[Dict[str, Any]] = None,
    ) -> OperatorInvocation:
        """Invoke an operator with given inputs"""
        operator = await self.get(operator_id)
        if not operator:
            return OperatorInvocation(
                invocation_id=hashlib.sha256(f"{operator_id}:{time.time()}".encode()).hexdigest()[:16],
                operator_id=operator_id,
                inputs=inputs,
                success=False,
                error="Operator not found",
            )
        
        invocation = OperatorInvocation(
            invocation_id=hashlib.sha256(f"{operator_id}:{time.time()}".encode()).hexdigest()[:16],
            operator_id=operator_id,
            inputs=inputs,
        )
        
        start_time = time.time()
        
        try:
            # Kernel-level enforcement (global guardrails)
            try:
                from security.kernel import get_kernel_enforcer

                enforcer = get_kernel_enforcer()
                decision = await enforcer.enforce_operator_invoke(
                    operator_id=operator.operator_id,
                    endpoint=operator.endpoint_url,
                    method=operator.method,
                    actor_policy_id=(enforcement or {}).get("actor_policy_id"),
                    actor_context=enforcement or {},
                )
                if not decision.allowed:
                    invocation.latency_ms = (time.time() - start_time) * 1000
                    invocation.success = False
                    invocation.error = decision.reason
                    self._invocation_history.append(invocation)
                    return invocation
            except Exception as e:
                # Fail-safe: if enforcement crashes, do not execute side-effects.
                invocation.latency_ms = (time.time() - start_time) * 1000
                invocation.success = False
                invocation.error = f"Kernel enforcement error: {e}"
                self._invocation_history.append(invocation)
                return invocation

            # Build request from template
            request_body = self._build_request(operator, inputs)
            
            if operator.method == "MCP":
                if not MCP_AVAILABLE:
                    invocation.success = False
                    invocation.error = "MCP client not available"
                    return invocation
                
                try:
                    result = await self._invoke_mcp(operator, request_body, timeout)
                    invocation.latency_ms = (time.time() - start_time) * 1000
                    invocation.success = True
                    invocation.outputs = result
                except Exception as e:
                    invocation.latency_ms = (time.time() - start_time) * 1000
                    invocation.success = False
                    invocation.error = str(e)
            else:
                async with aiohttp.ClientSession() as session:
                    if operator.method.upper() == "GET":
                        async with session.get(
                            operator.endpoint_url,
                            params=request_body,
                            headers=operator.headers,
                            timeout=aiohttp.ClientTimeout(total=timeout),
                        ) as resp:
                            status = resp.status
                            try:
                                body = await resp.json()
                            except:
                                body = await resp.text()
                    else:
                        async with session.post(
                            operator.endpoint_url,
                            json=request_body,
                            headers=operator.headers,
                            timeout=aiohttp.ClientTimeout(total=timeout),
                        ) as resp:
                            status = resp.status
                            try:
                                body = await resp.json()
                            except:
                                body = await resp.text()
                    
                    invocation.latency_ms = (time.time() - start_time) * 1000
                    invocation.success = 200 <= status < 300
                    invocation.outputs = self._extract_outputs(operator, body)
                
            # Update operator stats
            await self._update_stats(operator, invocation)
                
        except asyncio.TimeoutError:
            invocation.latency_ms = timeout * 1000
            invocation.success = False
            invocation.error = "Timeout"
        except Exception as e:
            invocation.latency_ms = (time.time() - start_time) * 1000
            invocation.success = False
            invocation.error = str(e)
        
        self._invocation_history.append(invocation)
        return invocation
    
    async def _invoke_mcp(self, operator: OperatorSignature, inputs: Dict[str, Any], timeout: float) -> Dict[str, Any]:
        """Invoke an MCP tool"""
        # Import here to avoid circular dependency
        from core.discovery import get_discovery_engine
        
        source_id = operator.headers.get("x-source")
        tool_name = operator.headers.get("x-tool-name")
        
        if not source_id or not tool_name:
            raise ValueError("Missing x-source or x-tool-name header for MCP operator")
            
        engine = get_discovery_engine()
        source = engine._sources.get(source_id)
        if not source:
            raise ValueError(f"Discovery source {source_id} not found")
            
        # Connection logic
        if source.base_url.startswith("http"):
             async with sse_client(source.base_url) as (read, write):
                async with ClientSession(read, write) as session:
                    await session.initialize()
                    result = await session.call_tool(tool_name, inputs)
                    return {"content": [c.text if hasattr(c, 'text') else str(c) for c in result.content]}
        else:
            parts = source.base_url.split(" ")
            command = parts[0]
            args = parts[1:]
            env = source.auth_credentials
            
            async with stdio_client(command, args, env) as (read, write):
                async with ClientSession(read, write) as session:
                    await session.initialize()
                    result = await session.call_tool(tool_name, inputs)
                    return {"content": [c.text if hasattr(c, 'text') else str(c) for c in result.content]}

    def _build_request(self, operator: OperatorSignature, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """Build request body from template and inputs"""
        request = dict(operator.request_template)
        
        for key, value in inputs.items():
            if isinstance(value, dict):
                request[key] = value
            else:
                # Replace template placeholders
                for rkey in request:
                    if isinstance(request[rkey], str) and f"${key}" in request[rkey]:
                        request[rkey] = request[rkey].replace(f"${key}", str(value))
                    elif request[rkey] == f"${key}":
                        request[rkey] = value
                
                # Add as direct key if not in template
                if key not in request:
                    request[key] = value
        
        return request
    
    def _extract_outputs(self, operator: OperatorSignature, body: Any) -> Dict[str, Any]:
        """Extract outputs from response using configured extractors"""
        outputs = {"raw": body}
        
        if isinstance(body, dict):
            for name, path in operator.output_extractors.items():
                # Simple JSON path extraction
                parts = path.replace("$.", "").split(".")
                value = body
                try:
                    for part in parts:
                        if part.isdigit():
                            value = value[int(part)]
                        else:
                            value = value.get(part)
                        if value is None:
                            break
                    outputs[name] = value
                except (KeyError, IndexError, TypeError):
                    outputs[name] = None
        
        return outputs
    
    async def _update_stats(self, operator: OperatorSignature, invocation: OperatorInvocation):
        """Update operator statistics after invocation"""
        async with self._lock:
            operator.update_stats(invocation.success, invocation.latency_ms)
            operator.last_used = time.time()
            self._save_to_disk()
            
            # Exponential moving average for latency
            alpha = 0.2
            operator.avg_latency_ms = (
                alpha * invocation.latency_ms + (1 - alpha) * operator.avg_latency_ms
            )
            
            # Success rate
            operator.success_rate = (
                0.95 * operator.success_rate + (0.05 if invocation.success else 0)
            )
    
    def to_dict(self) -> Dict[str, Any]:
        """Serialize registry state"""
        return {
            "operators": [op.to_dict() for op in self._operators.values()],
            "by_type": {k.value: v for k, v in self._by_type.items()},
            "total_invocations": len(self._invocation_history),
        }


class OperatorDiscovery:
    """
    Discovers operators from unknown APIs through behavioral probing.
    """
    
    def __init__(self, registry: OperatorRegistry):
        self.registry = registry
        self._probe_results: Dict[str, List[Dict]] = {}
    
    async def discover(
        self,
        url: str,
        method: str = "GET",
        test_payloads: List[Dict] = None,
        headers: Dict[str, str] = None,
    ) -> Optional[OperatorSignature]:
        """
        Probe an endpoint to discover its operator behavior.
        """
        test_payloads = test_payloads or [{}]
        headers = headers or {}
        
        results = []
        
        async with aiohttp.ClientSession() as session:
            for payload in test_payloads:
                try:
                    start = time.time()
                    
                    if method.upper() == "GET":
                        async with session.get(url, params=payload, headers=headers, timeout=10) as resp:
                            status = resp.status
                            try:
                                body = await resp.json()
                            except:
                                body = await resp.text()
                    else:
                        async with session.post(url, json=payload, headers=headers, timeout=10) as resp:
                            status = resp.status
                            try:
                                body = await resp.json()
                            except:
                                body = await resp.text()
                    
                    latency = (time.time() - start) * 1000
                    
                    results.append({
                        "payload": payload,
                        "status": status,
                        "body": body,
                        "latency_ms": latency,
                        "success": 200 <= status < 300,
                    })
                    
                except Exception as e:
                    results.append({
                        "payload": payload,
                        "error": str(e),
                        "success": False,
                    })
        
        self._probe_results[url] = results
        
        # Analyze results
        operator = await self._analyze_behavior(url, method, headers, results)
        
        if operator:
            await self.registry.register(operator)
        
        return operator
    
    async def _analyze_behavior(
        self,
        url: str,
        method: str,
        headers: Dict[str, str],
        results: List[Dict],
    ) -> Optional[OperatorSignature]:
        """Analyze probe results to determine operator type"""
        successful = [r for r in results if r.get("success")]
        
        if not successful:
            return None
        
        first_body = successful[0].get("body", {})
        
        # Infer operator type
        operator_type = self._infer_type(url, method, successful)
        
        # Calculate metrics
        avg_latency = sum(r.get("latency_ms", 0) for r in successful) / len(successful)
        success_rate = len(successful) / len(results)
        
        operator_id = hashlib.sha256(f"{url}:{method}".encode()).hexdigest()[:16]
        
        return OperatorSignature(
            operator_id=operator_id,
            operator_type=operator_type,
            endpoint_url=url,
            method=method,
            headers=headers,
            request_template={},
            required_params=[],
            optional_params=[],
            response_schema=self._infer_schema(first_body),
            output_extractors=self._find_output_paths(first_body),
            success_indicators=self._find_success_indicators(successful),
            avg_latency_ms=avg_latency,
            success_rate=success_rate,
            consistency_score=self._calculate_consistency(successful),
        )
    
    def _infer_type(self, url: str, method: str, results: List[Dict]) -> OperatorType:
        """Infer operator type from URL patterns and behavior"""
        url_lower = url.lower()
        
        # URL-based heuristics
        if any(kw in url_lower for kw in ["search", "query", "find"]):
            return OperatorType.SEARCH
        if any(kw in url_lower for kw in ["embed", "vector", "encode"]):
            return OperatorType.EMBED
        if any(kw in url_lower for kw in ["chat", "complete", "generate", "infer"]):
            return OperatorType.INFER
        if any(kw in url_lower for kw in ["store", "save", "put", "create"]):
            return OperatorType.STORE
        if any(kw in url_lower for kw in ["get", "fetch", "retrieve", "read", "status"]):
            return OperatorType.RETRIEVE
        if any(kw in url_lower for kw in ["transform", "convert", "process"]):
            return OperatorType.TRANSFORM
        if any(kw in url_lower for kw in ["filter", "select", "where"]):
            return OperatorType.FILTER
        if any(kw in url_lower for kw in ["aggregate", "sum", "count", "avg"]):
            return OperatorType.AGGREGATE
        
        # Method-based fallback
        if method.upper() == "GET":
            return OperatorType.RETRIEVE
        elif method.upper() == "POST":
            return OperatorType.COMPUTE
        
        return OperatorType.COMPUTE
    
    def _infer_schema(self, body: Any) -> Dict[str, Any]:
        """Infer JSON schema from response body"""
        if isinstance(body, dict):
            return {k: type(v).__name__ for k, v in body.items()}
        elif isinstance(body, list) and body:
            return {"type": "array", "items": self._infer_schema(body[0])}
        return {"type": type(body).__name__}
    
    def _find_success_indicators(self, results: List[Dict]) -> List[str]:
        """Find JSON paths that indicate success"""
        indicators = []
        for result in results:
            body = result.get("body", {})
            if isinstance(body, dict):
                for key in ["success", "status", "ok", "data", "result"]:
                    if key in body:
                        indicators.append(f"$.{key}")
        return list(set(indicators))
    
    def _find_output_paths(self, body: Any) -> Dict[str, str]:
        """Find paths to extract outputs from response"""
        paths = {}
        if isinstance(body, dict):
            for key in body:
                if key in ("data", "result", "output", "response", "content"):
                    paths["main"] = f"$.{key}"
                elif key in ("id", "uuid", "identifier"):
                    paths["id"] = f"$.{key}"
                elif key in ("message", "text", "content"):
                    paths["content"] = f"$.{key}"
        return paths
    
    def _calculate_consistency(self, results: List[Dict]) -> float:
        """Calculate response structure consistency"""
        if len(results) < 2:
            return 1.0
        
        schemas = []
        for r in results:
            body = r.get("body", {})
            if isinstance(body, dict):
                schemas.append(set(body.keys()))
        
        if not schemas:
            return 1.0
        
        common = set.intersection(*schemas) if schemas else set()
        total = set.union(*schemas) if schemas else set()
        
        return len(common) / len(total) if total else 1.0


class OperatorPipeline:
    """
    Compose multiple operators into a pipeline.
    Enables higher-order behaviors from primitive operators.
    """
    
    def __init__(self, registry: OperatorRegistry):
        self.registry = registry
        self.steps: List[str] = []
        self.transforms: Dict[int, Callable] = {}
    
    def add(self, operator_id: str, transform: Callable = None) -> "OperatorPipeline":
        """Add an operator to the pipeline"""
        idx = len(self.steps)
        self.steps.append(operator_id)
        if transform:
            self.transforms[idx] = transform
        return self
    
    async def execute(self, initial_inputs: Dict[str, Any]) -> Dict[str, Any]:
        """Execute the pipeline"""
        current_inputs = initial_inputs
        results = []
        
        for idx, operator_id in enumerate(self.steps):
            # Apply transform if defined
            if idx in self.transforms:
                current_inputs = self.transforms[idx](current_inputs)
            
            # Invoke operator
            invocation = await self.registry.invoke(operator_id, current_inputs)
            results.append(invocation)
            
            if not invocation.success:
                return {
                    "success": False,
                    "failed_at_step": idx,
                    "error": invocation.error,
                    "results": results,
                }
            
            # Use outputs as next inputs
            current_inputs = invocation.outputs or {}
        
        return {
            "success": True,
            "final_output": current_inputs,
            "results": results,
        }


# Global registry instance
_registry: Optional[OperatorRegistry] = None


def get_operator_registry() -> OperatorRegistry:
    """Get or create global operator registry"""
    global _registry
    if _registry is None:
        _registry = OperatorRegistry()
    return _registry
