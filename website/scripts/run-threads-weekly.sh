#!/bin/zsh
# The Threads job, end to end: search, screen the sites the posts point to, open one pull request, and merge it once CI passes (maintainer's decision, 2026-11-19; see merge-weekly-pr.sh).
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

# weekly-guard.mjs exits 3 to skip a run and prints why; nothing is pushed, and the EXIT trap below removes any worktree.
guard() { local s=0; node "$ROOT/website/scripts/weekly-guard.mjs" "$@" || s=$?; (( s == 3 )) && exit 0; return $s; }
# The same candidates must not land in two pull requests (#347 repeated 8 of #342's), and on a machine short on memory
# Chrome does not start (#347: all 10 left pending with swap near full), so wait a while for memory, then give up the run.
guard open-pr threads
guard memory --tries 3 --wait 600

# Work in a throwaway worktree off origin/master so the maintainer's own branch is never touched.
git fetch -q origin master
DAY="$(date +%F)"; BRANCH="codex/threads-weekly-$DAY"; WORK="$(mktemp -d)/threads-weekly"
git worktree add -q -b "$BRANCH" "$WORK" origin/master
trap 'cd "$ROOT"; git worktree remove --force "$WORK" 2>/dev/null || true; git branch -D "$BRANCH" >/dev/null 2>&1 || true' EXIT
cd "$WORK"

node website/scripts/threads-discovery.mjs ${GROUPS_ARG:+--groups "$GROUPS_ARG"}
OUT="$(mktemp)"; node website/scripts/threads-publish.mjs --limit "$LIMIT" | tee "$OUT"
guard results "$OUT"   # mostly unread candidates mean the machine or network failed: no pull request
node --test website/scripts/inspiration-data.test.mjs website/scripts/screening-rubric.test.mjs website/scripts/threads-discovery.test.mjs website/scripts/threads-publish.test.mjs

if git diff --quiet; then echo "Nothing to publish this week."; git branch -D "$BRANCH" >/dev/null 2>&1 || true; exit 0; fi
git add website/content/threads-post-inbox.json website/src/inspiration-data.ts website/src/link-previews.json
git commit -q -m "Add this week's sites found on Threads ($DAY)

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
guard open-pr threads   # again, in case a weekly pull request was opened during this run (a direct run skips weekly.sh's lock)
git push -q -u origin "$BRANCH"
gh pr create --base master --title "Add this week's sites found on Threads ($DAY)" --body "$(cat <<EOF
Weekly Threads discovery, screened by \`website/scripts/threads-publish.mjs\`: each site a post points to was opened once in headless Chrome (first three screens), and the model wrote the notes from that image. Nobody has used the sites or seen them on a phone; this pull request merges itself once CI passes. To take a card down afterwards, remove its entry and set the inbox row to \`rejected\`. Candidates that score in the review band (60–75% of the weighted total, docs/benchmark.md) are not published: they stay in the inbox as \`review\` and are listed under "Held for review"; answer 收 or 拒 per id, applied with \`node website/scripts/review-queue.mjs accept|reject <id>\`.

\`\`\`
$(cat "$OUT")
\`\`\`

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
"$WORK/website/scripts/merge-weekly-pr.sh" "$BRANCH"
