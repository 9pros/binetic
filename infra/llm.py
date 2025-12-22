"""
LLM Adapters - Unified Interface to Cloud Models

Binetic connects to unlimited cloud LLMs with a consistent interface.
Each model is abstracted as an INFER operator.
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Any, AsyncIterator, Dict, List, Optional
import httpx
import logging
import time

logger = logging.getLogger(__name__)


class ModelProvider(Enum):
    """Supported model providers"""
    QWEN = "qwen"           # Alibaba Qwen (via Dashscope or compatible)
    GLM = "glm"             # Zhipu GLM
    KIMI = "kimi"           # Moonshot Kimi
    DEEPSEEK = "deepseek"   # DeepSeek
    OPENAI = "openai"       # OpenAI-compatible


@dataclass
class ModelConfig:
    """Configuration for a cloud model"""
    name: str
    provider: ModelProvider
    endpoint: str
    
    # Model capabilities
    max_context: int = 128000
    max_output: int = 8192
    supports_vision: bool = False
    supports_streaming: bool = True
    supports_tools: bool = True
    
    # Performance hints
    params_total: str = ""       # e.g., "480B"
    params_active: str = ""      # e.g., "32B" for MoE
    
    # Strengths (for operator selection)
    strengths: List[str] = field(default_factory=list)


# Available models registry
MODELS: Dict[str, ModelConfig] = {
    "qwen3-coder-plus": ModelConfig(
        name="qwen3-coder-plus",
        provider=ModelProvider.QWEN,
        endpoint="https://dashscope.aliyuncs.com/compatible-mode/v1",
        max_context=1000000,
        max_output=16384,
        params_total="480B",
        strengths=["agentic_coding", "long_context", "tool_use"],
    ),
    "glm-4.6": ModelConfig(
        name="glm-4.6",
        provider=ModelProvider.GLM,
        endpoint="https://open.bigmodel.cn/api/paas/v4",
        max_context=200000,
        max_output=128000,  # Huge output!
        params_total="355B",
        params_active="32B",
        strengths=["agent_focused", "huge_output", "code_gen"],
    ),
    "kimi-k2": ModelConfig(
        name="kimi-k2-instruct-0905",
        provider=ModelProvider.KIMI,
        endpoint="https://api.moonshot.cn/v1",
        max_context=256000,
        params_total="1T",
        params_active="32B",
        strengths=["reasoning", "analysis", "planning"],
    ),
    "deepseek-r1": ModelConfig(
        name="deepseek-r1",
        provider=ModelProvider.DEEPSEEK,
        endpoint="https://api.deepseek.com/v1",
        max_context=128000,
        supports_tools=False,  # R1 is pure reasoning
        strengths=["o1_level_reasoning", "math", "logic"],
    ),
    "deepseek-v3": ModelConfig(
        name="deepseek-v3-671b",
        provider=ModelProvider.DEEPSEEK,
        endpoint="https://api.deepseek.com/v1",
        max_context=128000,
        params_total="671B",
        params_active="37B",
        strengths=["fast", "general", "moe_efficient"],
    ),
    "qwen3-thinking": ModelConfig(
        name="qwen3-235b-a22b-thinking",
        provider=ModelProvider.QWEN,
        endpoint="https://dashscope.aliyuncs.com/compatible-mode/v1",
        max_context=256000,
        params_total="235B",
        params_active="22B",
        strengths=["sota_reasoning", "analysis", "planning"],
    ),
    "qwen3-vl": ModelConfig(
        name="qwen3-vl-plus",
        provider=ModelProvider.QWEN,
        endpoint="https://dashscope.aliyuncs.com/compatible-mode/v1",
        max_context=256000,
        supports_vision=True,
        strengths=["vision", "multimodal", "image_understanding"],
    ),
}


@dataclass
class Message:
    """A chat message"""
    role: str  # system, user, assistant, tool
    content: str
    name: Optional[str] = None
    tool_calls: Optional[List[Dict]] = None
    tool_call_id: Optional[str] = None


@dataclass
class CompletionRequest:
    """Request for model completion"""
    messages: List[Message]
    model: str = "qwen3-coder-plus"
    temperature: float = 0.7
    max_tokens: int = 4096
    stream: bool = False
    tools: Optional[List[Dict]] = None


@dataclass
class CompletionResponse:
    """Response from model"""
    content: str
    model: str
    finish_reason: str
    usage: Dict[str, int]
    latency_ms: float


class LLMAdapter:
    """
    Unified adapter for all cloud LLMs.
    Abstracts each model as an INFER operator.
    """
    
    def __init__(self, api_keys: Dict[str, str] = None):
        """
        Initialize with API keys for each provider.
        
        api_keys = {
            "qwen": "sk-xxx",
            "glm": "xxx",
            "kimi": "sk-xxx",
            "deepseek": "sk-xxx",
        }
        """
        self.api_keys = api_keys or {}
        self._client = httpx.AsyncClient(timeout=120.0)
        self._invocation_count = 0
        self._total_tokens = 0
    
    def get_model(self, model_id: str) -> Optional[ModelConfig]:
        """Get model configuration"""
        return MODELS.get(model_id)
    
    def list_models(self) -> List[ModelConfig]:
        """List all available models"""
        return list(MODELS.values())
    
    def best_model_for(self, task: str) -> str:
        """Select best model for a given task type"""
        task_mapping = {
            "coding": "qwen3-coder-plus",
            "agentic": "qwen3-coder-plus",
            "code_generation": "glm-4.6",
            "long_output": "glm-4.6",
            "reasoning": "qwen3-thinking",
            "analysis": "kimi-k2",
            "planning": "kimi-k2",
            "math": "deepseek-r1",
            "logic": "deepseek-r1",
            "fast": "deepseek-v3",
            "vision": "qwen3-vl",
            "image": "qwen3-vl",
        }
        return task_mapping.get(task.lower(), "deepseek-v3")
    
    async def complete(self, request: CompletionRequest) -> CompletionResponse:
        """
        Send completion request to appropriate model.
        """
        model_config = MODELS.get(request.model)
        if not model_config:
            raise ValueError(f"Unknown model: {request.model}")
        
        api_key = self.api_keys.get(model_config.provider.value)
        if not api_key:
            raise ValueError(f"No API key for provider: {model_config.provider.value}")
        
        start_time = time.time()
        
        # Build OpenAI-compatible request
        payload = {
            "model": model_config.name,
            "messages": [
                {"role": m.role, "content": m.content}
                for m in request.messages
            ],
            "temperature": request.temperature,
            "max_tokens": min(request.max_tokens, model_config.max_output),
            "stream": request.stream,
        }
        
        if request.tools and model_config.supports_tools:
            payload["tools"] = request.tools
        
        # Send request
        response = await self._client.post(
            f"{model_config.endpoint}/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json=payload,
        )
        response.raise_for_status()
        data = response.json()
        
        latency_ms = (time.time() - start_time) * 1000
        
        # Parse response
        choice = data["choices"][0]
        usage = data.get("usage", {})
        
        self._invocation_count += 1
        self._total_tokens += usage.get("total_tokens", 0)
        
        return CompletionResponse(
            content=choice["message"]["content"],
            model=request.model,
            finish_reason=choice.get("finish_reason", "stop"),
            usage=usage,
            latency_ms=latency_ms,
        )
    
    async def stream(
        self, request: CompletionRequest
    ) -> AsyncIterator[str]:
        """Stream completion response"""
        request.stream = True
        model_config = MODELS.get(request.model)
        if not model_config:
            raise ValueError(f"Unknown model: {request.model}")
        
        api_key = self.api_keys.get(model_config.provider.value)
        if not api_key:
            raise ValueError(f"No API key for provider: {model_config.provider.value}")
        
        payload = {
            "model": model_config.name,
            "messages": [
                {"role": m.role, "content": m.content}
                for m in request.messages
            ],
            "temperature": request.temperature,
            "max_tokens": min(request.max_tokens, model_config.max_output),
            "stream": True,
        }
        
        async with self._client.stream(
            "POST",
            f"{model_config.endpoint}/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json=payload,
        ) as response:
            response.raise_for_status()
            async for line in response.aiter_lines():
                if line.startswith("data: "):
                    data = line[6:]
                    if data == "[DONE]":
                        break
                    import json
                    chunk = json.loads(data)
                    delta = chunk["choices"][0].get("delta", {})
                    if "content" in delta:
                        yield delta["content"]
    
    def stats(self) -> Dict[str, Any]:
        """Get adapter statistics"""
        return {
            "invocations": self._invocation_count,
            "total_tokens": self._total_tokens,
            "models_available": len(MODELS),
        }
    
    async def close(self):
        """Clean up resources"""
        await self._client.aclose()


# Singleton instance
_adapter: Optional[LLMAdapter] = None


def get_llm_adapter() -> LLMAdapter:
    """Get the singleton LLM adapter"""
    global _adapter
    if _adapter is None:
        _adapter = LLMAdapter()
    return _adapter


def init_llm_adapter(api_keys: Dict[str, str]) -> LLMAdapter:
    """Initialize LLM adapter with API keys"""
    global _adapter
    _adapter = LLMAdapter(api_keys)
    return _adapter
