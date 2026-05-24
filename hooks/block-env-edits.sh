#!/usr/bin/env bash
# Prevents Claude from writing to .env files (security hook).
# Allows .env.tpl, .env.example, .env.sample as templates.

set -euo pipefail

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | grep -oP '"file_path"\s*:\s*"([^"]*)"' | head -1 | sed 's/.*"file_path"\s*:\s*"\([^"]*\)".*/\1/' 2>/dev/null || echo "")

if [ -z "$FILE_PATH" ]; then
  echo '{}'
  exit 0
fi

BASENAME=$(basename "$FILE_PATH")

# Allow template files
case "$BASENAME" in
  .env.tpl|.env.example|.env.sample|.env.template|env.tpl|env.example)
    echo '{}'
    exit 0
    ;;
esac

# Block .env files
case "$BASENAME" in
  .env|.env.local|.env.development|.env.production|.env.staging|.env.test)
    echo '{"decision":"block","reason":"Blocked: writing to '"$BASENAME"' is not allowed. Use .env.tpl as a template instead."}'
    exit 0
    ;;
esac

echo '{}'
