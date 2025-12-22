"""
Emergent Network - The Substrate Where Intelligence Emerges

The AGI doesn't USE the network - the AGI IS the network.
Intelligence emerges from the collective behavior of reactive slots.
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional, Set, Callable, Awaitable
import hashlib
import time
import asyncio
import logging
import uuid

from .operators import OperatorSignature, OperatorRegistry, get_operator_registry

logger = logging.getLogger(__name__)


class SlotState(Enum):
    """State of a reactive slot"""
    IDLE = "idle"
    LISTENING = "listening"
    PROCESSING = "processing"
    EXECUTING = "executing"
    WAITING = "waiting"
    ERROR = "error"
    STOPPED = "stopped"


class SignalType(Enum):
    """Types of signals slots can send/receive"""
    QUERY = "query"
    RESPONSE = "response"
    BROADCAST = "broadcast"
    HEARTBEAT = "heartbeat"
    DISCOVERY = "discovery"
    OPERATOR_INVOKE = "operator_invoke"
    ERROR = "error"


@dataclass
class Signal:
    """A signal passed between slots"""
    signal_id: str
    signal_type: SignalType
    source_slot: str
    target_slot: Optional[str]
    payload: Dict[str, Any]
    timestamp: float = field(default_factory=time.time)
    ttl: int = 5  # Max hops
    path: List[str] = field(default_factory=list)


@dataclass
class ReactiveSlot:
    """
    A reactive slot - the fundamental unit of the emergent AGI.
    
    Each slot is a micro-agent that:
    - Holds data and state
    - Reacts to incoming signals
    - Executes operators
    - Communicates with other slots
    """
    slot_id: str
    slot_type: str = "generic"
    
    # State
    state: SlotState = SlotState.IDLE
    data: Dict[str, Any] = field(default_factory=dict)
    
    # Operators this slot can invoke
    operator_ids: List[str] = field(default_factory=list)
    
    # Connections to other slots
    connections: Set[str] = field(default_factory=set)
    
    # Signal queue
    signal_queue: List[Signal] = field(default_factory=list)
    
    # Reactive bindings
    bindings: List["ReactiveBinding"] = field(default_factory=list)
    
    # Metadata
    created_at: float = field(default_factory=time.time)
    last_activity: float = field(default_factory=time.time)
    signal_count: int = 0
    error_count: int = 0
    
    def to_dict(self) -> Dict:
        return {
            "slot_id": self.slot_id,
            "type": self.slot_type,
            "state": self.state.value,
            "operators": self.operator_ids,
            "connections": list(self.connections),
            "bindings": len(self.bindings),
            "signals_processed": self.signal_count,
        }


@dataclass
class ReactiveBinding:
    """
    A reactive binding: When trigger matches, execute action.
    """
    binding_id: str
    trigger_pattern: Dict[str, Any]
    action_type: str  # invoke_operator, forward, transform
    action_config: Dict[str, Any]
    
    # Rate limiting
    debounce_ms: int = 0
    throttle_ms: int = 0
    max_invocations: int = -1
    
    # State
    invocation_count: int = 0
    last_invocation: Optional[float] = None
    
    def matches(self, signal: Signal) -> bool:
        """Check if signal matches trigger pattern"""
        pattern = self.trigger_pattern
        
        # Match by signal type
        if "signal_type" in pattern:
            expected = pattern["signal_type"]
            if isinstance(expected, str):
                if signal.signal_type.value != expected:
                    return False
            elif isinstance(expected, list):
                if signal.signal_type.value not in expected:
                    return False
        
        # Match by payload content
        if "payload_contains" in pattern:
            for key, value in pattern["payload_contains"].items():
                if signal.payload.get(key) != value:
                    return False
        
        return True
    
    def can_invoke(self) -> bool:
        """Check rate limits"""
        now = time.time() * 1000
        
        if self.max_invocations >= 0 and self.invocation_count >= self.max_invocations:
            return False
        
        if self.last_invocation:
            if self.throttle_ms > 0:
                if now - self.last_invocation < self.throttle_ms:
                    return False
        
        return True


class EmergentNetwork:
    """
    The substrate where distributed intelligence emerges.
    
    NOT a central controller - just infrastructure.
    Intelligence emerges from collective slot behavior.
    """
    
    def __init__(self, registry: Optional[OperatorRegistry] = None):
        self.registry = registry or get_operator_registry()
        self.slots: Dict[str, ReactiveSlot] = {}
        self._running = False
        self._tasks: List[asyncio.Task] = []
        self._signal_handlers: Dict[str, List[Callable]] = {}
        self._lock = asyncio.Lock()
    
    async def start(self):
        """Start the emergent network"""
        if self._running:
            return
        
        self._running = True
        
        # Start signal processing loop
        self._tasks.append(
            asyncio.create_task(self._signal_loop())
        )
        
        # Start health check loop
        self._tasks.append(
            asyncio.create_task(self._health_loop())
        )
        
        logger.info("Emergent network started")
    
    async def stop(self):
        """Stop the emergent network"""
        self._running = False
        
        for task in self._tasks:
            task.cancel()
            try:
                await task
            except asyncio.CancelledError:
                pass
        
        self._tasks.clear()
        logger.info("Emergent network stopped")
    
    async def create_slot(
        self,
        slot_type: str = "generic",
        operator_ids: List[str] = None,
        data: Dict[str, Any] = None,
    ) -> ReactiveSlot:
        """Create a new reactive slot"""
        slot_id = f"slot_{uuid.uuid4().hex[:12]}"
        
        slot = ReactiveSlot(
            slot_id=slot_id,
            slot_type=slot_type,
            operator_ids=operator_ids or [],
            data=data or {},
            state=SlotState.LISTENING,
        )
        
        async with self._lock:
            self.slots[slot_id] = slot
        
        logger.info(f"Created slot: {slot_id} ({slot_type})")
        return slot
    
    async def connect_slots(self, slot_a: str, slot_b: str):
        """Create bidirectional connection between slots"""
        if slot_a in self.slots and slot_b in self.slots:
            self.slots[slot_a].connections.add(slot_b)
            self.slots[slot_b].connections.add(slot_a)
            logger.debug(f"Connected slots: {slot_a} <-> {slot_b}")
    
    async def add_binding(
        self,
        slot_id: str,
        trigger_pattern: Dict[str, Any],
        action_type: str,
        action_config: Dict[str, Any],
    ) -> Optional[ReactiveBinding]:
        """Add a reactive binding to a slot"""
        if slot_id not in self.slots:
            return None
        
        binding = ReactiveBinding(
            binding_id=f"bind_{uuid.uuid4().hex[:8]}",
            trigger_pattern=trigger_pattern,
            action_type=action_type,
            action_config=action_config,
        )
        
        self.slots[slot_id].bindings.append(binding)
        return binding
    
    async def send_signal(self, signal: Signal):
        """Send a signal into the network"""
        # Add to target slot's queue
        if signal.target_slot:
            if signal.target_slot in self.slots:
                self.slots[signal.target_slot].signal_queue.append(signal)
        else:
            # Broadcast to connected slots from source
            if signal.source_slot in self.slots:
                source = self.slots[signal.source_slot]
                for conn_id in source.connections:
                    if conn_id in self.slots:
                        # Clone signal for each target
                        sig_copy = Signal(
                            signal_id=signal.signal_id,
                            signal_type=signal.signal_type,
                            source_slot=signal.source_slot,
                            target_slot=conn_id,
                            payload=signal.payload.copy(),
                            ttl=signal.ttl - 1,
                            path=signal.path + [signal.source_slot],
                        )
                        self.slots[conn_id].signal_queue.append(sig_copy)
    
    async def invoke_operator(
        self,
        slot_id: str,
        operator_id: str,
        inputs: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Invoke an operator from a slot context"""
        if slot_id not in self.slots:
            return {"success": False, "error": "Slot not found"}
        
        slot = self.slots[slot_id]
        
        # Check if slot has access to this operator
        if operator_id not in slot.operator_ids:
            # Try to add it
            slot.operator_ids.append(operator_id)
        
        slot.state = SlotState.EXECUTING
        slot.last_activity = time.time()
        
        try:
            result = await self.registry.invoke(operator_id, inputs)
            slot.state = SlotState.LISTENING
            return {
                "success": result.success,
                "outputs": result.outputs,
                "latency_ms": result.latency_ms,
                "error": result.error,
            }
        except Exception as e:
            slot.state = SlotState.ERROR
            slot.error_count += 1
            return {"success": False, "error": str(e)}
    
    async def _signal_loop(self):
        """Process signals for all slots"""
        while self._running:
            try:
                for slot in list(self.slots.values()):
                    if slot.signal_queue and slot.state in (SlotState.LISTENING, SlotState.IDLE):
                        signal = slot.signal_queue.pop(0)
                        await self._process_signal(slot, signal)
                
                await asyncio.sleep(0.01)  # 10ms tick
            except Exception as e:
                logger.error(f"Signal loop error: {e}")
    
    async def _process_signal(self, slot: ReactiveSlot, signal: Signal):
        """Process a signal for a slot"""
        slot.state = SlotState.PROCESSING
        slot.signal_count += 1
        slot.last_activity = time.time()
        
        try:
            # Check bindings
            for binding in slot.bindings:
                if binding.matches(signal) and binding.can_invoke():
                    await self._execute_binding(slot, binding, signal)
                    binding.invocation_count += 1
                    binding.last_invocation = time.time() * 1000
            
            slot.state = SlotState.LISTENING
        except Exception as e:
            logger.error(f"Signal processing error in {slot.slot_id}: {e}")
            slot.state = SlotState.ERROR
            slot.error_count += 1
    
    async def _execute_binding(self, slot: ReactiveSlot, binding: ReactiveBinding, signal: Signal):
        """Execute a binding action"""
        action = binding.action_type
        config = binding.action_config
        
        if action == "invoke_operator":
            operator_id = config.get("operator_id")
            if operator_id:
                inputs = {**signal.payload, **config.get("extra_inputs", {})}
                await self.invoke_operator(slot.slot_id, operator_id, inputs)
        
        elif action == "forward":
            target = config.get("target_slot")
            if target:
                new_signal = Signal(
                    signal_id=f"fwd_{signal.signal_id}",
                    signal_type=signal.signal_type,
                    source_slot=slot.slot_id,
                    target_slot=target,
                    payload=signal.payload,
                    ttl=signal.ttl - 1,
                    path=signal.path + [slot.slot_id],
                )
                await self.send_signal(new_signal)
        
        elif action == "transform":
            transform_fn = config.get("transform")
            if callable(transform_fn):
                signal.payload = transform_fn(signal.payload)
    
    async def _health_loop(self):
        """Periodic health check for slots"""
        while self._running:
            try:
                now = time.time()
                
                for slot in list(self.slots.values()):
                    # Reset error state if healthy
                    if slot.state == SlotState.ERROR:
                        if now - slot.last_activity > 60:  # 1 minute timeout
                            slot.state = SlotState.LISTENING
                            slot.error_count = 0
                    
                    # Mark inactive slots
                    if now - slot.last_activity > 300:  # 5 minute timeout
                        if slot.state == SlotState.LISTENING:
                            slot.state = SlotState.IDLE
                
                await asyncio.sleep(10)  # Check every 10 seconds
            except Exception as e:
                logger.error(f"Health loop error: {e}")
    
    def get_state(self) -> Dict[str, Any]:
        """Get current network state"""
        states = {}
        for state in SlotState:
            states[state.value] = sum(1 for s in self.slots.values() if s.state == state)
        
        total_connections = sum(len(s.connections) for s in self.slots.values()) // 2
        
        return {
            "running": self._running,
            "slots": len(self.slots),
            "connections": total_connections,
            "operators": len(self.registry._operators) if hasattr(self.registry, '_operators') else 0,
            "states": states,
        }
    
    def to_dict(self) -> Dict[str, Any]:
        """Serialize network state"""
        return {
            **self.get_state(),
            "slot_details": [s.to_dict() for s in self.slots.values()],
        }


# Global network instance
_network: Optional[EmergentNetwork] = None


def get_emergent_network() -> EmergentNetwork:
    """Get or create global emergent network"""
    global _network
    if _network is None:
        _network = EmergentNetwork()
    return _network
