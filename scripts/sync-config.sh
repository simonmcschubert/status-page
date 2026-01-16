#!/bin/bash
set -e

# Sync config files to production server
# Usage: ./scripts/sync-config.sh [server]
#
# This script uploads config.yml and monitors.yml to the server
# and reloads the service. Use this for quick config changes
# without a full deploy.

# SSH options to prevent timeouts and improve reliability
SSH_OPTS="-o ConnectTimeout=30 -o ServerAliveInterval=15 -o ServerAliveCountMax=3 -o BatchMode=yes"

# Get the script's directory and app root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$APP_DIR"

# Configuration - read from config.yml or use argument
if [ -n "$1" ]; then
    SERVER="$1"
elif command -v yq &> /dev/null && [ -f "config/config.yml" ]; then
    SERVER=$(yq '.deploy.server' config/config.yml)
    if [ "$SERVER" = "null" ] || [ -z "$SERVER" ]; then
        echo "❌ No server configured in config/config.yml (deploy.server)"
        echo "Usage: ./scripts/sync-config.sh [server]"
        exit 1
    fi
else
    echo "❌ No server specified and config/config.yml not found or yq not installed"
    echo "Usage: ./scripts/sync-config.sh user@server"
    exit 1
fi

# Read app path from config or use default
if command -v yq &> /dev/null && [ -f "config/config.yml" ]; then
    APP_PATH=$(yq '.deploy.path // "/var/www/status-page"' config/config.yml)
else
    APP_PATH="/var/www/status-page"
fi

# Test connection first
echo "🔌 Testing connection to $SERVER..."
if ! ssh $SSH_OPTS "$SERVER" "echo 'ok'" > /dev/null 2>&1; then
    echo "❌ Cannot connect to $SERVER"
    echo "   Check your network connection and SSH configuration"
    exit 1
fi
echo "  ✓ Connected"
echo ""

echo "📁 Syncing config files to $SERVER..."
echo ""

# Check which config files exist locally
CONFIG_FILES=""
if [ -f "config/config.yml" ]; then
    CONFIG_FILES="$CONFIG_FILES config/config.yml"
    echo "  ✓ Found config/config.yml"
else
    echo "  ⚠ config/config.yml not found (skipping)"
fi

if [ -f "config/monitors.yml" ]; then
    CONFIG_FILES="$CONFIG_FILES config/monitors.yml"
    echo "  ✓ Found config/monitors.yml"
else
    echo "  ⚠ config/monitors.yml not found (skipping)"
fi

if [ -z "$CONFIG_FILES" ]; then
    echo ""
    echo "❌ No config files found to sync"
    exit 1
fi

echo ""

# Upload config files using scp (simpler than rsync for small files)
echo "📤 Uploading config files..."
for file in $CONFIG_FILES; do
    scp $SSH_OPTS "$file" "$SERVER:/tmp/$(basename $file)"
    ssh $SSH_OPTS "$SERVER" "sudo mv /tmp/$(basename $file) $APP_PATH/$file"
    echo "  ✓ Uploaded $file"
done

# Fix ownership and reload service
echo ""
echo "🔄 Reloading service..."
ssh $SSH_OPTS "$SERVER" "sudo chown -R www-data:www-data $APP_PATH/config/ && (sudo systemctl reload status-page || sudo systemctl restart status-page)"
echo "  ✓ Service reloaded"

echo ""
echo "✅ Config sync complete!"
