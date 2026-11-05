<!-- Sub-workflow of the variant-design skill, reached through the route table in ../../SKILL.md. It is named ROUTE.md and has no skill frontmatter on purpose: agents that scan for SKILL.md files (Codex, `npx skills`, Claude Code plugins) must not register it as a standalone skill, because its paths are relative to the skill root. -->

> **variant-design-system**: Design System mode — tokens → components → pages three-layer workflow. Generate a complete token set (palette/type/spacing/motion/elevation/radius), confirm it, then all downstream outputs are visually consistent. Triggers on: ds, design system, tokens, create token set, define palette, define tokens, set up tokens, ds confirm, compose

> Before generating code, load `skills/shared/code-output.md`, `references/workflow/project-context.md`, and `references/workflow/quality-baseline.md`.

Before writing `design-system.css` (Step 1 or Step 1b), read `references/design-system/system-decisions.md`: decide first, audit the source, size the system to the product, show it in use.

For product-critical work, also read `references/workflow/design-declaration.md` and `references/workflow/product-integrity-gate.md`. A confirmed design system locks the declaration's product constraints as well as visual tokens.

When a real page preview is available, automatically derive checks from its current task and original brand using `references/workflow/runtime-plans.md`. Capture a genuine before baseline before adoption/edits; token previews alone do not establish rendered page acceptance.

## Design System Mode

When handing off an integrated page or confirmed-system adoption, use `skills/shared/export.md`, then `references/workflow/delivery-receipt.md` at the handoff step. Seal the actual target inventory and check references before rollback; do not treat a token preview or inventory receipt as rendered acceptance.

For interrupted integration/rollback, use that export workflow's guarded recovery and preserve its backup/intent. Pending operations cannot supply current delivery acceptance; recovery does not change system adoption or selection.

For integrated-page static readiness, use the explicit strict gate in `references/workflow/artifact-verification.md`; the online HTML audit shares its summary on sanitized input and adds document checks. Keep rendered system evidence and missing runtime checks separate.

The canonical workflow for production-quality work. Define once, generate consistently.

```
ds → confirm → component [name] → compose [page]
↑                    ↑                   ↑
Token foundation   Atomic pieces     Assembled layouts
```

### Triggers

| User says | Action |
|---|---|
| `ds` / "create a design system" / "define tokens" / "set up tokens" | Generate design system → preview → confirm |
| `pick B` (from a generate comparison) | Select B, then derive a complete design system from it → preview → confirm (see Step 1b) |
| `ds confirm` | Lock the current design system and any product-critical Design Declaration for future outputs |
| `ds edit [section]` | Edit one section of the design system (palette / type / spacing / motion) without regenerating all |
| `ds show` | Print current design system token summary in terminal |
| `component [name]` (after DS confirmed) | Generate component using locked DS tokens, all 8 states |
| `compose [page name]` | Assemble confirmed components into a page, 3 layout variations |
| `compose [page] using A B C` | Compose page from specific named components |

### Step 1 — Generate Design System (`ds`)

**Before generating**, infer these dimensions from the brief and repository. Ask at most two material unanswered questions across the entire request; no mandatory intake:

1. **Brand personality** — 2–3 adjectives that describe the feel (e.g. "precise, warm, understated")
2. **Color direction** — existing brand color, or a reference (hex / site URL / mood word)
3. **Typeface preference** — existing fonts, or a direction ("editorial serif", "clean geometric sans", "monospace-forward")

If user says "surprise me" or has no preferences, infer from their codebase (README, existing CSS, component names) or pick a strongly opinionated direction and state it.

**Generate `variant-output/design-system.css`**, opening with the system's decisions (`references/design-system/system-decisions.md` §1). Size it as in §3 and layer it as in §4 of that file. The example below shows the layers, naming and notes for a small members page; it is not a set to fill. Write the tokens this product uses and the states it needs, and leave out layers it does not need.

```css
/* Harbor members · design system · draft, confirm with: ds confirm
   Decisions
   1. Color marks risk, not decoration: the accent only on the action that grants access, danger only where access is removed.
   2. People are scanned in rows: members are list rows; a container only groups what is compared side by side.
   3. Size and weight carry hierarchy: no eyebrow labels, no decorative numbers.
   Normalized: 13px meta → --text-meta; 18px gaps → --space-4.  Dropped: uppercase eyebrows, slogan hero. */

/* ── Semantic ── product code uses only these ─────────── */
:root {
  --color-bg:            #f7f5f0; /* use: page */
  --color-surface:       #ffffff; /* use: member list, dialogs, inputs */
  --color-border:        #dcd6ca; /* use: row dividers */
  --color-border-control:#8a8273; /* use: input and select borders */
  --color-text:          #23201b; /* use: names, headings, body; on: --color-bg --color-surface */
  --color-text-muted:    #5f584d; /* use: emails, last active, helper text; on: --color-bg --color-surface */
  --color-accent:        #1f5f8b; /* use: invite button, selected role */
  --color-on-accent:     #ffffff; /* use: invite button label */
  --color-focus:         #1f5f8b; /* use: focus ring on every control */
  --color-danger:        #a3271b; /* use: remove-access button, removal errors; on: --color-bg --color-surface */
  --color-on-danger:     #ffffff; /* use: confirm-removal label */

  --font-ui:   "Instrument Sans", sans-serif;   /* use: everything; one family */
  --text-ui:         0.875rem;/* use: button and control labels */
  --text-page-title: 1.75rem; /* use: page heading */
  --text-section:    1.25rem; /* use: Members, Pending invites */
  --text-body:       1rem;    /* use: names, controls */
  --text-meta:       0.875rem;/* use: emails, timestamps */
  --weight-regular: 400;  --weight-strong: 600;
  --leading-body: 1.5;    --leading-heading: 1.2;

  --space-1: 4px; --space-2: 8px; --space-3: 12px; --space-3-5: 14px; --space-4: 16px; --space-6: 24px; --space-8: 32px;
  --control-height-md: 36px;  /* use: buttons, inputs, selects */
  --row-height: 56px;          /* use: member row */
  --radius-control: 7px;       /* use: buttons, inputs, selects (0.2 of 36px) */
  --radius-container: 10px;    /* use: dialogs */
  --shadow-dialog: 0 12px 32px rgb(35 32 27 / 0.18); /* use: confirmation dialog only */
  --duration-feedback: 150ms;  /* use: hover, focus, pressed */
  --font-control: 500 var(--text-ui)/1 var(--font-ui); /* use: control labels */
  --opacity-hover: 8%; --opacity-pressed: 12%; /* use: control state layers */
}

/* ── Components ── only in that component's CSS; semantic tokens only ── */
:root {
  /* Buttons (references/ux/component-specs.md → Button): hover and pressed are a layer of the label color, 8% / 12% */
  --button-height:            var(--control-height-md);   /* 36px; padding 14px = 0.39 of the height */
  --button-padding-inline:    var(--space-3-5);
  --button-radius:            var(--radius-control);      /* shared with inputs and selects */
  --button-font:              var(--font-control);
  --button-primary-bg:        var(--color-accent);
  --button-primary-fg:        var(--color-on-accent);
  --button-secondary-bg:      var(--color-surface);
  --button-secondary-border:  var(--color-border);         /* the divider, not the input border */
  --button-danger-fg:         var(--color-danger);         /* on the page: red label, no fill */
  --button-danger-confirm-bg: var(--color-danger);         /* confirmation dialog only */
  --button-state-hover:       var(--opacity-hover);
  --button-state-pressed:     var(--opacity-pressed);
  --input-border:             var(--color-border-control);
  --input-border-error:       var(--color-danger);
}

@media (prefers-reduced-motion: reduce) { :root { --duration-feedback: 0ms; } }
```

Primitives (`--p-<hue>-<step>`) appear only when several semantic tokens share a value or the product shows a sequential scale; this example has none. Patterns (the remove-access confirmation, the first-use empty state) go in `variant-output/DESIGN.md`, not in the CSS.

**Also generate `variant-output/design-system-preview.html`** that shows the system in use (`references/design-system/system-decisions.md` §5): two or three compositions from the product's own content, built only from the system's tokens, each with the decision it shows; then a compact token reference grouped by role; components in their states, in context. Not a catalog of swatch grids, size ladders and spacing bars.

Check that every token is used: `node <skill-root>/scripts/ds-check.mjs variant-output/design-system.css --used-by variant-output/design-system-preview.html`. Use each reported token in a composition, or remove it from the system.

Open the preview immediately in browser.

### Step 1b — Design system from a picked direction (`pick B`)

A picked direction is a page, not yet a system. After `select` succeeds (`references/workflow/history.md`), turn B into a complete design system the rest of the product can build on. Do not generate one for a direction the user has not picked, and do not confirm it for them. If a system the skill generated is already confirmed (`designSystem.file` is `variant-output/design-system.css`), the directions were built on it: skip this step and say the system stays locked. Never overwrite a confirmed file: when the target path is already `designSystem.file` or listed in `designSystem.extensions`, write the candidate to `variant-output/design-system.candidate.css` and move it into place only on `ds confirm`.

1. **Collect what B actually uses.** Read B's owned files and `variants.B.tokens`: every color, font, size, weight, line height, spacing value, radius, shadow, duration and easing in the rendered page, and the components it contains (buttons, inputs, cards, tables, navigation, badges, charts) with the states it implements. `pick` selects; it does not edit. If you find a defect in B (a broken validation, a wrong initial state), list it in the report with the edit that fixes it (`fix B: …`) and leave B's files unchanged.
2. **Decide and audit** (`references/design-system/system-decisions.md` §1, §2, §6). Write the three to five decisions B's choice implies for this product. Sort B's traits into its point, which the system keeps, and generator habits (eyebrow labels, a slogan hero on a tool page, decorative numbers, a card around everything, a mood palette, a default font), which it drops or keeps only as a stated decision.
3. **Write `variant-output/design-system.css`**: the decisions at the top, then the layers of Step 1 sized to the product (§3) and layered with use notes and named pairs (§4): B's values that serve the decisions, normalized to scales, and the states the product needs that B never shows (hover, active, focus, disabled, error, empty, loading). No computed ramps or unused steps. Check text and interactive contrast against `references/design-system/color-and-contrast.md`. Before presenting, run `node <skill-root>/scripts/ds-check.mjs variant-output/design-system.css` (under a brand lock, add `--brand <designSystem.file>`). Generated content colors use exact `--color-on-<role>` / `--color-<role>` pairs, or a trailing `/* use: body; on: --color-bg --color-surface */` for text on several surfaces. Other color roles need a pair or an explicit `/* use: chart; contrast: non-text */` note; border/focus/overlay roles are already non-text. Legacy name guessing runs only on `--brand` files. Fix reported contrast and layer failures; missing, conditional, unsupported or translucent pairs stay unverified until rendered checks establish them. Never call an unverified pair passed. List each B value that the system normalizes (`17px → --text-base`) or drops (`dropped: uppercase eyebrow labels`) in a comment at the top of the file.
4. **Write `variant-output/design-system-preview.html`** as in Step 1: compositions from B's own content rebuilt with the system's tokens (for a members page: the member list mid role change, the remove-access confirmation, an empty or error state), then the token reference and each component B uses in its states. Run `ds-check.mjs` with `--used-by variant-output/design-system-preview.html` and use or remove each unused token. Open it with the preview workflow.
5. **Write `variant-output/DESIGN.md`**, the system's rules for the agents and people who build on it. The CSS holds the values; this file says how to use them. Sections, in this order: Overview (the decisions, each with what it rules out), Colors, Typography, Layout, Elevation & Depth, Shapes, Components, Do's and Don'ts. Name tokens (`--space-4`), never repeat raw values, and keep each section to the rules a builder would otherwise get wrong: which surface each text token goes on, which type step each heading level uses, when to use each elevation, which component states exist. Under Components, add a Patterns subsection for each recurring situation B has (when to use it, structure, copy rules, tokens). Under a brand-file lock, say what the brand fixes and what the extension adds. The section order follows Google's DESIGN.md draft so other tools can read it; the format is a draft there, so do not claim compatibility.
6. **Report and stop.** Print the decisions, the palette, fonts and scales, the normalizations and what was dropped from B, any proposed font change, and what the system adds beyond B. Next actions: `ds confirm` · `ds edit [section]` · `apply ds B` (prepare and apply B through history so it uses the system's tokens; one request, one undo). Leave `designSystem` unchanged until the user confirms; do not add a draft entry such as `confirmed: false`.

**When a brand file is already locked** (`designSystem.confirmed` with a project file such as `app/globals.css`): the brand stays the source of truth. Write `variant-output/design-system.css` with only the layers the brand leaves open (spacing, radius, elevation, motion, component states), referring to the brand's own variables with `var(--…)` and never redefining them. These layers are a system, not an inventory: normalize B's values to scales (a 4px or 8px spacing grid, a type ratio) as in step 2, and list the normalizations. On `ds confirm`, keep `designSystem.file` pointing at the brand file and add this file to `designSystem.extensions`.

### Step 2 — Confirm Design System (`ds confirm`)

When the user approves (says `ds confirm`, "looks good", "confirm this", "ship it"):

1. Write the approved system metadata to `.variant-work/system-confirm.json` (when it came from a pick, include `"source": "B"`; for a brand-file lock, retain its main file/fonts and add only extensions):
```json
{
  "file": "variant-output/design-system.css",
  "palette": "[palette name]",
  "fonts": ["[Display]", "[Body]"],
  "source": "B"
}
```

Run `node <skill-root>/scripts/variant-history.mjs confirm-system variant-output .variant-work/system-confirm.json` (an optional final project root supports nested output). Do not directly rewrite the context to simulate confirmation. The helper verifies a context backup before recording the system identity and a pending binding on its picked source; it leaves A/B/C files, token records, versions, undo stacks and selection unchanged. Only explicit user confirmation authorizes this command. Existing brand files/fonts remain locked. For an already-approved legacy system without a digest, explicitly register that same current definition with this command before a newly requested application; never silently reinterpret its old context or claim old code already adopted it.

2. Export the confirmed system as DTCG 2025.10 tokens, for Figma variables and other token tools. Pass every file of the system (under a brand-file lock: the brand file, then each extension):
```bash
node <skill-root>/scripts/ds-export.mjs variant-output/design-system.css --out variant-output/design-system.tokens.json
```
The CSS stays the source; regenerate the JSON after every `ds edit` and update `variant-output/DESIGN.md` with it, never edit the JSON by hand. The default groups by type; `--group-by layer` writes primitive/semantic/component groups with per-token `$type` and preserves alias paths (brand variables get a `brand` group when passed with `--brand <file>`). Do not silently change an existing project's export format. The command lists the tokens DTCG cannot express (`clamp()` sizes, `em` tracking, shorthands, multiple conditional values); name them in the confirmation instead of approximating them.

3. Print confirmation:
```
✦ Design system confirmed — locked as visual foundation
  File:    variant-output/design-system.css
  Tokens:  variant-output/design-system.tokens.json (DTCG · [n] tokens, [m] left out)
  Rules:   variant-output/DESIGN.md
  Palette: [name] · [hue]° OKLCH
  Type:    [Display font] + [Body font]

  Next steps:
    component [name]   → build atomic components on this foundation
    compose [page]     → assemble components into page layouts
    ds edit palette    → refine colors before building
```

4. The original picked page is pending adoption until the user requests `apply ds B`; confirmation does not retrofit or validate it. From this point forward, **all new Generate, Component, and Compose outputs** must `<link rel="stylesheet" href="design-system.css">` (or inline the tokens) — no aesthetic invention allowed outside the locked token system.

5. For product-critical work, compile the confirmed declaration into `variant-output/design-contract.md` and run the Product Integrity Gate separately from the visual quality gate.

### Apply the confirmed system to an existing direction (`apply ds B`)

This explicitly aligns code and its token record; it is not an ordinary variation and never selects a direction. Read `references/workflow/history.md` and use its prepare flow first. Replace B's values with the confirmed semantic tokens in the new candidate. Write a change JSON under `.variant-work/` with a summary, a unique request ID for this user action, and a complete `tokens` record: `fonts` exactly matches `designSystem.fonts`, and each recorded color is a supported value or resolvable CSS variable from the system. Preserve other token metadata accurately.

```bash
node <skill-root>/scripts/variant-history.mjs prepare variant-output B .variant-work/apply-system-B
# Edit only the prepared candidate and write .variant-work/apply-system-B.json.
node <skill-root>/scripts/variant-history.mjs apply-system variant-output B .variant-work/apply-system-B .variant-work/apply-system-B.json
```

`apply-system` requires the current confirmed identity; it refuses unknown fonts/colors, changed system files/extensions, stale candidates and out-of-zone changes. It snapshots files, tokens and binding together. Ordinary `apply` keeps its token lock. Run delivery and rendered checks on the actual result; unsupported color records must be resolved rather than guessed. `undo B` restores the previous files, tokens and pending/absent binding while retaining selection. After undo, report that the original page is pending adoption again rather than pretending it uses the new foundation.

### Step 3 — Build Components (`component [name]`)

When design system is confirmed, Component Mode runs on a tighter brief:
- All colors from `design-system.css` semantic tokens — **no new colors**
- All spacing from `design-system.css` spacing scale — **no new values**
- Typography from `design-system.css` type tokens
- Under a brand-file lock, "`design-system.css`" above means the brand file (`designSystem.file`) for colors and typography, plus the files in `designSystem.extensions` for the layers they add
- Add to component registry in `.variant-context.json`:

```json
{
  "components": {
    "button": "variant-output/component-button.html",
    "card":   "variant-output/component-card.html",
    "form":   "variant-output/component-form.html"
  }
}
```

Terminal output:
```
✦ Component: Button System  [DS: confirmed · Amber Warm · DM Sans]
  Tokens used: --color-accent, --color-surface, --space-2/3/4, --radius-md
  New tokens added: none

  variant-output/component-button.html ← opened in browser

  Registry: button · (no other components yet)
  Next: component card · component form · compose [page] using button
```

### Step 4 — Compose Pages (`compose [page name]`)

Assembles registered components into page layouts. **3 structural variations** — layout and composition differ; visual language does not.

**Process:**
1. Read `.variant-context.json` to get component registry
2. Read `design-system.css` for tokens (under a brand-file lock: `designSystem.file` and every file in `designSystem.extensions`)
3. For each variation, invent a different **structural arrangement**:
   - Variation A: canonical / expected layout for this page type
   - Variation B: unconventional hierarchy (e.g. sidebar-dominant, reversed stack)
   - Variation C: density variant (compact/information-dense vs. spacious/editorial)
4. All three use identical tokens and components — the only differences are grid, order, proportion, and density
5. Write `variant-output/compose-[page]-A.html`, `-B.html`, `-C.html`

**What changes across compose variations:**

| Dimension | Can vary | Cannot vary |
|---|---|---|
| Grid structure | ✓ | |
| Section order / hierarchy | ✓ | |
| Column count / proportion | ✓ | |
| Density (padding, gap) | ✓ — within spacing scale | |
| Which components are prominent | ✓ | |
| Colors | | ✗ — all from DS |
| Typography | | ✗ — all from DS |
| Component visual design | | ✗ — use as-built |
| New spacing values | | ✗ — DS scale only |

Terminal output:
```
✦ Compose: Dashboard page  [DS confirmed · 3 components registered]
  Components used: button · card · data-table
  Layout variations:
    A — Standard: left sidebar + main content grid
    B — Topbar: horizontal nav + full-width zones
    C — Focused: single column, task-driven, no sidebar

  Files:
    variant-output/compose-dashboard-A.html ← opened in browser
    variant-output/compose-dashboard-B.html
    variant-output/compose-dashboard-C.html

  Next: pick A/B/C · compose [another page] · tokens A
```

### DS Quick Triggers

| User types | Action |
|---|---|
| `ds` | Start design system generation workflow |
| `ds confirm` | Lock design system — constrains all future outputs |
| `ds show` | Print current DS summary (palette, fonts, status) |
| `ds edit palette` | Regenerate color section only, keep everything else |
| `ds edit type` | Regenerate typography section only |
| `ds edit spacing` | Regenerate spacing/radius section only |
| `ds edit motion` | Regenerate motion/animation section only |
| `ds preview` | Re-open design-system-preview.html in browser |
| `ds reset` | Remove DS lock, allow aesthetic invention again |
| `compose [page]` | Assemble page from registered components |
| `compose [page] using A B C` | Compose using only specified components |
| `registry` | Print component registry (which components are built) |

### When DS is NOT Confirmed

Standard Generate mode — full aesthetic invention per the normal workflow. Each variation picks its own palette, fonts, and direction.

### When DS IS Confirmed

Visual language is locked. The freedom space narrows to:
- Layout composition (grid, order, proportion)
- Content hierarchy (what's prominent, what's secondary)
- Interaction specifics (animation choreography within motion tokens)
- Copywriting and content strategy

Print a one-line reminder on every generation:
```
✦ DS locked: Amber Warm · DM Sans + Newsreader · variations differ in layout only
```


Artifact evidence automatically fingerprints the registered main system, extensions, variant binding and supported transitive local dependencies. After editing those, rerun observations; a prior report cannot certify the changed preview. Use the evidence reference to record actual wrapper/alias/config facts and additional dynamic roots. Integration preparation binds the same closure and adoption state; changed source/config/facts or legacy missing coverage requires a new plan. Partial dependency coverage remains explicit.

When reporting failed project checks, preserve actual structured diagnostics and compare them individually using `references/workflow/artifact-verification.md`. Keep original logs and old/new classifications; an observed-before failure still fails and never establishes delivery acceptance.
