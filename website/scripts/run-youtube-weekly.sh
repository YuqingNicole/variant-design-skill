#!/bin/zsh
# The YouTube job, end to end: search, screen each video from YouTube's own thumbnails, open one pull request, and merge it once CI passes (maintainer's decision, 2026-11-19; see merge-weekly-pr.sh).
# Usage: run-youtube-weekly.sh [--groups a,b|all] [--limit n]
# Needs on this machine: a saved YouTube API key (docs/youtube-discovery.md), ffmpeg, claude, gh, and a clean checkout of this repository.
set -eu
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
GROUPS_ARG=""; LIMIT=10
while (( $# )); do
  case "$1" in
    --groups) (( $# >= 2 )) || exit 2; GROUPS_ARG="$2"; shift 2 ;;
    --limit) (( $# >= 2 )) || exit 2; LIMIT="$2"; shift 2 ;;
    *) echo "Usage: run-youtube-weekly.sh [--groups a,b|all] [--limit n]" >&2; exit 2 ;;
  esac
done
[[ "$GROUPS_ARG" =~ '^[a-z0-9,-]*$' && "$LIMIT" =~ '^[0-9]+$' ]] || { echo "bad argument" >&2; exit 2; }
cd "$ROOT"
git diff --quiet && git diff --cached --quiet || { echo "The working tree has uncommitted changes; run this from a clean checkout." >&2; exit 1; }

# Work in a throwaway worktree off origin/master so the maintainer's own branch is never touched.
git fetch -q origin master
DAY="$(date +%F)"; BRANCH="codex/youtube-weekly-$DAY"; WORK="$(mktemp -d)/youtube-weekly"
git worktree add -q -b "$BRANCH" "$WORK" origin/master
trap 'cd "$ROOT"; git worktree remove --force "$WORK" 2>/dev/null || true; git branch -D "$BRANCH" >/dev/null 2>&1 || true' EXIT
cd "$WORK"

node website/scripts/youtube-discovery.mjs ${GROUPS_ARG:+--groups "$GROUPS_ARG"}
OUT="$(mktemp)"; node website/scripts/youtube-publish.mjs --limit "$LIMIT" | tee "$OUT"
node --test website/scripts/inspiration-data.test.mjs website/scripts/screening-rubric.test.mjs website/scripts/youtube-discovery.test.mjs website/scripts/youtube-publish.test.mjs

if git diff --quiet; then echo "Nothing to publish this week."; git branch -D "$BRANCH" >/dev/null 2>&1 || true; exit 0; fi
git add website/content/youtube-video-inbox.json website/src/inspiration-data.ts
git commit -q -m "Add this week's videos found on YouTube ($DAY)

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
git push -q -u origin "$BRANCH"
gh pr create --base master --title "Add this week's videos found on YouTube ($DAY)" --body "$(cat <<EOF
Weekly YouTube discovery, screened by \`website/scripts/youtube-publish.mjs\`: the model read YouTube's own public thumbnails of each video (the cover and three small frames from the middle, nothing downloaded) and wrote the notes from them, so a note describes what those pictures show, not how the video moves. Nobody has watched the videos or seen them on a phone; this pull request merges itself once CI passes. To take a card down afterwards, remove its entry and set the inbox row to \`rejected\`. Candidates that score in the review band (60–75% of the weighted total, docs/benchmark.md) are not published: they stay in the inbox as \`review\` and are listed under "Held for review"; answer 收 or 拒 per id, applied with \`node website/scripts/review-queue.mjs accept|reject <id>\`.

\`\`\`
$(cat "$OUT")
\`\`\`

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
"$WORK/website/scripts/merge-weekly-pr.sh" "$BRANCH"
