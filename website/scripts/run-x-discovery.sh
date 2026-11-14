#!/bin/zsh
# Usage: run-x-discovery.sh [--groups a,b|all] [--days n]
# No arguments runs the groups marked "weekly" in website/content/x-discovery.json, as the Monday schedule does.
set -eu
X_DISCOVERY_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
X_DISCOVERY_SCRIPT="$X_DISCOVERY_ROOT/website/scripts/x-discovery.mjs"
X_DISCOVERY_GROUPS=""
X_DISCOVERY_DAYS=""
usage() { echo "Usage: run-x-discovery.sh [--groups a,b|all] [--days n]" >&2; exit 2; }
while (( $# )); do
  case "$1" in
    --groups) (( $# >= 2 )) || usage; X_DISCOVERY_GROUPS="$2"; shift 2 ;;
    --days) (( $# >= 2 )) || usage; X_DISCOVERY_DAYS="$2"; shift 2 ;;
    *) usage ;;
  esac
done
# Both values are pasted into the JavaScript below, so only plain ids and digits are let through.
[[ "$X_DISCOVERY_GROUPS" =~ '^[a-z0-9,-]*$' ]] || usage
[[ "$X_DISCOVERY_DAYS" =~ '^[0-9]*$' ]] || usage
# Ego Lite installs its CLI per user; the path is not the same on every machine.
EGO_BROWSER="${EGO_BROWSER:-$(command -v ego-browser || echo "$HOME/.local/bin/ego-browser")}"
exec "$EGO_BROWSER" nodejs -e "const { run } = await import('file://$X_DISCOVERY_SCRIPT'); await run({ groups: '$X_DISCOVERY_GROUPS', days: '$X_DISCOVERY_DAYS' });"
