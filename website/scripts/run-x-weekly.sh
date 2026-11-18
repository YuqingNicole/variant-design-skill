#!/bin/zsh
# The Monday job, end to end: find candidates, screen them, and open one pull request. Nothing reaches master until a person merges it.
# Usage: run-x-weekly.sh [--groups a,b|all] [--limit n]
# Needs on this machine: ego-browser (logged in to x.com), ffmpeg, claude, gh, and a clean checkout of this repository.
set -eu
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
GROUPS_ARG=""; LIMIT=10
while (( $# )); do
  case "$1" in
    --groups) (( $# >= 2 )) || exit 2; GROUPS_ARG="$2"; shift 2 ;;
    --limit) (( $# >= 2 )) || exit 2; LIMIT="$2"; shift 2 ;;
    *) echo "Usage: run-x-weekly.sh [--groups a,b|all] [--limit n]" >&2; exit 2 ;;
  esac
done
[[ "$GROUPS_ARG" =~ '^[a-z0-9,-]*$' && "$LIMIT" =~ '^[0-9]+$' ]] || { echo "bad argument" >&2; exit 2; }
cd "$ROOT"
git diff --quiet && git diff --cached --quiet || { echo "The working tree has uncommitted changes; run this from a clean checkout." >&2; exit 1; }

# Work in a throwaway worktree off origin/master so the maintainer's own branch is never touched.
git fetch -q origin master
DAY="$(date +%F)"; BRANCH="codex/x-weekly-$DAY"; WORK="$(mktemp -d)/x-weekly"
git worktree add -q -b "$BRANCH" "$WORK" origin/master
trap 'cd "$ROOT"; git worktree remove --force "$WORK" 2>/dev/null || true' EXIT
cd "$WORK"

"$WORK/website/scripts/run-x-discovery.sh" ${GROUPS_ARG:+--groups "$GROUPS_ARG"}
OUT="$(mktemp)"; node website/scripts/x-publish.mjs --limit "$LIMIT" | tee "$OUT"
node website/scripts/x-media.mjs
node --test website/scripts/inspiration-data.test.mjs website/scripts/x-media.test.mjs website/scripts/x-publish.test.mjs website/scripts/x-discovery.test.mjs

if git diff --quiet; then echo "Nothing to publish this week."; git branch -D "$BRANCH" >/dev/null 2>&1 || true; exit 0; fi
git add website/content/x-post-inbox.json website/src/inspiration-data.ts website/src/x-media.json
git commit -q -m "Add this week's X design references ($DAY)

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
git push -q -u origin "$BRANCH"
gh pr create --base master --title "Add this week's X design references ($DAY)" --body "$(cat <<EOF
Weekly X discovery, screened by \`website/scripts/x-publish.mjs\`: the model read six frames per video and wrote the notes. Nobody has watched the videos; read the notes against the preview before merging, and drop a card by removing its entry and setting the inbox row to \`rejected\`.

\`\`\`
$(cat "$OUT")
\`\`\`

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
