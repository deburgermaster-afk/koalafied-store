#!/usr/bin/env bash
# Push every key=value pair from .env into Vercel as production+preview+development env vars.
set -e
cd "$(dirname "$0")/.."

ENVS=(production preview development)

while IFS= read -r line; do
  # Skip blanks and comments
  [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
  key="${line%%=*}"
  val="${line#*=}"
  # Strip surrounding quotes
  val="${val%\"}"
  val="${val#\"}"
  val="${val%\'}"
  val="${val#\'}"
  [[ -z "$key" ]] && continue
  for env in "${ENVS[@]}"; do
    # Remove existing then add (suppress errors if not present)
    vercel env rm "$key" "$env" --yes >/dev/null 2>&1 || true
    printf '%s' "$val" | vercel env add "$key" "$env" >/dev/null 2>&1
    echo "  ✓ $key → $env"
  done
done < .env

echo "Done."
