#!/bin/bash
set -euo pipefail

# ============================================================================
# Configure branch protection for main branch
# Run once after creating the GitHub repo:
#   .github/setup-branch-protection.sh owner/repo
# ============================================================================

REPO="${1:?Usage: $0 owner/repo}"

echo "Configuring branch protection for $REPO..."

gh api repos/"$REPO"/branches/main/protection \
  --method PUT \
  --input - <<'EOF'
{
  "required_status_checks": {
    "strict": true,
    "contexts": [
      "Type Check",
      "Lint & Format",
      "Validate Config Files",
      "ShellCheck"
    ]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": null,
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
EOF

echo "Branch protection configured for main."
echo "  - Requires all CI checks to pass"
echo "  - Requires branch to be up to date"
echo "  - Blocks force pushes and branch deletion"
