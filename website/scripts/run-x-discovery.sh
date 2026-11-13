#!/bin/zsh
set -eu
X_DISCOVERY_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
X_DISCOVERY_SCRIPT="$X_DISCOVERY_ROOT/website/scripts/x-discovery.mjs"
# Ego Lite installs its CLI per user; the path is not the same on every machine.
EGO_BROWSER="${EGO_BROWSER:-$(command -v ego-browser || echo "$HOME/.local/bin/ego-browser")}"
exec "$EGO_BROWSER" nodejs -e "const { run } = await import('file://$X_DISCOVERY_SCRIPT'); await run();"
