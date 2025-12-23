
import asyncio
import logging
import os
import sys

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.discovery import get_discovery_engine, DiscoverySource, DiscoveryMethod
from core.brain import get_brain

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("internet-discovery")

async def main():
    print("Initializing Binetic Internet Discovery via MCP...")
    
    # Get the discovery engine
    engine = get_discovery_engine()
    
    # Define an MCP source for Internet Search (e.g., Brave Search)
    # This assumes the user has the Brave Search MCP server available via npx
    # and a BRAVE_API_KEY environment variable.
    
    brave_api_key = os.environ.get("BRAVE_API_KEY")
    if not brave_api_key:
        print("WARNING: BRAVE_API_KEY not found in environment.")
        print("Please set it to use Brave Search for internet discovery.")
        # We continue to show how it's set up, but it might fail if run without key.
    
    # Example: Using npx to run the Brave Search MCP server
    # Note: This requires Node.js and npx to be installed.
    mcp_source = DiscoverySource(
        source_id="mcp-brave-search",
        name="Brave Search MCP",
        base_url="npx -y @modelcontextprotocol/server-brave-search", # Command to run
        discovery_method=DiscoveryMethod.MCP,
        auth_credentials={
            "BRAVE_API_KEY": brave_api_key or "placeholder"
        },
        refresh_interval=3600
    )
    
    print(f"Registering source: {mcp_source.name}")
    engine.register_source(mcp_source)
    
    print("Starting discovery...")
    results = await engine.discover_all()
    
    print("\nDiscovery Results:")
    for source_id, caps in results.items():
        print(f"Source: {source_id}")
        for cap in caps:
            print(f"  - [{cap.capability_type.value}] {cap.name}: {cap.description[:50]}...")
            
    print("\nInternet Discovery Setup Complete.")
    print("The Brain can now utilize these capabilities for horizontal mapping.")

if __name__ == "__main__":
    asyncio.run(main())
