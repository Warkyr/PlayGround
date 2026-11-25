#!/usr/bin/env bash
set -uo pipefail

if [[ -z "${CAPTURE_URL:-}" || -z "${CAPTURE_DIR:-}" ]]; then
  echo "Set CAPTURE_URL and CAPTURE_DIR." >&2
  exit 1
fi

/usr/bin/time -p mkdir -p "$CAPTURE_DIR"

RUNTIME="$HOME/.local/share/omgithub-playwright"
CAPTURE_SCRIPT="${RUNTIME_DIR:-/home/runner/work/_temp/omgithub-runtime}/scripts/default-capture.mjs"

# Preserve the runtime's Playwright implementation and let it return 75 for transient browser failures.
/usr/bin/time -p env \
  CAPTURE_URL="$CAPTURE_URL" \
  CAPTURE_DIR="$CAPTURE_DIR" \
  CAPTURE_STRICT="${CAPTURE_STRICT:-1}" \
  node "$CAPTURE_SCRIPT"
status=$?

if [[ $status -ne 0 && $status -ne 75 ]]; then
  status=1
fi
exit "$status"
