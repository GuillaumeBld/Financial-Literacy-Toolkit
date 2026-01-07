#!/bin/bash
# Script to push Dockerfile and commits to GitHub
# Usage: ./push-to-github.sh YOUR_GITHUB_TOKEN

set -e

if [ -z "$1" ]; then
    echo "Usage: $0 YOUR_GITHUB_TOKEN"
    echo ""
    echo "To get a token:"
    echo "1. Go to: https://github.com/settings/tokens"
    echo "2. Generate new token (classic)"
    echo "3. Select 'repo' scope"
    echo "4. Copy the token and run: $0 YOUR_TOKEN"
    exit 1
fi

GITHUB_TOKEN="$1"
REPO_URL="https://${GITHUB_TOKEN}@github.com/GuillaumeBld/Financial-Literacy-Toolkit.git"

echo "🚀 Pushing commits to GitHub..."
echo ""

cd /root/Financial-Literacy-Toolkit

# Show what will be pushed
echo "📋 Commits to push:"
git log --oneline origin/main..HEAD
echo ""

# Push
git push "$REPO_URL" main

echo ""
echo "✅ Successfully pushed to GitHub!"
echo ""
echo "📝 Next steps:"
echo "1. Wait 10-30 seconds for GitHub to update"
echo "2. Verify: https://github.com/GuillaumeBld/Financial-Literacy-Toolkit"
echo "3. Redeploy in Dokploy - should work now!"

