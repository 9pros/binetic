import asyncio
import logging
import sys
import os

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.discovery import get_discovery_engine, DiscoverySource, DiscoveryMethod
from core.operators import get_operator_registry

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

async def bootstrap():
    """
    Bootstrap the discovery process with high-value public APIs.
    This seeds the AGI with initial capabilities.
    """
    logger.info("🚀 Starting Discovery Bootstrap...")
    
    discovery = get_discovery_engine()
    registry = get_operator_registry()
    
    # 1. Define Seed Sources
    sources = [
        # GitHub API (OpenAPI) - A massive source of capabilities
        DiscoverySource(
            source_id="src_github",
            name="GitHub API",
            base_url="https://api.github.com",
            # GitHub doesn't expose a full OpenAPI spec at a single unauth endpoint easily, 
            # but we can simulate probing or use a known spec URL if we had one.
            # For now, we'll use PROBE to find standard endpoints.
            discovery_method=DiscoveryMethod.PROBE,
            discovery_path="/"
        ),
        
        # HttpBin (Testing) - Good for verifying the engine works
        DiscoverySource(
            source_id="src_httpbin",
            name="HttpBin",
            base_url="https://httpbin.org",
            discovery_method=DiscoveryMethod.OPENAPI,
            discovery_path="/spec.json"
        )
    ]
    
    # 2. Register and Run
    for source in sources:
        logger.info(f"📍 Registering source: {source.name}")
        discovery.register_source(source)
        
        logger.info(f"🔎 Running discovery on: {source.name}")
        capabilities = await discovery.discover_from_source(source)
        
        logger.info(f"✨ Discovered {len(capabilities)} capabilities from {source.name}")
        
        # 3. Convert to Operators (Simple heuristic for now)
        for cap in capabilities:
            # In a real scenario, we'd use an LLM to abstract this.
            # Here we just log it.
            logger.info(f"   - {cap.name} ({cap.method} {cap.endpoint})")

    # 4. Check MCP Availability
    try:
        import mcp
        logger.info("✅ MCP Library is installed. Local tool discovery is enabled.")
    except ImportError:
        logger.warning("❌ MCP Library not found. Run 'pip install mcp' to enable local tools.")

    logger.info("🏁 Bootstrap complete.")

if __name__ == "__main__":
    asyncio.run(bootstrap())
