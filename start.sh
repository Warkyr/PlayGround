#!/usr/bin/env bash
set -euo pipefail

# Per-command timing is enabled for startup/build diagnostics.
cd "$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$PWD"
PORT="${PORT:-3000}"
OPENCODE_WEB_DIR="${OPENCODE_WEB_DIR:-/home/runner/work/_temp/omgithub-web}"
DIST_DIR="$PROJECT_DIR/dist"

/usr/bin/time -p mkdir -p "$DIST_DIR" "$OPENCODE_WEB_DIR"

# Static site: copy source into the deployment directory, excluding metadata and build output.
/usr/bin/time -p bash -c 'set -e; rm -rf dist.tmp; mkdir dist.tmp; cp index.html styles.css game.js dist.tmp/; rm -rf dist; mv dist.tmp dist'

# Record deployment metadata required by the worker, with absolute paths only.
/usr/bin/time -p python3 - "$OPENCODE_WEB_DIR/deployment-output.json" "$PROJECT_DIR" "$DIST_DIR" <<'PY'
import json
import sys

path, project, directory = sys.argv[1:]
with open(path, "w", encoding="utf-8") as handle:
    json.dump({"project": project, "directory": directory}, handle)
PY

# Serve the built static directory in the foreground.
exec /usr/bin/time -p python3 -m http.server "$PORT" --bind 127.0.0.1 --directory "$DIST_DIR"
