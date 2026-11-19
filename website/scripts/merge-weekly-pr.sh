#!/bin/zsh
# Merges a weekly discovery pull request once CI passes; the maintainer decided on 2026-11-19 that weekly additions go
# live without waiting for them. A failed check is rerun once (the landing suite has a known flaky test); if it still
# fails, the pull request stays open for a person and this script exits non-zero. Nothing is ever force-pushed.
# Usage: merge-weekly-pr.sh <branch>
set -eu
BRANCH="${1:-}"
[[ "$BRANCH" =~ '^codex/[a-z]+-weekly-[0-9-]+$' ]] || { echo "Usage: merge-weekly-pr.sh codex/<source>-weekly-<date>" >&2; exit 2; }

# Checks take a moment to register after the pull request opens; `gh pr checks` fails while none are reported.
checks_registered() { for _ in {1..20}; do gh pr checks "$BRANCH" 2>&1 | grep -q "no checks reported" || return 0; sleep 15; done; return 1; }
watch_checks() { gh pr checks "$BRANCH" --watch --fail-fast --interval 30 >/dev/null; }

checks_registered || { echo "No CI checks appeared for $BRANCH; left the pull request open." >&2; exit 1; }
if ! watch_checks; then
  echo "CI failed on $BRANCH; rerunning the failed jobs once."
  for run in $(gh run list --branch "$BRANCH" --json databaseId,conclusion -q '.[] | select(.conclusion == "failure") | .databaseId'); do gh run rerun "$run" --failed; done
  sleep 20
  watch_checks || { echo "CI failed twice on $BRANCH; left the pull request open for a person." >&2; exit 1; }
fi

gh pr merge "$BRANCH" --squash --delete-branch=false
git push -q origin --delete "$BRANCH" || true
# Keep dev level with master (AGENTS.md → Git). A plain push only fast-forwards; if dev has its own commits, say so and stop.
git fetch -q origin master dev
git push -q origin origin/master:dev 2>/dev/null || echo "dev has commits master lacks; merge master into dev by hand."
echo "Merged $BRANCH into master."
