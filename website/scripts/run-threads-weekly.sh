#!/bin/zsh
# The Threads job, end to end: search, screen the sites the posts point to, and open one pull request. Nothing reaches master until a person merges it.
# Usage: run-threads-weekly.sh [--groups a,b|all] [--limit n]
# Needs on this machine: a saved Threads token (docs/threads-discovery.md), Google Chrome, claude, gh, and a clean checkout of this repository.
set -eu
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
GROUPS_ARG=""; LIMIT=10
while (( $# )); do
  case "$1" in
    --groups) (( $# >= 2 )) || exit 2; GROUPS_ARG="$2"; shift 2 ;;
    --limit) (( $# >= 2 )) || exit 2; LIMIT="$2"; shift 2 ;;
    *) echo "Usage: run-threads-weekly.sh [--groups a,b|all] [--limit n]" >&2; exit 2 ;;
  esac
done
[[ "$GROUPS_ARG" =~ '^[a-z0-9,-]*$' && "$LIMIT" =~ '^[0-9]+$' ]] || { echo "bad argument" >&2; exit 2; }
cd "$ROOT"
git diff --quiet && git diff --cached --quiet || { echo "The working tree has uncommitted changes; run this from a clean checkout." >&2; exit 1; }

# Work in a throwaway worktree off origin/master so the maintainer's own branch is never touched.
git fetch -q origin master
DAY="$(date +%F)"; BRANCH="codex/threads-weekly-$DAY"; WORK="$(mktemp -d)/threads-weekly"
git worktree add -q -b "$BRANCH" "$WORK" origin/master
trap 'cd "$ROOT"; git worktree remove --force "$WORK" 2>/dev/null || true' EXIT
cd "$WORK"

node website/scripts/threads-discovery.mjs ${GROUPS_ARG:+--groups "$GROUPS_ARG"}
OUT="$(mktemp)"; node website/scripts/threads-publish.mjs --limit "$LIMIT" | tee "$OUT"
node --test website/scripts/inspiration-data.test.mjs website/scripts/threads-discovery.test.mjs website/scripts/threads-publish.test.mjs

if git diff --quiet; then echo "Nothing to publish this week."; git branch -D "$BRANCH" >/dev/null 2>&1 || true; exit 0; fi
git add website/content/threads-post-inbox.json website/src/inspiration-data.ts website/src/link-previews.json
git commit -q -m "Add this week's sites found on Threads ($DAY)

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
git push -q -u origin "$BRANCH"
gh pr create --base master --title "Add this week's sites found on Threads ($DAY)" --body "$(cat <<EOF
Weekly Threads discovery, screened by \`website/scripts/threads-publish.mjs\`: each site a post points to was opened once in headless Chrome (first three screens), and the model wrote the notes from that image. Nobody has used the sites or seen them on a phone; read the notes against the preview before merging, and drop a card by removing its entry and setting the inbox row to \`rejected\`.

\`\`\`
$(cat "$OUT")
\`\`\`

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
