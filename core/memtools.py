"""
Memtools - Reactive Memory Tools for Emergent Intelligence

Self-modifying memory patterns that enable learning and adaptation.
"""

from dataclasses import dataclass, field
from typing import Any, Callable, Dict, List, Optional, Set
from enum import Enum
import time
import logging
import hashlib
import json

logger = logging.getLogger(__name__)


class MemtoolType(Enum):
    """Types of memory tools"""
    STORE = "store"           # Store data persistently
    RECALL = "recall"         # Retrieve stored data
    PATTERN = "pattern"       # Recognize patterns
    COMPRESS = "compress"     # Compress/summarize data
    LINK = "link"             # Create associations
    FORGET = "forget"         # Controlled forgetting
    PRIORITIZE = "prioritize" # Adjust importance
    INDEX = "index"           # Create searchable indices


@dataclass
class Memory:
    """A single memory unit"""
    memory_id: str
    content: Any
    memory_type: str = "general"
    
    # Metadata
    created_at: float = field(default_factory=time.time)
    accessed_at: float = field(default_factory=time.time)
    access_count: int = 0
    
    # Importance and decay
    importance: float = 0.5
    decay_rate: float = 0.01
    
    # Associations
    links: Set[str] = field(default_factory=set)
    tags: Set[str] = field(default_factory=set)
    
    # Embeddings for vector search
    embedding: Optional[List[float]] = None
    
    def access(self):
        """Record an access, boosting importance"""
        self.accessed_at = time.time()
        self.access_count += 1
        # Recency boost
        self.importance = min(1.0, self.importance + 0.05)
    
    def decay(self, time_delta: float):
        """Apply decay based on time"""
        decay = self.decay_rate * time_delta
        self.importance = max(0.0, self.importance - decay)
    
    def to_dict(self) -> Dict:
        return {
            "memory_id": self.memory_id,
            "content": self.content,
            "memory_type": self.memory_type,
            "created_at": self.created_at,
            "accessed_at": self.accessed_at,
            "access_count": self.access_count,
            "importance": self.importance,
            "decay_rate": self.decay_rate,
            "links": list(self.links),
            "tags": list(self.tags),
            "embedding": self.embedding,
        }
    
    @classmethod
    def from_dict(cls, data: Dict) -> "Memory":
        mem = cls(
            memory_id=data["memory_id"],
            content=data["content"],
            memory_type=data.get("memory_type", "general"),
            created_at=data.get("created_at", time.time()),
            accessed_at=data.get("accessed_at", time.time()),
            access_count=data.get("access_count", 0),
            importance=data.get("importance", 0.5),
            decay_rate=data.get("decay_rate", 0.01),
        )
        mem.links = set(data.get("links", []))
        mem.tags = set(data.get("tags", []))
        mem.embedding = data.get("embedding")
        return mem


@dataclass
class Pattern:
    """A recognized pattern in memory"""
    pattern_id: str
    pattern_type: str
    
    # Pattern definition
    trigger_conditions: Dict[str, Any] = field(default_factory=dict)
    response_template: Optional[str] = None
    
    # Statistics
    occurrences: int = 0
    last_triggered: float = 0.0
    success_rate: float = 0.5
    
    # Associated memories
    memory_ids: Set[str] = field(default_factory=set)


class MemtoolRegistry:
    """
    Registry for memory tools.
    
    Provides operations for storing, recalling, and manipulating memories.
    """
    
    def __init__(self, storage=None, embedder=None):
        self._memories: Dict[str, Memory] = {}
        self._patterns: Dict[str, Pattern] = {}
        self._indices: Dict[str, Dict[str, Set[str]]] = {}
        self._storage = storage  # Cloudflare R2/D1 adapter
        self._embedder = embedder  # Text embedding function
    
    def _generate_id(self, content: Any) -> str:
        """Generate content-based ID"""
        content_str = json.dumps(content, sort_keys=True, default=str)
        return f"mem_{hashlib.sha256(content_str.encode()).hexdigest()[:16]}"
    
    async def store(
        self,
        content: Any,
        memory_type: str = "general",
        importance: float = 0.5,
        tags: Optional[Set[str]] = None,
        links: Optional[Set[str]] = None,
    ) -> Memory:
        """Store a new memory"""
        memory_id = self._generate_id(content)
        
        # Check if exists
        if memory_id in self._memories:
            memory = self._memories[memory_id]
            memory.access()
            return memory
        
        memory = Memory(
            memory_id=memory_id,
            content=content,
            memory_type=memory_type,
            importance=importance,
            tags=tags or set(),
            links=links or set(),
        )
        
        # Generate embedding if embedder available
        if self._embedder:
            content_str = str(content) if not isinstance(content, str) else content
            memory.embedding = await self._embedder(content_str)
        
        self._memories[memory_id] = memory
        
        # Update indices
        self._index_memory(memory)
        
        # Persist if storage available
        if self._storage:
            await self._storage.set(f"memories/{memory_id}", memory.to_dict())
        
        logger.debug(f"Stored memory: {memory_id}")
        return memory
    
    async def recall(
        self,
        memory_id: Optional[str] = None,
        query: Optional[str] = None,
        tags: Optional[Set[str]] = None,
        memory_type: Optional[str] = None,
        limit: int = 10,
    ) -> List[Memory]:
        """Recall memories by ID, query, or filters"""
        
        # Direct recall by ID
        if memory_id:
            memory = self._memories.get(memory_id)
            if memory:
                memory.access()
                return [memory]
            return []
        
        # Filter by tags
        if tags:
            matching_ids = set()
            for tag in tags:
                if tag in self._indices.get("tags", {}):
                    matching_ids.update(self._indices["tags"][tag])
            
            memories = [
                self._memories[mid] for mid in matching_ids
                if mid in self._memories
            ]
        else:
            memories = list(self._memories.values())
        
        # Filter by type
        if memory_type:
            memories = [m for m in memories if m.memory_type == memory_type]
        
        # Semantic search if query provided
        if query and self._embedder:
            query_embedding = await self._embedder(query)
            memories = self._semantic_sort(memories, query_embedding)
        else:
            # Sort by importance and recency
            memories.sort(
                key=lambda m: (m.importance, -time.time() + m.accessed_at),
                reverse=True,
            )
        
        # Mark as accessed
        for memory in memories[:limit]:
            memory.access()
        
        return memories[:limit]
    
    def _semantic_sort(
        self,
        memories: List[Memory],
        query_embedding: List[float],
    ) -> List[Memory]:
        """Sort memories by semantic similarity"""
        def cosine_similarity(a: List[float], b: List[float]) -> float:
            if not a or not b:
                return 0.0
            dot = sum(x * y for x, y in zip(a, b))
            norm_a = sum(x * x for x in a) ** 0.5
            norm_b = sum(x * x for x in b) ** 0.5
            if norm_a == 0 or norm_b == 0:
                return 0.0
            return dot / (norm_a * norm_b)
        
        scored = [
            (m, cosine_similarity(m.embedding or [], query_embedding))
            for m in memories
        ]
        scored.sort(key=lambda x: x[1], reverse=True)
        return [m for m, _ in scored]
    
    def _index_memory(self, memory: Memory):
        """Add memory to indices"""
        # Index by tags
        if "tags" not in self._indices:
            self._indices["tags"] = {}
        
        for tag in memory.tags:
            if tag not in self._indices["tags"]:
                self._indices["tags"][tag] = set()
            self._indices["tags"][tag].add(memory.memory_id)
        
        # Index by type
        if "types" not in self._indices:
            self._indices["types"] = {}
        
        if memory.memory_type not in self._indices["types"]:
            self._indices["types"][memory.memory_type] = set()
        self._indices["types"][memory.memory_type].add(memory.memory_id)
    
    async def link(self, memory_id_a: str, memory_id_b: str) -> bool:
        """Create bidirectional link between memories"""
        mem_a = self._memories.get(memory_id_a)
        mem_b = self._memories.get(memory_id_b)
        
        if not mem_a or not mem_b:
            return False
        
        mem_a.links.add(memory_id_b)
        mem_b.links.add(memory_id_a)
        
        logger.debug(f"Linked: {memory_id_a} <-> {memory_id_b}")
        return True
    
    async def forget(
        self,
        memory_id: Optional[str] = None,
        below_importance: Optional[float] = None,
    ) -> int:
        """Forget specific memory or memories below importance threshold"""
        forgotten = 0
        
        if memory_id:
            if memory_id in self._memories:
                del self._memories[memory_id]
                forgotten = 1
        elif below_importance is not None:
            to_forget = [
                mid for mid, mem in self._memories.items()
                if mem.importance < below_importance
            ]
            for mid in to_forget:
                del self._memories[mid]
            forgotten = len(to_forget)
        
        logger.debug(f"Forgotten {forgotten} memories")
        return forgotten
    
    async def compress(self, memory_ids: List[str], summary: str) -> Memory:
        """Compress multiple memories into a summary"""
        original_contents = []
        original_tags = set()
        
        for mid in memory_ids:
            if mid in self._memories:
                mem = self._memories[mid]
                original_contents.append(mem.content)
                original_tags.update(mem.tags)
        
        # Store compressed memory
        compressed = await self.store(
            content={
                "type": "compressed",
                "summary": summary,
                "original_count": len(original_contents),
                "original_contents": original_contents[:3],  # Keep first 3 for reference
            },
            memory_type="compressed",
            importance=0.7,
            tags=original_tags,
        )
        
        # Link to originals
        for mid in memory_ids:
            await self.link(compressed.memory_id, mid)
        
        return compressed
    
    async def recognize_pattern(
        self,
        pattern_type: str,
        trigger_conditions: Dict[str, Any],
        response_template: Optional[str] = None,
    ) -> Pattern:
        """Register a recognized pattern"""
        pattern_id = f"pat_{hashlib.sha256(json.dumps(trigger_conditions, sort_keys=True).encode()).hexdigest()[:12]}"
        
        if pattern_id in self._patterns:
            pattern = self._patterns[pattern_id]
            pattern.occurrences += 1
            return pattern
        
        pattern = Pattern(
            pattern_id=pattern_id,
            pattern_type=pattern_type,
            trigger_conditions=trigger_conditions,
            response_template=response_template,
        )
        
        self._patterns[pattern_id] = pattern
        logger.debug(f"Recognized pattern: {pattern_id}")
        return pattern
    
    async def match_patterns(self, context: Dict[str, Any]) -> List[Pattern]:
        """Find patterns matching the current context"""
        matches = []
        
        for pattern in self._patterns.values():
            if self._pattern_matches(pattern, context):
                pattern.occurrences += 1
                pattern.last_triggered = time.time()
                matches.append(pattern)
        
        return matches
    
    def _pattern_matches(self, pattern: Pattern, context: Dict[str, Any]) -> bool:
        """Check if pattern matches context"""
        for key, expected in pattern.trigger_conditions.items():
            if key not in context:
                return False
            actual = context[key]
            if isinstance(expected, dict) and "$regex" in expected:
                import re
                if not re.match(expected["$regex"], str(actual)):
                    return False
            elif actual != expected:
                return False
        return True
    
    async def apply_decay(self, time_delta: float = 1.0):
        """Apply decay to all memories"""
        for memory in self._memories.values():
            memory.decay(time_delta)
    
    async def prioritize(self, memory_id: str, boost: float = 0.1) -> bool:
        """Boost memory importance"""
        if memory_id not in self._memories:
            return False
        
        memory = self._memories[memory_id]
        memory.importance = min(1.0, memory.importance + boost)
        return True
    
    def stats(self) -> Dict:
        """Get memory statistics"""
        return {
            "total_memories": len(self._memories),
            "total_patterns": len(self._patterns),
            "by_type": {
                mem_type: len(mids)
                for mem_type, mids in self._indices.get("types", {}).items()
            },
            "avg_importance": (
                sum(m.importance for m in self._memories.values()) / len(self._memories)
                if self._memories else 0.0
            ),
        }


# Global memtool registry
_registry: Optional[MemtoolRegistry] = None


def get_memtools() -> MemtoolRegistry:
    """Get or create global memtool registry"""
    global _registry
    if _registry is None:
        _registry = MemtoolRegistry()
    return _registry
