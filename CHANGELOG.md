# Changelog

## Unreleased

### Website
- Website package `0.1.1` adds a bilingual editorial footer with a direct path back to inspiration, and marks the current skill version in the changelog.
- Website package `0.2.0`: every inspiration category is its own page (`/browse/web`, `/browse/interface`, `/browse/interaction`, `/browse/motion`, `/browse/branding`, and `/en/browse/...`), with its own title, description and prerendered list. A reference belongs to exactly one category, so no tab repeats another; the home page stays the full list. Categories with no reference yet (illustration, posters, print) get a tab when the first one is added. Old `?category=` links are rewritten to the new addresses.
- Phones: the six category tabs scroll in one row with the current one in view, and the filter bar no longer stays pinned over the list. A tab page is fetched as soon as a pointer, finger or keyboard focus reaches its link.
- Motion: moving between pages crossfades (not with reduced motion). Feed cards zoom on hover in 200ms instead of 360ms, the search box keeps a fixed width instead of animating it, and hover movement on case cards and the home button only applies where a device can hover. A generated reference brief rises into place. The save button answers with a colour fill and a press instead of a restarting pop, and navigation tabs no longer lift. With reduced motion the page keeps its opacity and colour feedback and the dialog still fades in; the lab preview frame no longer animates layout.
- Discovery: `feed.xml` now lists the references together with the direction cases, `sitemap.xml` carries `lastmod` for every page that has a recorded date, and a path with no page answers a real 404 (`404.html`, `noindex`) instead of the home page with status 200. Client-only routes (`/lab/canvas`, `/lab/workbench`, `/directions`, `/showcase`) are unchanged.
- Website package `0.2.1`: inspiration detail pages and card dialogs no longer jump when the preview image arrives; the layout shift measured in the lab drops from 0.138 to 0 on a phone and from 0.084 to 0.0005 on a desktop. A lab budget test now holds layout shift at 0.1 and bounds the script and style bytes of the home page.

### Install
- Claude Code plugin marketplace: `claude plugin marketplace add YuqingNicole/variant-design-skill`, then `claude plugin install variant-design@variant-design`. The update check prints the plugin update commands for this install.
- Sub-workflows are now named `skills/*/ROUTE.md` instead of `SKILL.md`, so Claude Code plugins, Codex and `npx skills` register only the router as a skill.
- DeepSeek Harness (`dsh`) finds the skill in `~/.agents/skills/variant-design` or a project's `.agents/skills`, the folder `npx skills add` uses.

### Design system
- `confirm-system` backs up context and records the approved system identity without editing the picked page. Explicit `apply-system` snapshots aligned code, token metadata and adoption state together; `undo B` restores the previous state. Ordinary variations retain their token lock, and prepared candidates cover every system extension.
- Contrast reports include checked and unverified pairs; generated systems use exact role pairs or explicit surface notes, with legacy guessing restricted to `--brand` files. Generated component tokens must alias semantic tokens; product references to another component's tokens are reported. DTCG adds opt-in `--group-by layer` with typed tokens and cross-layer aliases, and lists multiple conditional values instead of silently choosing one.
- After `pick B`, the skill derives a complete design system from B (`variant-output/design-system.css` and a preview with every component B uses, in all its states) and waits for `ds confirm`. With a locked brand file, it adds only the layers the brand leaves open and records them in `designSystem.extensions`.
- `delivery-check` reads those extensions (redefining a brand variable is an error) and warns about spacing, font-size and radius values off a confirmed system's scale, naming the nearest token. A system derived from B is checked against B only.
- `ds confirm` exports the system as DTCG 2025.10 tokens (`scripts/ds-export.mjs` → `design-system.tokens.json`) and lists what DTCG cannot express, such as `clamp()` sizes.
- The derived system comes with `variant-output/DESIGN.md`: usage rules for agents and people (which text token goes on which surface, which type step each heading uses, which component states exist), in the section order of Google's DESIGN.md draft.
- `scripts/ds-check.mjs` checks a system's own text/surface and on-color pairs for 4.5:1 contrast: drafts are fixed before they are shown, and `delivery-check` reports a confirmed system's failing pairs.
- A design system is now a few decisions about the product plus the tokens that carry them out, not a filled-in template (`references/design-system/system-decisions.md`). The skill writes three to five decisions, drops generator habits it finds in the picked direction (eyebrow labels, slogan heroes, decorative numbers, a card around everything, default fonts), and writes only tokens the product uses, each with a note on where. The preview shows the system on the product's own screens instead of swatch grids.
- Layers: semantic tokens for product code, component tokens for reused components with several states, primitives only when shared, and patterns (removal confirmation, empty states) in `DESIGN.md`. `ds-check.mjs --used-by` lists tokens nothing uses; `delivery-check` warns when product code uses a primitive; `ds-export` carries each token's use note into the DTCG `$description`.
- Buttons follow one spec checked against Material 3, Apple HIG, Radix, Primer, Atlassian, Polaris and Geist (`references/ux/component-specs.md` → Button). Labels use the interface sans even under a serif brand. Padding and radius scale with the height. Each view has one solid primary. Hover and pressed are derived with `color-mix`, focus is a single 2px ring, and danger stays a red label until the confirmation dialog. Previews use live buttons, not rows of fake hover states.
- Generated directions avoid generator habits (`references/workflow/quality-baseline.md` → Generator habits). An existing page keeps its job, title and copy: no slogans or promotional cards on product pages. Directions differ in structure before style, and a palette swap is not a direction. `quality-gate` lists eyebrow labels, decorative zero-padded numbers and direction names inside the UI as `review` findings to remove or justify; they never fail `--strict`.

### Brand lock
- When a project's own file sets the brand (such as `app/globals.css`), the skill registers that file in place instead of locking a copy in `variant-output/`.

## 1.1.0 — 2026-10-27

The skill now works inside an existing project from discovery to integration, and keeps the user's work safe at every step.

### Project-aware workflow
- Read-only project discovery before generating (`scripts/project-profile.mjs`), and task briefs bound to that profile with runtime observations (`scripts/design-task.mjs`).
- Design references recorded in the brief with their reuse terms. Direction cards from the Variant Design library convert into those records (`scripts/direction-card.mjs`).
- A delivery check before presenting A/B/C (`scripts/delivery-check.mjs`): three registered directions with distinct trade-offs, a shared task contract, a recommendation that is not a selection, and an intact design-system lock.

### Safe edits and integration
- Candidates carry a content baseline; stale candidates and edits outside a zone are rejected (`variant-history.mjs prepare` / `apply`).
- One user request is one undo, even across several applies.
- `variant-integrate.mjs` backs up every target before integrating a direction and refuses to roll back files edited afterwards.
- Version-bound artifact verification records which checks ran against which revision.

### Previews
- React previews mount from the project's own Vite; `react-preview.mjs --static` builds previews that open without a server, for sandboxed agents.
- Fixed a static-preview bug that corrupted bundled code containing `$&`, `$$` or `` $` ``.

### Skill text
- Loads by phase. The router is a route table plus shared rules; the generate route opens with a load map. Variation actions, zone edits, history, previews, and export and integration are separate files, each read only when that step comes up. `code-output.md` no longer forces the interaction pattern libraries on every run.
- References grouped by role: `workflow/`, `sources/`, `domains/`, `design-system/`, `ux/`, `tasks/`.
- The quality gate skips generated preview bundles (`_static/`, `_preview/`), so a whole `variant-output/` can be scanned in strict mode.
- Removed transcribed third-party "community examples" from the domain references.
- Only the root `SKILL.md` declares a skill, so Codex and `npx skills` no longer register sub-workflows as broken standalone skills.
- Component handoff specs and web interface checks.

### Install
- `npx skills add YuqingNicole/variant-design-skill -a claude-code -a codex` installs the complete skill.

### For contributors
- `evals/run.mjs` runs the working tree in Claude Code and Codex on fixture projects and grades the result.
- `scripts/skill-links.test.mjs` checks that every file the skill names exists and every reference is reachable.

Upgrading: `git -C <install path> pull --ff-only` for a Git clone, or `npx skills update variant-design`. The update check now prints the `npx skills` command for installs without `.git`. Project files in `variant-output/` are unchanged by an upgrade; context schema stays v2.
