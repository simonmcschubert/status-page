#!/bin/bash
set -e

# Example: Sync config files to production server
# 
# This script uploads config.yml and monitors.yml to the server.
# The StatusBeacon file watcher will automatically detect changes
# and reload the configuration - no service restart needed!
#
# RECOMMENDED: Copy this script to your private config folder:
#   cp scripts/update-config.example.sh ~/private-configs/statusbeacon/update-config.sh
#
# Setup:
# 1. Copy this script to your private config directory
# 2. Add deploy section to your config.yml (or pass server as argument)
# 3. Run: ./update-config.sh

# ============================================
# CONFIGURATION
# ============================================

# SSH options - use ControlMaster to reuse a single connection
SSH_OPTS="-o ConnectTimeout=30 -o ServerAliveInterval=15 -o ServerAliveCountMax=3"
CONTROL_PATH="/tmp/ssh-statusbeacon-%r@%h:%p"
SSH_MASTER_OPTS="$SSH_OPTS -o ControlMaster=auto -o ControlPath=$CONTROL_PATH -o ControlPersist=60"

# Get the script's directory (where config files are located)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Helper to read deploy section values from YAML (no external deps)
get_deploy_value() {
    local key="$1"
    local file="$2"
    awk '/^deploy:/{found=1} found && /^  '"$key"':/{print; exit}' "$file" 2>/dev/null | sed 's/.*: *//' | tr -d '"'
}

# Configuration - read from config.yml or use argument
if [ -n "$1" ]; then
    SERVER="$1"
elif [ -f "config.yml" ]; then
    SERVER=$(get_deploy_value "server" "config.yml")
    if [ -z "$SERVER" ]; then
        echo "❌ No server configured in config.yml (deploy.server)"
        echo "Usage: ./update-config.sh [server]"
        exit 1
    fi
else
    echo "❌ No server specified and config.yml not found"
    echo "Usage: ./update-config.sh user@server"
    exit 1
fi

# Read remote config path from config.yml or use default
if [ -f "config.yml" ]; then
    CONFIG_PATH=$(get_deploy_value "config_path" "config.yml")
    [ -z "$CONFIG_PATH" ] && CONFIG_PATH="/var/data/statusbeacon"
else
    CONFIG_PATH="/var/data/statusbeacon"
fi

# ============================================
# Script logic
# ============================================

# Cleanup function to close SSH master connection
cleanup() {
    ssh -O exit -o ControlPath="$CONTROL_PATH" "$SERVER" 2>/dev/null || true
}
trap cleanup EXIT

# Establish master connection
echo "🔌 Connecting to $SERVER..."
if ! ssh $SSH_MASTER_OPTS "$SERVER" "echo 'ok'" > /dev/null 2>&1; then
    echo "❌ Cannot connect to $SERVER"
    echo "   Check your network connection and SSH configuration"
    exit 1
fi
echo "  ✓ Connected"
echo ""

echo "📁 Syncing config files to $CONFIG_PATH..."

# Check which config files exist locally
CONFIG_FILES=""
if [ -f "config.yml" ]; then
    CONFIG_FILES="$CONFIG_FILES config.yml"
    echo "  ✓ Found config.yml"
else
    echo "  ⚠ config.yml not found (skipping)"
fi

if [ -f "monitors.yml" ]; then
    CONFIG_FILES="$CONFIG_FILES monitors.yml"
    echo "  ✓ Found monitors.yml"
else
    echo "  ⚠ monitors.yml not found (skipping)"
fi

if [ -z "$CONFIG_FILES" ]; then
    echo ""
    echo "❌ No config files found to sync"
    exit 1
fi

echo ""

# Upload config files to /tmp, then move with sudo (avoids permission issues)
echo "📤 Uploading config files..."
scp -o ControlPath="$CONTROL_PATH" $CONFIG_FILES "$SERVER:/tmp/"
echo "  ✓ Files uploaded to server"

# Move to config directory with correct permissions
echo "  → Setting permissions..."
ssh -o ControlPath="$CONTROL_PATH" "$SERVER" "sudo mv /tmp/config.yml /tmp/monitors.yml $CONFIG_PATH/ 2>/dev/null; sudo chown www-data:www-data $CONFIG_PATH/*.yml"
echo "  ✓ Files moved to $CONFIG_PATH"

echo ""
echo "✅ Config sync complete!"
echo "   The file watcher will automatically reload the configuration."
