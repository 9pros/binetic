import asyncio
import httpx
import json
import sys
import time

BASE_URL = "http://localhost:8000/api"

async def main():
    print(f"🔌 Connecting to Binetic Brain at {BASE_URL}...")
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        # 1. Check Health
        try:
            resp = await client.get(f"{BASE_URL}/health")
            print(f"✅ Health Check: {resp.status_code}")
            if resp.status_code != 200:
                print(f"❌ Server not healthy: {resp.text}")
                return
        except Exception as e:
            print(f"❌ Could not connect to server: {e}")
            return

        # 2. Trigger Discovery
        print("\n🔎 Triggering Discovery Protocol...")
        try:
            resp = await client.post(f"{BASE_URL}/discovery/discover")
            if resp.status_code == 200:
                data = resp.json()
                # Handle wrapped response
                if "data" in data:
                    data = data["data"]
                
                print(f"✅ Discovery Complete!")
                print(f"   Sources Probed: {data.get('sources_probed', 'N/A')}")
                print(f"   Total Capabilities: {data.get('total_capabilities', 'N/A')}")
            else:
                print(f"❌ Discovery Failed: {resp.status_code} - {resp.text}")
        except Exception as e:
            print(f"❌ Discovery Error: {e}")

        # 3. List Capabilities
        print("\n🧠 Fetching Neural Topology (Capabilities)...")
        try:
            resp = await client.get(f"{BASE_URL}/discovery/capabilities")
            if resp.status_code == 200:
                data = resp.json()
                if "data" in data:
                    data = data["data"]
                
                caps = data.get("capabilities", [])
                print(f"✅ Found {len(caps)} Neurons:")
                
                for cap in caps:
                    status = "🟢" if cap.get("is_healthy") else "🔴"
                    print(f"   {status} [{cap.get('capability_type')}] {cap.get('name')}")
                    print(f"      ID: {cap.get('capability_id')}")
                    print(f"      Source: {cap.get('source')}")
                    print(f"      Endpoint: {cap.get('endpoint')}")
                    print("")
            else:
                print(f"❌ Failed to list capabilities: {resp.status_code}")
        except Exception as e:
            print(f"❌ List Error: {e}")

if __name__ == "__main__":
    asyncio.run(main())
