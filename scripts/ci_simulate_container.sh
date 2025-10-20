#!/usr/bin/env bash
set -euo pipefail

echo "Installing prerequisites (git, jq)..."
apt-get update -qq
apt-get install -y -qq git jq

WORKDIR=/work
cd "$WORKDIR"

mkdir -p artifacts

echo "Running legacy prefix scan (simulating GitHub Actions)..."
matches=$(git grep -n --no-color "images/Illustrations" || true)
if [ -z "$matches" ]; then
  echo "No legacy prefix occurrences found."
  exit 0
fi

# Build list of disallowed matches (exclude allowed locations)
disallowed=""
while IFS= read -r line; do
  file=$(echo "$line" | cut -d: -f1)
  if [[ "$file" =~ ^scripts/ ]] || [[ "$file" =~ ^README_MIGRATION.md$ ]] || [[ "$file" =~ ^README_DEBUG.md$ ]] || [[ "$file" =~ ^aws-move-illustrations-.*\.json$ ]] || [[ "$file" =~ ^public/build/ ]] || [[ "$file" =~ ^vendor/ ]] || [[ "$file" =~ ^storage/ ]] || [[ "$file" =~ ^node_modules/ ]]; then
    continue
  fi
  disallowed="$disallowed"$'\n'$line
done <<< "$matches"

if [ -n "$disallowed" ]; then
  echo "Disallowed occurrences found:\n$disallowed"

  prefix=":warning: Legacy S3 prefix detected in application code.\n\nThe following occurrences of \`images/Illustrations\` were found (only migration scripts and reports are allowed to reference the legacy prefix):\n\n"
  body="$prefix$disallowed"
  jq -n --arg b "$body" '{ body: $b }' > artifacts/ci_simulation_comment.json
  echo "Wrote artifacts/ci_simulation_comment.json"
  exit 0
else
  echo "No disallowed occurrences"
  exit 0
fi
