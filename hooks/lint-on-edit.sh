#!/usr/bin/env bash
# PostToolUse hook: auto-lint/format edited files.
# Generic version — auto-detects the project root by walking up from the edited file
# to find the nearest package.json, then runs the appropriate linter.

set -euo pipefail

FILE_PATH=$(python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    print(d.get('tool_input', {}).get('file_path', ''))
except Exception:
    print('')
" 2>/dev/null || echo "")

[ -z "$FILE_PATH" ] && exit 0

# Only lint JS/TS files
case "$FILE_PATH" in
  *.js|*.jsx|*.ts|*.tsx|*.mjs|*.cjs) ;;
  *) exit 0 ;;
esac

# Walk up from file to find nearest package.json (project root)
find_project_root() {
  local dir="$1"
  while [ "$dir" != "/" ] && [ "$dir" != "$HOME" ]; do
    if [ -f "$dir/package.json" ]; then
      echo "$dir"
      return 0
    fi
    dir=$(dirname "$dir")
  done
  return 1
}

PROJECT_ROOT=$(find_project_root "$(dirname "$FILE_PATH")") || exit 0

cd "$PROJECT_ROOT"

# Check for prettier config first
if [ -f ".prettierrc" ] || [ -f ".prettierrc.js" ] || [ -f ".prettierrc.json" ] || [ -f "prettier.config.js" ] || [ -f "prettier.config.mjs" ]; then
  npx prettier --write "$FILE_PATH" 2>/dev/null || true
fi

# Then ESLint
if [ -f ".eslintrc" ] || [ -f ".eslintrc.js" ] || [ -f ".eslintrc.json" ] || [ -f ".eslintrc.yml" ] || [ -f "eslint.config.js" ] || [ -f "eslint.config.mjs" ]; then
  npx eslint --fix "$FILE_PATH" --quiet 2>/dev/null || true
fi

exit 0
