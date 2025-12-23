#!/bin/bash

# Binetic AGI - All-in-One Start Script

echo "🧬 Starting Binetic AGI..."

# 1. Check for Python Environment
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 could not be found."
    exit 1
fi

# 2. Kill existing server if running
echo "🔄 Stopping any existing server instances..."
pkill -f "python3 server.py" || true
sleep 2

# 3. Start Python Core (The Brain)
echo "🧠 Starting Python Core (Backend)..."
nohup python3 server.py > server.log 2>&1 &
SERVER_PID=$!
echo "   ✅ Server running (PID: $SERVER_PID)"

# 4. Start Cloudflare Tunnel (Connectivity)
# Note: This assumes cloudflared is installed and configured
if command -v cloudflared &> /dev/null; then
    echo "🚇 Starting Cloudflare Tunnel..."
    # We don't start it here because it usually requires a specific run command or is already running as a service.
    # But we'll check if it's running.
    if pgrep -x "cloudflared" > /dev/null; then
        echo "   ✅ Cloudflare Tunnel is active."
    else
        echo "   ⚠️ Cloudflare Tunnel not found running. Frontend might not connect to Backend."
        echo "   👉 Run: cloudflared tunnel run binetic-tunnel"
    fi
else
    echo "   ⚠️ 'cloudflared' not found. Remote frontend will not work."
fi

# 5. Run Discovery Bootstrap (Seed Capabilities)
echo "🔎 Running Discovery Bootstrap..."
python3 scripts/bootstrap_discovery.py

echo "✨ Binetic is ALIVE."
echo "   - Backend: http://localhost:8000"
echo "   - Logs: tail -f server.log"
