"""
Binetic Core - Core Intelligence Module

Contains the emergent AGI systems:
- Operators: Composable logic units
- Network: Distributed intelligence substrate
- Memtools: Reactive memory tools
- Discovery: Capability discovery
- Brain: Central coordinator
"""

from .operators import (
    OperatorType,
    OperatorSignature,
    OperatorRegistry,
    OperatorDiscovery,
    OperatorPipeline,
    get_operator_registry,
)
from .network import (
    EmergentNetwork,
    ReactiveSlot,
    ReactiveBinding,
    Signal,
    SlotState,
    get_network,
)
from .memtools import (
    MemtoolRegistry,
    MemtoolType,
    Memory,
    Pattern,
    get_memtools,
)
from .discovery import (
    DiscoveryEngine,
    DiscoverySource,
    DiscoveryMethod,
    Capability,
    CapabilityType,
    get_discovery_engine,
)
from .brain import (
    Brain,
    BrainState,
    Thought,
    ThoughtType,
    Goal,
    get_brain,
)

__all__ = [
    # Operators
    "OperatorType",
    "OperatorSignature",
    "OperatorRegistry",
    "OperatorDiscovery",
    "OperatorPipeline",
    "get_operator_registry",
    # Network
    "EmergentNetwork",
    "ReactiveSlot",
    "ReactiveBinding",
    "Signal",
    "SlotState",
    "get_network",
    # Memtools
    "MemtoolRegistry",
    "MemtoolType",
    "Memory",
    "Pattern",
    "get_memtools",
    # Discovery
    "DiscoveryEngine",
    "DiscoverySource",
    "DiscoveryMethod",
    "Capability",
    "CapabilityType",
    "get_discovery_engine",
    # Brain
    "Brain",
    "BrainState",
    "Thought",
    "ThoughtType",
    "Goal",
    "get_brain",
]
