"""
Brain - Central Intelligence Coordinator

The emergent intelligence core that orchestrates all subsystems.
"""

from dataclasses import dataclass, field
from typing import Any, Callable, Dict, List, Optional, Set
from enum import Enum
import time
import logging
import asyncio

from .operators import OperatorRegistry, OperatorType, OperatorSignature, get_operator_registry
from .network import EmergentNetwork, ReactiveSlot, Signal, get_network
from .memtools import MemtoolRegistry, get_memtools
from .discovery import DiscoveryEngine, Capability, CapabilityType, get_discovery_engine

logger = logging.getLogger(__name__)


class BrainState(Enum):
    """Brain operational states"""
    INITIALIZING = "initializing"
    LEARNING = "learning"
    READY = "ready"
    PROCESSING = "processing"
    ADAPTING = "adapting"
    SUSPENDED = "suspended"
    ERROR = "error"


class ThoughtType(Enum):
    """Types of thoughts/processes"""
    QUERY = "query"           # Information request
    COMMAND = "command"       # Action request
    OBSERVATION = "observation"  # Input from environment
    REFLECTION = "reflection"  # Internal analysis
    PLANNING = "planning"      # Future action planning
    LEARNING = "learning"      # Pattern recognition


@dataclass
class Thought:
    """A unit of processing in the brain"""
    thought_id: str
    thought_type: ThoughtType
    content: Any
    
    # Processing
    created_at: float = field(default_factory=time.time)
    processed_at: Optional[float] = None
    result: Optional[Any] = None
    
    # Context
    context: Dict[str, Any] = field(default_factory=dict)
    source: str = "external"
    
    # Chain
    parent_thought: Optional[str] = None
    child_thoughts: List[str] = field(default_factory=list)


@dataclass
class Goal:
    """A goal the brain is working toward"""
    goal_id: str
    description: str
    
    # Progress
    priority: float = 0.5
    progress: float = 0.0
    is_complete: bool = False
    
    # Sub-goals
    sub_goals: List[str] = field(default_factory=list)
    
    # Metrics
    created_at: float = field(default_factory=time.time)
    completed_at: Optional[float] = None


class Brain:
    """
    Central intelligence coordinator.
    
    Orchestrates operators, network, memory, and discovery
    to create emergent intelligent behavior.
    """
    
    def __init__(
        self,
        operators: Optional[OperatorRegistry] = None,
        network: Optional[EmergentNetwork] = None,
        memtools: Optional[MemtoolRegistry] = None,
        discovery: Optional[DiscoveryEngine] = None,
    ):
        self.operators = operators or get_operator_registry()
        self.network = network or get_network()
        self.memtools = memtools or get_memtools()
        self.discovery = discovery or get_discovery_engine()
        
        self._state = BrainState.INITIALIZING
        self._thoughts: Dict[str, Thought] = {}
        self._goals: Dict[str, Goal] = {}
        
        # Processing
        self._thought_queue: asyncio.Queue = asyncio.Queue()
        self._processors: List[Callable] = []
        
        # Learning
        self._learning_rate: float = 0.1
        self._pattern_threshold: float = 0.7
        
        # Metrics
        self._total_thoughts: int = 0
        self._successful_thoughts: int = 0
        self._start_time: float = time.time()
    
    async def initialize(self):
        """Initialize the brain and all subsystems"""
        logger.info("Brain initializing...")
        
        # Register discovery hook to promote capabilities to operators
        self.discovery.on_discovery(self._on_capability_discovered)
        
        # Start network signal processing
        await self.network.start()
        
        # Run initial discovery
        await self.discovery.discover_all()
        
        # Create core slots for brain functions
        await self._create_core_slots()
        
        self._state = BrainState.READY
        logger.info("Brain ready")
    
    async def _on_capability_discovered(self, capability: Capability):
        """Promote discovered capability to operator with semantic abstraction"""
        # Only promote executable capabilities
        if capability.capability_type not in [CapabilityType.TOOL, CapabilityType.FUNCTION, CapabilityType.REST_API]:
            return

        # Abstraction: Convert raw capability to logical operator
        # 1. Heuristic Classification (Fast System 1)
        op_type = OperatorType.COMPUTE # Default
        side_effects = True
        
        name_lower = capability.name.lower()
        desc_lower = capability.description.lower()
        
        if "search" in name_lower or "find" in name_lower or "query" in name_lower:
            op_type = OperatorType.SEARCH
            side_effects = False
        elif "store" in name_lower or "save" in name_lower or "write" in name_lower or "upload" in name_lower:
            op_type = OperatorType.STORE
            side_effects = True
        elif "read" in name_lower or "get" in name_lower or "fetch" in name_lower or "download" in name_lower:
            op_type = OperatorType.RETRIEVE
            side_effects = False
        elif "send" in name_lower or "notify" in name_lower or "broadcast" in name_lower:
            op_type = OperatorType.BROADCAST
            side_effects = True
        elif "embed" in name_lower:
            op_type = OperatorType.EMBED
            side_effects = False
            
        # 2. Semantic Refinement (System 2 - Future: Use LLM here)
        # If we had an active LLM operator, we would ask it to verify this classification.
        
        # Create OperatorSignature
        op = OperatorSignature(
            operator_id=capability.capability_id,
            operator_type=op_type,
            endpoint_url=capability.endpoint,
            method=capability.method,
            request_template=capability.input_schema,
            response_schema=capability.output_schema,
            discovered_at=capability.discovered_at,
            side_effects=side_effects,
            headers={
                "x-source": capability.source, 
                "x-discovery-method": capability.discovery_method.value,
                "x-tool-name": capability.name
            }
        )
        
        await self.operators.register(op)
        logger.info(f"Abstracted {capability.name} -> {op.operator_type.value} (Side Effects: {side_effects})")

    async def _create_core_slots(self):
        """Create core processing slots"""
        
        # Query processing slot
        query_slot = ReactiveSlot(slot_id="brain_query")
        query_slot.operators = [OperatorType.FILTER, OperatorType.TRANSFORM, OperatorType.AGGREGATE]
        self.network.register_slot(query_slot)
        
        # Command execution slot
        command_slot = ReactiveSlot(slot_id="brain_command")
        command_slot.operators = [OperatorType.FILTER, OperatorType.COMPUTE]
        self.network.register_slot(command_slot)
        
        # Learning slot
        learning_slot = ReactiveSlot(slot_id="brain_learning")
        learning_slot.operators = [OperatorType.RETRIEVE, OperatorType.INFER]
        self.network.register_slot(learning_slot)
        
        # Connect slots
        await self.network.connect_slots("brain_query", "brain_learning")
        await self.network.connect_slots("brain_command", "brain_learning")
    
    async def think(self, thought: Thought) -> Any:
        """Process a thought"""
        self._total_thoughts += 1
        self._thoughts[thought.thought_id] = thought
        self._state = BrainState.PROCESSING
        
        try:
            # Store thought in memory
            await self.memtools.store(
                content={
                    "type": "thought",
                    "thought_type": thought.thought_type.value,
                    "content": thought.content,
                },
                memory_type="thought",
                tags={"thought", thought.thought_type.value},
            )
            
            # Route based on thought type
            if thought.thought_type == ThoughtType.QUERY:
                result = await self._process_query(thought)
            elif thought.thought_type == ThoughtType.COMMAND:
                result = await self._process_command(thought)
            elif thought.thought_type == ThoughtType.OBSERVATION:
                result = await self._process_observation(thought)
            elif thought.thought_type == ThoughtType.REFLECTION:
                result = await self._process_reflection(thought)
            elif thought.thought_type == ThoughtType.PLANNING:
                result = await self._process_planning(thought)
            elif thought.thought_type == ThoughtType.LEARNING:
                result = await self._process_learning(thought)
            else:
                result = {"error": "Unknown thought type"}
            
            thought.result = result
            thought.processed_at = time.time()
            self._successful_thoughts += 1
            
            # Learn from successful thought
            await self._learn_from_thought(thought)
            
            return result
            
        except Exception as e:
            logger.error(f"Thought processing error: {e}")
            thought.result = {"error": str(e)}
            thought.processed_at = time.time()
            return thought.result
        finally:
            self._state = BrainState.READY
    
    async def _process_query(self, thought: Thought) -> Any:
        """Process a query thought"""
        query = thought.content
        
        # Search memory first
        memories = await self.memtools.recall(
            query=str(query) if isinstance(query, str) else None,
            limit=5,
        )
        
        # Search capabilities
        capabilities = self.discovery.search_capabilities(
            name=str(query) if isinstance(query, str) else None,
            healthy_only=True,
        )
        
        # Send through network
        signal = Signal(
            signal_id=f"sig_{thought.thought_id}",
            signal_type="query",
            payload={"query": query, "memories": [m.to_dict() for m in memories]},
            source="brain_query",
        )
        await self.network.emit(signal)
        
        return {
            "query": query,
            "memory_results": len(memories),
            "capabilities_found": len(capabilities),
            "memories": [m.content for m in memories[:3]],
        }
    
    async def _process_command(self, thought: Thought) -> Any:
        """Process a command thought"""
        command = thought.content
        
        # Validate command
        validate_op = self.operators.get("validate")
        if validate_op:
            validation = await self.operators.invoke("validate", command)
            if not validation.get("valid", True):
                return {"error": "Command validation failed", "details": validation}
        
        # Execute command
        execute_op = self.operators.get("execute")
        if execute_op:
            result = await self.operators.invoke("execute", command)
            return result
        
        return {"status": "command_received", "command": command}
    
    async def _process_observation(self, thought: Thought) -> Any:
        """Process an observation thought"""
        observation = thought.content
        
        # Store observation
        memory = await self.memtools.store(
            content=observation,
            memory_type="observation",
            importance=0.6,
            tags={"observation"},
        )
        
        # Check for patterns
        patterns = await self.memtools.match_patterns(
            {"type": "observation", "content": observation}
        )
        
        # Signal observation to network
        signal = Signal(
            signal_id=f"sig_{thought.thought_id}",
            signal_type="observation",
            payload=observation,
            source="external",
        )
        await self.network.emit(signal)
        
        return {
            "observed": True,
            "memory_id": memory.memory_id,
            "patterns_matched": len(patterns),
        }
    
    async def _process_reflection(self, thought: Thought) -> Any:
        """Process a reflection thought"""
        # Analyze recent thoughts
        recent_thoughts = sorted(
            self._thoughts.values(),
            key=lambda t: t.created_at,
            reverse=True,
        )[:10]
        
        # Check thought patterns
        thought_types = {}
        for t in recent_thoughts:
            tt = t.thought_type.value
            thought_types[tt] = thought_types.get(tt, 0) + 1
        
        # Calculate success rate
        success_rate = (
            self._successful_thoughts / self._total_thoughts
            if self._total_thoughts > 0 else 1.0
        )
        
        # Memory stats
        memory_stats = self.memtools.stats()
        
        return {
            "total_thoughts": self._total_thoughts,
            "success_rate": success_rate,
            "thought_distribution": thought_types,
            "memory_stats": memory_stats,
            "uptime_seconds": time.time() - self._start_time,
        }
    
    async def _process_planning(self, thought: Thought) -> Any:
        """Process a planning thought"""
        plan_request = thought.content
        
        # Get current goals
        active_goals = [g for g in self._goals.values() if not g.is_complete]
        
        # Search for relevant capabilities
        capabilities = self.discovery.search_capabilities(
            healthy_only=True,
        )
        
        # Recall relevant memories
        memories = await self.memtools.recall(
            tags={"plan", "goal"},
            limit=5,
        )
        
        return {
            "planning_context": plan_request,
            "active_goals": len(active_goals),
            "available_capabilities": len(capabilities),
            "relevant_memories": len(memories),
        }
    
    async def _process_learning(self, thought: Thought) -> Any:
        """Process a learning thought"""
        self._state = BrainState.LEARNING
        
        learning_content = thought.content
        
        # Recognize patterns
        pattern = await self.memtools.recognize_pattern(
            pattern_type="learned",
            trigger_conditions=learning_content.get("trigger", {}),
            response_template=learning_content.get("response"),
        )
        
        # Store learning
        memory = await self.memtools.store(
            content=learning_content,
            memory_type="learning",
            importance=0.8,
            tags={"learning", "pattern"},
        )
        
        self._state = BrainState.READY
        
        return {
            "learned": True,
            "pattern_id": pattern.pattern_id,
            "memory_id": memory.memory_id,
        }
    
    async def _learn_from_thought(self, thought: Thought):
        """Extract learnings from processed thought"""
        if thought.result and not isinstance(thought.result, dict):
            return
        
        if thought.result and thought.result.get("error"):
            return
        
        # Store successful thought pattern
        processing_time = (thought.processed_at or time.time()) - thought.created_at
        
        await self.memtools.store(
            content={
                "thought_type": thought.thought_type.value,
                "input_summary": str(thought.content)[:100],
                "processing_time": processing_time,
                "success": True,
            },
            memory_type="thought_pattern",
            importance=0.4,
            tags={"thought_pattern", thought.thought_type.value},
        )
    
    async def set_goal(self, goal: Goal):
        """Set a new goal"""
        self._goals[goal.goal_id] = goal
        
        await self.memtools.store(
            content={"goal_id": goal.goal_id, "description": goal.description},
            memory_type="goal",
            importance=goal.priority,
            tags={"goal"},
        )
        
        logger.info(f"Goal set: {goal.description}")
    
    async def complete_goal(self, goal_id: str):
        """Mark a goal as complete"""
        if goal_id in self._goals:
            goal = self._goals[goal_id]
            goal.is_complete = True
            goal.completed_at = time.time()
            goal.progress = 1.0
            logger.info(f"Goal completed: {goal.description}")
    
    async def adapt(self):
        """Trigger adaptation based on experience"""
        self._state = BrainState.ADAPTING
        
        try:
            # Analyze patterns
            patterns = await self.memtools.recall(
                tags={"thought_pattern"},
                limit=100,
            )
            
            # Apply memory decay
            await self.memtools.apply_decay(1.0)
            
            # Forget low-importance memories
            forgotten = await self.memtools.forget(below_importance=0.1)
            
            # Re-run discovery
            await self.discovery.discover_all()
            
            logger.info(f"Adaptation complete. Forgotten {forgotten} memories.")
            
        finally:
            self._state = BrainState.READY
    
    async def suspend(self):
        """Suspend brain operations"""
        self._state = BrainState.SUSPENDED
        await self.network.stop()
        logger.info("Brain suspended")
    
    async def resume(self):
        """Resume brain operations"""
        await self.network.start()
        self._state = BrainState.READY
        logger.info("Brain resumed")
    
    @property
    def thoughts(self) -> List[Thought]:
        return list(self._thoughts.values())

    @property
    def goals(self) -> List[Goal]:
        return list(self._goals.values())

    @property
    def state(self) -> BrainState:
        return self._state
    
    def stats(self) -> Dict:
        """Get brain statistics"""
        return {
            "state": self._state.value,
            "uptime_seconds": time.time() - self._start_time,
            "total_thoughts": self._total_thoughts,
            "successful_thoughts": self._successful_thoughts,
            "success_rate": (
                self._successful_thoughts / self._total_thoughts
                if self._total_thoughts > 0 else 1.0
            ),
            "active_goals": len([g for g in self._goals.values() if not g.is_complete]),
            "completed_goals": len([g for g in self._goals.values() if g.is_complete]),
            "memory_stats": self.memtools.stats(),
            "network_stats": {
                "slots": len(self.network._slots),
            },
            "discovery_stats": self.discovery.stats(),
        }


# Global brain instance
_brain: Optional[Brain] = None


async def get_brain() -> Brain:
    """Get or create global brain instance"""
    global _brain
    if _brain is None:
        _brain = Brain()
        await _brain.initialize()
    return _brain
