#!/bin/zsh
set -eu
X_DISCOVERY_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
X_DISCOVERY_SCRIPT="$X_DISCOVERY_ROOT/website/scripts/x-discovery.mjs"
exec /Users/nicole/.local/bin/ego-browser nodejs -e "const { run } = await import('file://$X_DISCOVERY_SCRIPT'); await run();"
