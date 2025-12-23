
import asyncio
import logging
import os
import sys
import json

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.brain import get_brain
from core.discovery import get_discovery_engine, DiscoverySource, DiscoveryMethod, Capability, CapabilityType
from core.operators import get_operator_registry

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("exploration-executor")

async def main():
    print("\n" + "="*60)
    print("🚀 EXECUTING HORIZONTAL EXPLORATION & ABSTRACTION")
    print("="*60 + "\n")
    
    # 1. Initialize Brain
    print("[1] Initializing Brain...")
    brain = await get_brain()
    print("    ✓ Brain initialized")
    print("    ✓ Network started")
    print("    ✓ Core slots created")
    
    # 2. Simulate Horizontal Exploration (Discovery)
    # In a real scenario, this would connect to live MCP servers.
    # Here we simulate discovering a set of diverse tools to test the abstraction logic.
    print("\n[2] Simulating Horizontal Exploration...")
    
    engine = get_discovery_engine()
    
    # Mock Source 1: Internet Search
    search_source = DiscoverySource(
        source_id="src_internet",
        name="Global Internet Search",
        base_url="https://api.search.mock",
        discovery_method=DiscoveryMethod.MANIFEST
    )
    
    # Mock Source 2: Local Filesystem
    fs_source = DiscoverySource(
        source_id="src_local_fs",
        name="Local Filesystem",
        base_url="file://local",
        discovery_method=DiscoveryMethod.MANIFEST
    )
    
    engine.register_source(search_source)
    engine.register_source(fs_source)
    
    # Inject mock capabilities directly to simulate successful discovery
    # (Bypassing actual HTTP/MCP calls for this demo)
    
    mock_caps = [
        Capability(
            capability_id="cap_search_web",
            name="brave_web_search",
            capability_type=CapabilityType.TOOL,
            endpoint="mcp://brave",
            method="MCP",
            description="Search the web for information using Brave Search.",
            input_schema={"type": "object", "properties": {"q": {"type": "string"}}},
            source="src_internet",
            discovery_method=DiscoveryMethod.MCP
        ),
        Capability(
            capability_id="cap_fs_read",
            name="read_file",
            capability_type=CapabilityType.TOOL,
            endpoint="mcp://fs",
            method="MCP",
            description="Read the contents of a file from the local filesystem.",
            input_schema={"type": "object", "properties": {"path": {"type": "string"}}},
            source="src_local_fs",
            discovery_method=DiscoveryMethod.MCP
        ),
        Capability(
            capability_id="cap_fs_write",
            name="write_file",
            capability_type=CapabilityType.TOOL,
            endpoint="mcp://fs",
            method="MCP",
            description="Write content to a file on the local filesystem.",
            input_schema={"type": "object", "properties": {"path": {"type": "string"}, "content": {"type": "string"}}},
            source="src_local_fs",
            discovery_method=DiscoveryMethod.MCP
        ),
        Capability(
            capability_id="cap_notify",
            name="send_notification",
            capability_type=CapabilityType.TOOL,
            endpoint="https://api.notify.com",
            method="POST",
            description="Send a push notification to the user.",
            input_schema={"type": "object", "properties": {"message": {"type": "string"}}},
            source="src_internet",
            discovery_method=DiscoveryMethod.OPENAPI
        )
    ]
    
    print(f"    ✓ Discovered {len(mock_caps)} raw capabilities")
    
    # 3. Execute Abstraction (Brain Processing)
    print("\n[3] Executing Abstraction (Brain Processing)...")
    print("    The Brain is now analyzing raw capabilities and converting them to logical Operators.")
    
    for cap in mock_caps:
        # Manually trigger the hook since we bypassed the engine's loop
        await brain._on_capability_discovered(cap)
        # Small delay to simulate processing
        await asyncio.sleep(0.1)
        
    # 4. Verify Results
    print("\n[4] Abstraction Results (Operator Registry):")
    
    registry = get_operator_registry()
    operators = await registry.list_all()
    
    print(f"    Total Operators: {len(operators)}")
    print("-" * 60)
    print(f"{'OPERATOR ID':<30} | {'TYPE':<15} | {'SIDE EFFECTS':<12} | {'SOURCE'}")
    print("-" * 60)
    
    for op in operators:
        source = op.headers.get('x-source', 'unknown')
        print(f"{op.operator_id:<30} | {op.operator_type.value:<15} | {str(op.side_effects):<12} | {source}")
        
    print("-" * 60)
    
    # 5. Demonstrate Usage
    print("\n[5] Ready for Action")
    print("    The system has successfully mapped the environment and abstracted tools into operators.")
    print("    These operators are now available for the Brain to plan and execute tasks.")

if __name__ == "__main__":
    asyncio.run(main())
