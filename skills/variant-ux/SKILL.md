---
name: variant-ux
description: UX Review mode — heuristic evaluation (Nielsen's 10), cognitive load analysis, mental model diagnosis, affordance audit, dark pattern detection — grounded in NNG research. Load references/ux-heuristics.md and references/ux-psychology.md. Triggers on: ux review, heuristic evaluation, usability audit, cognitive load, mental models, affordances, dark patterns, review this design, check usability, is this good UX
---

## UX Review Mode

When the user wants to evaluate usability rather than generate visuals, switch to UX Review mode. Load `references/ux-heuristics.md` and `references/ux-psychology.md`. Load additional references as the review scope demands (see "When to Load Which Reference" below).

### Triggers

| User says | Action | Load |
|---|---|---|
| "ux review" / "heuristic review" / "usability audit" | Full heuristic evaluation against Nielsen's 10 | `ux-heuristics.md` + `ux-psychology.md` |
| "review this design" / "what's wrong with this UI" | Heuristic scan → findings list with severity | `ux-heuristics.md` |
| "check usability" / "is this good UX" | Walk through flow, flag violations | `ux-heuristics.md` + `ux-psychology.md` |
| "cognitive load" / "too complex?" | Cognitive load analysis → reduction suggestions | `ux-psychology.md` |
| "why do users get confused here" | Mental model analysis → mismatch diagnosis | `ux-psychology.md` |
| "affordances" / "does this look clickable" | Affordance/signifier audit | `ux-psychology.md` |
| "dark patterns" / "is this ethical" | Dark pattern scan | `ux-psychology.md` |
| "navigation" / "can't find" / "information architecture" / "IA" | IA audit — labels, hierarchy, findability | `ux-information-architecture.md` |
| "site structure" / "how to organize" / "card sort" / "tree test" | IA design or validation | `ux-information-architecture.md` |
| "accessibility" / "a11y" / "screen reader" / "keyboard navigation" | Accessibility audit against WCAG 2.1 AA | `ux-accessibility.md` |
| "WCAG" / "alt text" / "aria" / "focus" | Specific accessibility check | `ux-accessibility.md` |
| "user testing" / "how to test this" / "usability test" | Research method recommendation + test plan | `ux-research-methods.md` |
| "what do users think" / "how do I get feedback" | Research method selection | `ux-research-methods.md` |
| "NPS" / "SUS" / "survey" / "interview users" | Measurement framework or interview guidance | `ux-research-methods.md` |
| "transition feels wrong" / "animation timing" / "state choreography" / "loading feels laggy" | Component transition audit | `ux-interaction-transitions.md` |
| "touch target" / "thumb zone" / "mobile gesture" / "iOS vs Android" | Mobile interaction audit | `ux-mobile-patterns.md` |
| "onboarding" / "empty state" / "first use" / "aha moment" / "activation" | Onboarding flow review | `ux-onboarding.md` |
| "chart" / "dashboard" / "data viz" / "KPI card" / "which chart" | Data visualization audit or recommendation | `ux-data-visualization.md` |
| "content model" / "taxonomy" / "multilingual" / "RTL" / "localization" | Content structure review | `ux-content-strategy.md` |
| "design tokens" / "token naming" / "theming" / "dark mode architecture" | Token architecture review | `ux-design-tokens.md` |
| "component spec" / "button states" / "modal behavior" / "ARIA" | Component spec review | `ux-component-specs.md` |
| "design critique" / "feedback on design" / "design review meeting" | Critique framework guidance | `ux-design-critique.md` |
| "conversion" / "landing page" / "trust signals" / "CTA copy" / "pricing page" | Conversion UX audit | `ux-conversion-patterns.md` |
| "error message" / "error state" / "form error" / "validation" / "recovery path" / "prevent errors" | Error design audit — classification, messaging, prevention | `ux-error-design.md` |
| "empty state" / "no data" / "blank state" / "nothing here" / "zero state" | Empty state design — all 4 types | `ux-empty-states.md` |
| "notification" / "toast" / "banner" / "badge" / "push notification" / "alert priority" | Notification system design and priority rules | `ux-notifications.md` |
| "table" / "data table" / "sorting" / "filtering" / "pagination" / "bulk select" / "row actions" | Table and list interaction design | `ux-tables-lists.md` |
| "search" / "autocomplete" / "search results" / "search bar" / "faceted search" / "command palette" | Search pattern design — input, suggestions, results | `ux-search-patterns.md` |

### UX Review Workflow

Two paths depending on what's available:
- **Code in cwd** → run Code Scan (Steps 1a–1b) first, then layer conceptual analysis
- **No code / screenshots / description only** → skip to Step 2

**Step 1a: Auto-detect project files**

```bash
# Find component files in cwd (skip node_modules, .git, dist)
find . \( -name "*.tsx" -o -name "*.jsx" -o -name "*.vue" -o -name "*.svelte" -o -name "*.html" \) \
  -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/dist/*" | head -30
```

If files found, proceed to Step 1b. Otherwise skip to Step 2.

**Step 1b: Code-level heuristic scan**

Run these greps against the found files. Each maps to a specific heuristic:

```bash
# H9 — Generic error messages (critical pattern)
grep -rn "error occurred\|something went wrong\|invalid input\|please try again\|An error\|Unknown error" \
  --include="*.tsx" --include="*.jsx" --include="*.vue" --include="*.html" \
  --exclude-dir=node_modules --exclude-dir=dist . 2>/dev/null

# H1 — Missing loading states: async handlers without loading flag
grep -rn "onClick\|onSubmit\|handleSubmit" \
  --include="*.tsx" --include="*.jsx" --exclude-dir=node_modules . 2>/dev/null | head -20
# (then read those files to check if loading/disabled state is managed)

# H3 — Destructive actions: delete/remove calls without confirmation guard
grep -rn "delete\|remove\|destroy\|clearAll\|reset" \
  --include="*.tsx" --include="*.jsx" -i --exclude-dir=node_modules . 2>/dev/null | \
  grep -iv "confirm\|modal\|dialog\|undo\|trash\|soft" | head -20

# H4 — Terminology inconsistency: mixed action words for same concept
grep -rn '"Delete"\|"Remove"\|"Erase"\|"Discard"\|"Clear"' \
  --include="*.tsx" --include="*.jsx" --exclude-dir=node_modules . 2>/dev/null
# Flag if multiple terms coexist in same codebase

# H6 — Icon-only buttons missing accessible label
grep -rn "<button\|<Button\|<IconButton" \
  --include="*.tsx" --include="*.jsx" --exclude-dir=node_modules . 2>/dev/null | \
  grep -v "aria-label\|title=\|children\|tooltip" | head -20

# H5 — Forms missing inline validation
grep -rn "<form\|<Form\|onSubmit" \
  --include="*.tsx" --include="*.jsx" --exclude-dir=node_modules . 2>/dev/null | head -10
# (then read those files to check for inline validation vs. submit-only)

# H10 — Empty states: no empty state handling
grep -rn "\.length === 0\|\.length == 0\|items\.length\|data\.length" \
  --include="*.tsx" --include="*.jsx" --exclude-dir=node_modules . 2>/dev/null | \
  grep -v "EmptyState\|empty\|nothing\|no items\|no results" | head -15

# A11y — Images missing alt text
grep -rn "<img " \
  --include="*.tsx" --include="*.jsx" --include="*.html" \
  --exclude-dir=node_modules . 2>/dev/null | grep -v "alt=" | head -10

# A11y — Buttons missing accessible name (icon-only)
grep -rn "<button\|<Button\|<IconButton" \
  --include="*.tsx" --include="*.jsx" --exclude-dir=node_modules . 2>/dev/null | \
  grep -v "aria-label\|aria-labelledby\|title=" | head -15

# A11y — onClick on non-interactive elements (no keyboard access)
grep -rn "onClick" \
  --include="*.tsx" --include="*.jsx" --exclude-dir=node_modules . 2>/dev/null | \
  grep -E "<div|<span|<p" | head -15

# A11y — outline:none removing focus indicators
grep -rn "outline:\s*none\|outline:\s*0" \
  --include="*.css" --include="*.scss" --include="*.tsx" --include="*.jsx" \
  --exclude-dir=node_modules . 2>/dev/null | head -10

# A11y — Inputs missing associated label
grep -rn "<input" \
  --include="*.tsx" --include="*.jsx" --include="*.html" \
  --exclude-dir=node_modules . 2>/dev/null | \
  grep -v "type=\"hidden\"\|aria-label\|aria-labelledby\|id=" | head -10
```

For each grep that returns results: read the flagged files at the relevant lines to confirm whether it's a real violation or a false positive. Report only confirmed violations.

**Step 2: Define scope** — What task(s) is the user trying to complete? What screens/flows are in scope?

**Step 3: Walk the flow** — Step through each screen as a first-time user would. For each screen, check:
- What is the user trying to do here? (H1: visibility of goal)
- Can they figure out how to do it? (affordances, signifiers)
- Will they know when it worked? (feedback, system status)
- What could go wrong? (error prevention)
- Is anything adding unnecessary mental work? (cognitive load)

**Step 4: Log violations** — For each violation found (from code scan or conceptual walk):
```
File: [path:line] or Screen: [name]
Heuristic: [H1–H10, or cognitive load / mental model / affordance]
Violation: [specific description — quote actual code or UI text where possible]
Severity: [1=cosmetic / 2=minor / 3=major / 4=critical]
Fix: [concrete recommendation with code example if applicable]
```

**Step 5: Report** — Present as a prioritized list, critical issues first. Group by heuristic to surface systemic problems.

**Step 6: Offer next step** — After the report, offer:
- `fix [H9]` → Generate corrected error messages as a code snippet or new component
- `generate fix` → Generate redesigned version of worst-offending screen as HTML/TSX
- `compare` → Side-by-side: current vs. fixed version opened in browser
- `checklist` → Generate a dev-ready fix checklist (markdown, copy-pasteable to GitHub Issues)

### UX Review Output Format

```
✦ UX Review: [screen/flow name]
  Scanned: 23 components · 4 violations found

  Critical (fix before launch)
  ────────────────────────────
  [H9] src/components/LoginForm.tsx:47
       catch(e) { setError("An error occurred") }
       Fix: setError(`Login failed: ${e.message}. Check your email and password.`)

  [H1] src/components/UploadButton.tsx:23
       onClick={handleUpload} — no loading/disabled state managed
       Fix: setLoading(true) on click; disabled={loading}; show <Spinner /> inside button

  Major (high priority)
  ─────────────────────
  [H3] src/pages/ProjectList.tsx:89
       onClick={() => deleteProject(id)} — no confirmation, immediate delete
       Fix: Move to trash: softDelete(id) + undo toast for 5s, or confirm dialog

  Minor (low priority)
  ────────────────────
  [H4] "Remove" (src/components/MemberList.tsx:34) vs "Delete" (src/pages/Settings.tsx:102)
       Same destructive action, two different words
       Fix: Standardize to "Remove" for members, "Delete" for owned resources

  Summary: 2 critical · 1 major · 1 minor
  Next: fix H9 · fix H1 · generate fix · checklist
```

### Quick Triggers for UX Review

| User types | Action |
|---|---|
| `ux scan` | Code scan only — run all heuristic greps, report file:line violations, no conceptual walk |
| `ux review` | Full review — code scan + conceptual walk + report |
| `ux review src/components/` | Scope scan to specific directory |
| `fix H9` | Generate corrected error message patterns as a code snippet |
| `fix H1` | Generate loading state pattern for flagged component |
| `fix H3` | Generate soft-delete / confirmation dialog pattern |
| `generate fix` | Generate redesigned screen that resolves all critical violations |
| `checklist` | Output dev-ready markdown checklist of all violations (copy to GitHub Issues) |
| `compare ux` | Side-by-side: current vs. UX-fixed version in browser |

### Cross-Mode Bridges

**From Site Analysis → UX Review:**
After `audit` extracts tokens and consistency issues, you can continue with `ux scan` — the two modes complement each other. Style audit catches visual/token issues; UX scan catches behavioral/interaction issues.

**From UX Review → Generate:**
After flagging violations, offer to generate a fixed version:
- `generate fix` → generate corrected screen as HTML/TSX, written to `variant-output/ux-fix-[screen].html`, opened in browser
- `compare ux` → write both current (screenshot or recreation) and fixed version, open side-by-side in `variant-output/_ux-compare.html`

**From Generate → UX Review:**
Every generated design silently runs the heuristic checklist before being presented (part of the AI Slop Test gate). If any H1–H10 critical violations are found in the generated code, fix before writing the file — don't present broken UX as a variation.

### When to Load Which Reference

| Question | Load |
|---|---|
| Nielsen heuristics evaluation | `references/ux-heuristics.md` |
| Mental models, cognitive load, Gestalt, affordances | `references/ux-psychology.md` |
| Navigation, findability, IA structure, labeling, search | `references/ux-information-architecture.md` |
| Accessibility, WCAG, keyboard nav, screen readers, a11y | `references/ux-accessibility.md` |
| User research methods, usability testing, interviews, surveys | `references/ux-research-methods.md` |
| Component state transitions, timing, easing, choreography | `references/ux-interaction-transitions.md` |
| Mobile gestures, thumb zones, iOS/Android conventions, touch targets | `references/ux-mobile-patterns.md` |
| Onboarding, empty states, Aha moment, first-use experience | `references/ux-onboarding.md` |
| Charts, dashboards, data visualization, chart selection | `references/ux-data-visualization.md` |
| Content models, taxonomy, multilingual UX, content lifecycle | `references/ux-content-strategy.md` |
| Design tokens, token architecture, theming, dark mode | `references/ux-design-tokens.md` |
| Component specs, button/form/modal states, ARIA patterns | `references/ux-component-specs.md` |
| Design critique, feedback frameworks, design review | `references/ux-design-critique.md` |
| Conversion, landing pages, trust signals, pricing UX, CTAs | `references/ux-conversion-patterns.md` |
| Error messages, validation, recovery paths, prevention layers | `references/ux-error-design.md` |
| Empty states (first use / cleared / no results / error) | `references/ux-empty-states.md` |
| Notifications — Toast, Banner, Badge, Push, priority management | `references/ux-notifications.md` |
| Tables, lists, sorting, filtering, pagination, bulk selection | `references/ux-tables-lists.md` |
| Search patterns — autocomplete, facets, results page, command palette | `references/ux-search-patterns.md` |
| Full UX review | Load all relevant references above |

**For generation tasks:** Load `ux-heuristics.md` and `ux-psychology.md` as silent quality constraints. Every generated design should pass the heuristic checklist before being presented — this is part of the quality gate, same as the AI Slop Test.
