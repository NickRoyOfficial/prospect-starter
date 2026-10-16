#!/usr/bin/env bash
# lint.sh <file-or-dir> [--gate]
# Runs the StopSlop Vale style over a file or directory.
#   --gate  errors only, non-zero exit. Use before shipping anything.
set -uo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RAW="${1:?usage: lint.sh <file-or-dir> [--gate]}"
shift || true
# resolve before changing directory, or vale reads stdin and reports nothing
if [[ -e "$RAW" ]]; then TARGET="$(cd "$(dirname "$RAW")" && pwd)/$(basename "$RAW")"; else
  echo "lint.sh: no such file or directory: $RAW" >&2; exit 2; fi
cd "$DIR"
if [[ "${1:-}" == "--gate" ]]; then
  vale --config="$DIR/.vale.ini" --minAlertLevel=error "$TARGET"
else
  vale --config="$DIR/.vale.ini" "$TARGET"
fi
