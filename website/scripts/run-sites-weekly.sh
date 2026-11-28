#!/bin/zsh
# The curated-gallery job, end to end: read the galleries' feeds, screen each site, open one pull request, and merge it
# once CI passes (maintainer's decision, 2026-11-22, as for X and Threads; see merge-weekly-pr.sh).
# Usage: run-sites-weekly.sh [--sources a,b|all] [--limit n]
# Needs on this machine: Google Chrome, claude, gh, and a clean checkout of this repository. No account or API key.
set -eu
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SOURCES_ARG=""; LIMIT=10
while (( $# )); do
  case "$1" in
    --sources) (( $# >= 2 )) || exit 2; SOURCES_ARG="$2"; shift 2 ;;
    --limit) (( $# >= 2 )) || exit 2; LIMIT="$2"; shift 2 ;;
    *) echo "Usage: run-sites-weekly.sh [--sources a,b|all] [--limit n]" >&2; exit 2 ;;
  esac
done
[[ "$SOURCES_ARG" =~ '^[a-z0-9,-]*$' && "$LIMIT" =~ '^[0-9]+$' ]] || { echo "bad argument" >&2; exit 2; }
cd "$ROOT"
git diff --quiet && git diff --cached --quiet || { echo "The working tree has uncommitted changes; run this from a clean checkout." >&2; exit 1; }

# weekly-guard.mjs exits 3 to skip a run and prints why; nothing is pushed, and the EXIT trap below removes any worktree.
guard() { local s=0; node "$ROOT/website/scripts/weekly-guard.mjs" "$@" || s=$?; (( s == 3 )) && exit 0; return $s; }
# The same candidates must not land in two pull requests (#347 repeated 8 of #342's), and on a machine short on memory
# Chrome does not start (#347: all 10 left pending with swap near full), so wait a while for memory, then give up the run.
guard open-pr sites
guard memory --tries 3 --wait 600

# Work in a throwaway worktree off origin/master so the maintainer's own branch is never touched.
git fetch -q origin master
DAY="$(date +%F)"; BRANCH="codex/sites-weekly-$DAY"; WORK="$(mktemp -d)/sites-weekly"
git worktree add -q -b "$BRANCH" "$WORK" origin/master
trap 'cd "$ROOT"; git worktree remove --force "$WORK" 2>/dev/null || true; git branch -D "$BRANCH" >/dev/null 2>&1 || true' EXIT
cd "$WORK"

node website/scripts/site-discovery.mjs ${SOURCES_ARG:+--sources "$SOURCES_ARG"}
OUT="$(mktemp)"; node website/scripts/threads-publish.mjs --inbox website/content/site-inbox.json --limit "$LIMIT" | tee "$OUT"
guard results "$OUT"   # mostly unread candidates mean the machine or network failed: no pull request
# Draft facets for the new references with the local Jev model when the machine started it (JEV_URL); a failure costs nothing.
if [ -n "${JEV_URL:-}" ] && ! git diff --quiet website/src/inspiration-data.ts; then
  node website/scripts/jev-facets.mjs --limit 20 | tee -a "$OUT" || echo "Jev facets failed; publishing without drafts."
fi
# The throwaway worktree has no node_modules, and reference-facets.test.mjs loads TypeScript through ts-module.mjs; without
# this every run failed here, after screening, and nothing was published (2026-11-24 and 11-25).
npm ci --prefix website --silent --no-audit --no-fund
node --test website/scripts/inspiration-data.test.mjs website/scripts/reference-facets.test.mjs website/scripts/site-discovery.test.mjs website/scripts/threads-publish.test.mjs

if git diff --quiet; then echo "Nothing to publish this week."; git branch -D "$BRANCH" >/dev/null 2>&1 || true; exit 0; fi
git add website/content/site-inbox.json website/src/inspiration-data.ts website/src/link-previews.json website/src/reference-facets.json
git commit -q -m "Add this week's sites from curated galleries ($DAY)

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
guard open-pr sites   # again, in case a weekly pull request was opened during this run (a direct run skips weekly.sh's lock)
git push -q -u origin "$BRANCH"
gh pr create --base master --title "Add this week's sites from curated galleries ($DAY)" --body "$(cat <<BODY
Weekly gallery discovery (\`website/content/site-discovery.json\`), screened by \`website/scripts/threads-publish.mjs\`: each site was opened once in headless Chrome (first three screens), and the model wrote the notes from that image; the gallery is credited in \`via\`. Nobody has used the sites or seen them on a phone; this pull request merges itself once CI passes. To take a card down afterwards, remove its entry and set the inbox row to \`rejected\`.

\`\`\`
$(cat "$OUT")
\`\`\`

🤖 Generated with [Claude Code](https://claude.com/claude-code)
BODY
)"
"$WORK/website/scripts/merge-weekly-pr.sh" "$BRANCH"
