#!/usr/bin/env bash
#
# Version management script
# Updates package.json and creates git tag
#
# Usage: ./scripts/version.sh <version>
# Example: ./scripts/version.sh 1.4.0
#

set -euo pipefail

# Check if version argument is provided
if [ $# -ne 1 ]; then
    echo "Usage: $0 <version>"
    echo "Example: $0 1.4.0"
    exit 1
fi

VERSION="$1"
GIT_TAG="v${VERSION}"

# Get the script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
PACKAGE_JSON="${PROJECT_ROOT}/webui/package.json"

echo "🐦 Mockingbird Version Manager"
echo "================================"
echo "New version: ${VERSION}"
echo "Git tag: ${GIT_TAG}"
echo ""

# Check if git status is clean
if ! git diff-index --quiet HEAD --; then
    echo "❌ Error: Git working directory is not clean"
    echo "   Please commit or stash your changes first"
    exit 1
fi

# Check if tag already exists
if git rev-parse "${GIT_TAG}" >/dev/null 2>&1; then
    echo "❌ Error: Git tag ${GIT_TAG} already exists"
    exit 1
fi

# Update package.json version
echo "📝 Updating webui/package.json..."
if [ ! -f "${PACKAGE_JSON}" ]; then
    echo "❌ Error: ${PACKAGE_JSON} not found"
    exit 1
fi

# Use sed to update version in package.json (cross-platform compatible)
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' -E "s/\"version\": \"[^\"]+\"/\"version\": \"${VERSION}\"/" "${PACKAGE_JSON}"
else
    # Linux
    sed -i -E "s/\"version\": \"[^\"]+\"/\"version\": \"${VERSION}\"/" "${PACKAGE_JSON}"
fi

echo "✅ Updated package.json to version ${VERSION}"

# Commit the package.json change
echo "📝 Committing package.json..."
git add "${PACKAGE_JSON}"
git commit -m "chore: bump version to ${VERSION}"
echo "✅ Committed version bump"

# Create git tag
echo "🏷️  Creating git tag ${GIT_TAG}..."
git tag -a "${GIT_TAG}" -m "Release ${GIT_TAG}"
echo "✅ Created git tag ${GIT_TAG}"

echo ""
echo "✨ Version update complete!"
echo ""
echo "Next steps:"
echo "  1. Review the changes: git log -1"
echo "  2. Push the commit: git push"
echo "  3. Push the tag: git push origin ${GIT_TAG}"
echo ""
