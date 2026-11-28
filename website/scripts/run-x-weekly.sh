#!/bin/zsh
# The daily job, end to end: find candidates, screen them, open one pull request, and merge it once CI passes (maintainer's decision, 2026-11-19; see merge-weekly-pr.sh).
# Usage: run-x-weekly.sh [--groups a,b|all] [--limit n]
# Needs on this machine: ego-browser (logged in to x.com), ffmpeg, claude, gh, and a clean checkout of this repository.
set -eu
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
GROUPS_ARG=""; LIMIT=20
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

# weekly-guard.mjs exits 3 to skip a run and prints why; nothing is pushed, and the EXIT trap below removes any worktree.
guard() { local s=0; node "$ROOT/website/scripts/weekly-guard.mjs" "$@" || s=$?; (( s == 3 )) && exit 0; return $s; }
# The same candidates must not land in two pull requests (#347 repeated 8 of #342's), and on a machine short on memory
# Chrome does not start (#347: all 10 left pending with swap near full), so wait a while for memory, then give up the run.
guard open-pr x
guard memory --tries 3 --wait 600

# Work in a throwaway worktree off origin/master so the maintainer's own branch is never touched.
git fetch -q origin master
DAY="$(date +%F)"; BRANCH="codex/x-weekly-$DAY"; WORK="$(mktemp -d)/x-weekly"
git worktree add -q -b "$BRANCH" "$WORK" origin/master
trap 'cd "$ROOT"; git worktree remove --force "$WORK" 2>/dev/null || true; git branch -D "$BRANCH" >/dev/null 2>&1 || true' EXIT
cd "$WORK"

# Rejections from runs that accepted nothing wait here, outside the repository, so the same posts are not screened again;
# they go into the next pull request this job opens (owner, 2026-11-28: no pull request for a day with nothing new).
CARRY="${X_INBOX_CARRY:-$HOME/Library/Application Support/variant-design/x-inbox-carry.json}"
[ -f "$CARRY" ] && node website/scripts/x-discovery.mjs --carry-load "$CARRY"

# Listed authors first; keyword searches only fill what is left of the $LIMIT candidates screened below.
"$WORK/website/scripts/run-x-discovery.sh" ${GROUPS_ARG:+--groups "$GROUPS_ARG"} --limit "$LIMIT"
OUT="$(mktemp)"; node website/scripts/x-publish.mjs --limit "$LIMIT" | tee "$OUT"
guard results "$OUT"   # mostly unread candidates mean the machine or network failed: no pull request
node website/scripts/x-media.mjs
# Draft facets for the new references with the local Jev model when the machine started it (JEV_URL); a failure costs nothing.
if [ -n "${JEV_URL:-}" ] && ! git diff --quiet website/src/inspiration-data.ts; then
  node website/scripts/jev-facets.mjs --limit 20 | tee -a "$OUT" || echo "Jev facets failed; publishing without drafts."
fi
# The throwaway worktree has no node_modules, and reference-facets.test.mjs loads TypeScript through ts-module.mjs; without
# this every run failed here, after screening, and nothing was published (2026-11-24 and 11-25).
npm ci --prefix website --silent --no-audit --no-fund
node --test website/scripts/inspiration-data.test.mjs website/scripts/screening-rubric.test.mjs website/scripts/reference-facets.test.mjs website/scripts/x-media.test.mjs website/scripts/x-publish.test.mjs website/scripts/x-discovery.test.mjs website/scripts/x-authors.test.mjs

# No new video and nothing held for review, no pull request: a run that found nothing, or rejected everything it found, only
# saves its rejections. Review-band rows ("~ " lines in the report) need the owner, so they always open one.
if git diff --quiet website/src/inspiration-data.ts && ! grep -q '^~ ' "$OUT"; then
  git diff --quiet website/content/x-post-inbox.json || node website/scripts/x-discovery.mjs --carry-save "$CARRY"
  echo "No new videos today; no pull request opened."; exit 0
fi
# Makers of accepted videos who are not on the author list yet; listed in the pull request for a person to add by hand.
node website/scripts/x-authors.mjs suggest | tee -a "$OUT" || true
git add website/content/x-post-inbox.json website/src/inspiration-data.ts website/src/x-media.json website/src/reference-facets.json
git commit -q -m "Add this week's X creative videos ($DAY)

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
guard open-pr x   # again, in case a weekly pull request was opened during this run (a direct run skips weekly.sh's lock)
git push -q -u origin "$BRANCH"
gh pr create --base master --title "Add this week's X creative videos ($DAY)" --body "$(cat <<EOF
Weekly X discovery, screened by \`website/scripts/x-publish.mjs\`: the model read six frames per video and wrote the notes. Nobody has watched the videos; this pull request merges itself once CI passes. To take a card down afterwards, remove its entry and set the inbox row to \`rejected\`. Candidates that score in the review band (60–75% of the weighted total, docs/benchmark.md) are not published: they stay in the inbox as \`review\` and are listed under "Held for review"; answer 收 or 拒 per id, applied with \`node website/scripts/review-queue.mjs accept|reject <id>\`.

\`\`\`
$(cat "$OUT")
\`\`\`

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
rm -f "$CARRY"   # its rejections are in this pull request's inbox now
"$WORK/website/scripts/merge-weekly-pr.sh" "$BRANCH"
