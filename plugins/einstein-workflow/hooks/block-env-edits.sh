#!/usr/bin/env bash
# Prevents Claude from writing to .env files (security hook).
# Allows .env.tpl, .env.example, .env.sample as templates.

set -euo pipefail

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('tool_input',{}).get('file_path',''))" 2>/dev/null || echo "")

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
