#!/bin/bash
set -e

echo "🚀 Deploying status-page to production..."
echo ""

# Get the script's directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA_DIR="$SCRIPT_DIR/../../infra/personal-1"

# Commit and push app changes
echo "📦 Committing and pushing changes..."
cd "$SCRIPT_DIR"
git add .
if git diff --staged --quiet; then
    echo "No changes to commit in status-page app"
else
    read -p "Enter commit message: " commit_msg
    git commit -m "$commit_msg"
    git push
    echo "✅ Pushed to GitHub"
fi

# Run Ansible playbook
echo ""
echo "🔧 Running Ansible deployment..."
cd "$INFRA_DIR"
ansible-playbook playbooks/status-page.yml --ask-vault-pass

echo ""
echo "✅ Deployment complete!"
echo "🌐 Check: https://status.simonschubert.com"
