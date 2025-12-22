import asyncio
import json
import logging
import uuid
from dataclasses import asdict
from typing import Any, Dict, List

from mcp.server.fastmcp import FastMCP

# Import Binetic Core
from core.brain import get_brain, Thought, ThoughtType
from core.network import get_network
from core.operators import get_operator_registry
from core.discovery import get_discovery_engine

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("binetic-mcp")

# Initialize FastMCP
mcp = FastMCP("Binetic AGI Control Plane")

@mcp.resource("binetic://brain/status")
async def get_brain_status() -> str:
    """Get the current status of the Brain (goals, thoughts, state)."""
    brain = await get_brain()
    
    # Helper to serialize dataclasses
    def serialize(obj):
        if hasattr(obj, '__dict__'):
            return asdict(obj)
        return str(obj)

    status = {
        "state": brain.state.value,
        "goals": [asdict(g) for g in brain.goals],
        "recent_thoughts": [asdict(t) for t in brain.thoughts[-10:]], # Last 10 thoughts
        "stats": brain.stats()
    }
    # Use default=str to handle non-serializable objects in content
    return json.dumps(status, indent=2, default=str)

@mcp.resource("binetic://network/slots")
async def get_network_slots() -> str:
    """Get the list of active Network Slots (micro-agents)."""
    network = await get_network()
    slots = []
    # Access private _slots if public property doesn't exist, or use network.slots if available
    # core/network.py usually has _slots. Let's check if there is a public accessor.
    # Assuming network.slots is available or we access _slots
    # Based on previous read of brain.py, it accessed self.network._slots in stats()
    # So we might need to access _slots directly if no property exists.
    # But let's try to be safe.
    slot_dict = getattr(network, "slots", getattr(network, "_slots", {}))
    
    for slot_id, slot in slot_dict.items():
        slots.append({
            "id": slot_id,
            "type": getattr(slot, "slot_type", "generic"),
            "status": getattr(slot.state, "value", str(slot.state)),
            "signals": getattr(slot, "signal_count", 0),
            "last_activity": getattr(slot, "last_activity", 0.0)
        })
    return json.dumps(slots, indent=2)

@mcp.resource("binetic://operators/list")
async def list_operators_resource() -> str:
    """List all registered operators."""
    registry = await get_operator_registry()
    ops = registry.list_operators()
    return json.dumps([asdict(op) for op in ops], indent=2, default=str)

@mcp.tool()
async def add_thought(content: str, type: str = "observation") -> str:
    """Inject a thought into the Brain's working memory.
    
    Args:
        content: The text content of the thought.
        type: The type of thought (query, command, observation, reflection, planning, learning).
    """
    brain = await get_brain()
    
    # Map string type to Enum
    try:
        thought_type = ThoughtType(type.lower())
    except ValueError:
        thought_type = ThoughtType.OBSERVATION
        
    thought = Thought(
        thought_id=str(uuid.uuid4()),
        thought_type=thought_type,
        content=content
    )
    
    result = await brain.think(thought)
    return f"Thought processed: {thought.thought_id}. Result: {result}"

@mcp.tool()
async def execute_operator(name: str, params: Dict[str, Any]) -> str:
    """Execute a specific operator by name.
    
    Args:
        name: The name of the operator (e.g., 'http.get').
        params: Dictionary of arguments for the operator.
    """
    registry = await get_operator_registry()
    try:
        result = await registry.execute(name, params)
        return json.dumps(result, indent=2, default=str)
    except Exception as e:
        return f"Error executing operator {name}: {str(e)}"

@mcp.tool()
async def scan_discovery_source(url: str) -> str:
    """Trigger the Discovery Engine to scan a new source URL.
    
    Args:
        url: The base URL to scan for capabilities.
    """
    discovery = await get_discovery_engine()
    try:
        # Check if discover_source exists, otherwise use discover_all placeholder
        if hasattr(discovery, "discover_source"):
            await discovery.discover_source(url)
            return f"Discovery scan initiated for {url}."
        else:
            return "Discovery engine does not support single source scan yet."
    except Exception as e:
        return f"Discovery failed: {str(e)}"

@mcp.prompt()
def analyze_system_health() -> str:
    """Analyze the overall health of the Binetic system."""
    return """You are analyzing the Binetic AGI system health.
    
Please check the following resources:
1. binetic://brain/status - To see if the brain is overloaded or stuck.
2. binetic://network/slots - To see if slots are active and healthy.
3. binetic://operators/list - To ensure operators are registered.

Report on:
- Any bottlenecks in the brain.
- Network slot utilization.
- Recommendations for scaling or intervention.
"""

if __name__ == "__main__":
    # Run the MCP server
    mcp.run()
