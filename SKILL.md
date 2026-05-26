---
name: variant-design
description: AI-driven interactive design generation, style analysis, and UX evaluation with Impeccable design system. Context-aware output — auto-detects React projects (package.json with react dependency) and generates .tsx components; otherwise generates zero-dependency interactive HTML. Six modes — (1) Generate: 3 distinct, fully-animated design variations from a prompt, with zone-level iteration (vary/remix/shuffle a specific section); (2) Component: isolated UI components with all 8 states and variants — button systems, forms, cards, modals, nav; (3) Analyze: audit existing sites, extract design tokens, generate style-matched pages; (4) UX Review: heuristic evaluation (Nielsen's 10), cognitive load analysis, mental model diagnosis, affordance audit, dark pattern detection — grounded in NNG research; (5) Content formats: HTML pitch decks, WeChat article layout with 4 color schemes + 3 structural templates + inline styles + API upload flow; (6) Writing: anti-AI-taste Chinese copywriting across 4 text types (opinion/story/tutorial/product copy) and 3 platforms (公众号/小红书/产品内文案), with banned word list and before/after rewrites. Built-in Wu Xing (五行) color system with 40-tone palette, 26 combos, and cultural brand mapping. 16 domain references (including ux-heuristics, ux-psychology, presentation, wechat, wuxing-colors, voice), full design system (typography, color, spatial, motion, micro-interactions, interaction, responsive, UX writing, style audit), interactive pattern library, and anti-AI-slop quality gates. Triggers on: "design options for X", "show me variations", "vary this design", "audit", "analyze my site", "match this style", "extract tokens", "migrate", "add motion", "dramatize", "make interactive", "component button/form/card", "ux review", "heuristic evaluation", "usability audit", "cognitive load", "mental models", "affordances", "dark patterns", "review this design", "export to vue/astro/svelte", "pitch deck", "slides", "幻灯片", "PPT", "公众号", "wechat article", "微信文章", "五行配色", "wu xing", "brand color", "moodboard", "去AI味", "写文案", "copywriting".
---

# Variant Design

Solve the blank canvas problem. Prompt → 3 fully-formed distinct designs → vary → export.

## About

Inspired by the [Variant](https://variant.com) design community — a space where designers share divergent takes on the same brief. This skill brings that practice into Claude Code: every prompt yields three designs that feel like they came from different studios, then lets you iterate with one-word actions.

Built on the **Impeccable design system** — a comprehensive set of design references covering typography, color theory, spatial design, motion, interaction patterns, responsive design, and UX writing. Every design decision is grounded in these principles.

**Supports:** Context-aware output (HTML default · React .tsx when React project detected) · Framer Motion (when installed) · 10 domain reference libraries · 39 palettes · design system references · micro-interaction library · interactive pattern library · style audit & token extraction · variation actions

---

## CLI Workflow (Claude Code)

This skill runs inside Claude Code — a terminal. Design decisions must account for the fact that the user **cannot see the output** without opening a browser. Every step of the workflow should minimize friction between "idea" and "eyes on pixels."

### Output Format Detection

Before generating any design, detect the output format. Run this detection once per session and cache the result.

**Step 1: Read package.json**

```bash
cat package.json 2>/dev/null
```

If absent or unreadable → **HTML output** (fail-safe), print warning if unreadable. Do not traverse parent directories — check cwd only.

**Step 2: Walk the decision tree**

Parse dependencies / devDependencies / peerDependencies / optionalDependencies. Check for **exact keys only** — never substring-match (`react-scripts` ≠ `react`, `@vitejs/plugin-react` ≠ `vite`).

```
package.json exists?
│
├─ no  →  HTML (zero-dep default)
│
└─ yes → check keys:
    │
    ├─ "react" present?
    │   ├─ yes → React branch:
    │   │         ├─ "next" present?          → Next.js App Router .tsx
    │   │         │                              add "use client" on components
    │   │         │                              using hooks/animations/browser APIs
    │   │         ├─ "vite" or               → Vite .tsx
    │   │         │  "@vitejs/plugin-react"     preview: read scripts.dev → npm run dev
    │   │         └─ neither                 → Generic React .tsx
    │   │
    │   └─ no → non-React branch:
    │           ├─ "vue" present?             → Vue 3 .vue SFC
    │           │                               <script setup> + <template> + <style scoped>
    │           │                               preview: npm run dev (Vite assumed)
    │           ├─ "astro" present?           → Astro .astro component
    │           │                               frontmatter + HTML template
    │           │                               no client-side JS unless :is="client:load"
    │           ├─ "svelte" or               → Svelte .svelte component
    │           │  "@sveltejs/kit" present?     <script> + markup + <style>
    │           │                               SvelteKit if @sveltejs/kit detected
    │           └─ none of the above         → HTML (zero-dep default)
```

**Step 3: Check for animation library (React branch only)**

- `"framer-motion"` or `"motion"` in deps → use Framer Motion (`motion.div`, `AnimatePresence`, `useInView`)
- Not found → CSS animations only — do **not** import Framer Motion (missing package = runtime error)

**Step 4: Apply user override**

Explicit user instruction always wins over detection:

| User says | Output |
|---|---|
| `--react` or `react [A/B/C]` | Force React (auto-detect Next/Vite sub-type) |
| `--html` | Force zero-dep HTML |
| `--vue` | Force Vue 3 SFC |
| `--astro` | Force Astro component |
| `--svelte` | Force Svelte component |
| `export to next/vite/astro/svelte` | Force that framework |

**Step 5: Announce the format**

Print one line before generating:

```
✦ Output format: Next.js .tsx — detected next in package.json
✦ Output format: Vue 3 SFC .vue — detected vue in package.json
✦ Output format: Astro .astro — detected astro in package.json
✦ Output format: Svelte .svelte — detected @sveltejs/kit in package.json
✦ Output format: Interactive HTML — no framework detected in cwd
✦ Output format: React .tsx — user requested --react
```

**Edge cases:**
- `.tsx` files exist but no `react` key → HTML output (Preact/Solid/stale files don't count)
- Both `vue` and `nuxt` detected → treat as Nuxt 3 (same SFC format, note `useNuxtApp` available)
- Monorepo: check cwd only, never traverse to parent `package.json`
- Multiple frameworks in same `package.json` (unusual) → print ambiguity warning, ask user to pass `--[framework]`

---

### Framework Output Templates

Each framework has its own file template, preview command, and import note.

#### Next.js App Router

```tsx
// variant-output/VariantA.tsx
// Generated by variant-design — move to app/components/ or src/components/
// Preview: npm run dev (then import this component in your page)
"use client"; // include when component uses hooks, animations, or browser APIs

import { useState, useEffect, useRef } from "react";
// import { motion } from "framer-motion"; // only if framer-motion detected

export default function VariantA() {
  // ...
}
```

Preview instruction after writing file:
```
✦ Written: variant-output/VariantA.tsx
  Move to app/components/VariantA.tsx, then import in your page:
  import VariantA from "@/components/VariantA"
  Preview: npm run dev
```

#### Vite React

```tsx
// variant-output/VariantA.tsx
// Generated by variant-design — move to src/components/
// Preview: npm run dev (Vite), then import this component

import { useState, useEffect, useRef } from "react";

export default function VariantA() {
  // ...
}
```

Preview: read `package.json scripts` → use `npm run dev` / `pnpm dev` / `yarn dev` based on detected package manager. Fallback: `npx vite`.

#### Generic React

Same as Vite template without Vite-specific notes. Preview: `npx vite` as fallback.

#### Vue 3 SFC

```vue
<!-- variant-output/VariantA.vue -->
<!-- Generated by variant-design — move to src/components/ -->
<!-- Preview: npm run dev -->

<script setup lang="ts">
import { ref, onMounted } from "vue";
// animations: use CSS transitions/animations (no framer-motion in Vue)
// for complex motion: @vueuse/motion or vanilla CSS
</script>

<template>
  <div class="variant-a">
    <!-- ... -->
  </div>
</template>

<style scoped>
/* OKLCH colors as CSS custom properties */
.variant-a {
  --color-primary: oklch(65% 0.2 250);
  /* ... */
}
</style>
```

**Vue rules:**
- `<script setup>` always — no Options API
- `lang="ts"` unless project has no TypeScript
- Animations via CSS transitions + `v-enter-active` / `v-leave-active` transition classes
- No Framer Motion — Vue has its own `<Transition>` and `<TransitionGroup>`
- Reactivity: `ref()` for primitives, `reactive()` for objects, `computed()` for derived state

#### Astro Component

```astro
---
// variant-output/VariantA.astro
// Generated by variant-design — move to src/components/ or src/pages/
// Preview: npm run dev

// Astro components have no client-side reactivity by default
// Use client:load / client:visible for interactive islands
interface Props {
  title?: string;
}
const { title = "Default Title" } = Astro.props;
---

<section class="variant-a">
  <!-- ... -->
</section>

<style>
  /* Scoped by default in Astro */
  .variant-a {
    --color-primary: oklch(65% 0.2 250);
  }
</style>

<!-- Add client:load only for interactive sections -->
<!-- <InteractiveIsland client:load /> -->
```

**Astro rules:**
- Frontmatter (`---`) for server-side logic only — no `useState`, no `useEffect`
- Styles scoped by default — no need for CSS modules
- Interactive sections: extract to a separate `.tsx` / `.vue` / `.svelte` island, import with `client:load` or `client:visible`
- No JavaScript in `<script>` unless truly necessary — Astro ships zero JS by default

#### Svelte / SvelteKit

```svelte
<!-- variant-output/VariantA.svelte -->
<!-- Generated by variant-design — move to src/lib/components/ -->
<!-- Preview: npm run dev -->

<script lang="ts">
  import { onMount } from "svelte";
  // animations: svelte/transition and svelte/animate built-in
  import { fade, fly, slide } from "svelte/transition";
  import { tweened } from "svelte/motion";

  let visible = false;
  onMount(() => { visible = true; });
</script>

<div class="variant-a">
  {#if visible}
    <section transition:fly={{ y: 20, duration: 400 }}>
      <!-- ... -->
    </section>
  {/if}
</div>

<style>
  .variant-a {
    --color-primary: oklch(65% 0.2 250);
  }
</style>
```

**Svelte rules:**
- Use built-in `svelte/transition` and `svelte/animate` — no Framer Motion
- `tweened()` and `spring()` from `svelte/motion` for number animations (counters, progress bars)
- `{#if}` / `{#each}` / `{#await}` blocks — no JSX
- Reactivity is assignment-based: `count += 1` triggers re-render automatically
- SvelteKit: routes in `src/routes/`, components in `src/lib/components/`

### Output Convention

**File naming:** `variant-[scenario]-[variation].html` (e.g., `variant-dashboard-A.html`)

**Output directory:** Write to `./variant-output/` in the current working directory. Create the directory if it doesn't exist. This keeps design files separate from project source code.

```
variant-output/
├── variant-dashboard-A.html
├── variant-dashboard-B.html
├── variant-dashboard-C.html
└── tokens/
    └── dashboard-A-tokens.css    (when user extracts tokens)
```

**Iteration files:** On variation actions, overwrite the same file (e.g., `variant-dashboard-A.html`) rather than creating `variant-dashboard-A-v2.html`. The user is iterating on one design, not collecting versions. Git handles history.

### Auto-Preview

**After every file write, immediately open it in the user's default browser:**

```bash
# macOS
open variant-output/variant-dashboard-A.html

# Linux
xdg-open variant-output/variant-dashboard-A.html
```

This is non-negotiable. The user should never have to manually find and open the file. When iterating (Vary subtle, Remix colors, etc.), the browser tab auto-refreshes because the file is overwritten — just re-run `open` to bring it to focus.

### Live Preview Server (Optional)

If the user asks for live preview or says "watch mode", start a lightweight file server with auto-reload:

```bash
# Using Python (available on most systems)
cd variant-output && python3 -c "
import http.server, socketserver, os, time, threading

class ReloadHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def do_GET(self):
        if self.path == '/_poll':
            self.send_response(200)
            self.send_header('Content-type', 'text/plain')
            self.end_headers()
            self.wfile.write(str(os.path.getmtime('.')).encode())
            return
        super().do_GET()

with socketserver.TCPServer(('', 3333), ReloadHandler) as httpd:
    print('Preview: http://localhost:3333')
    httpd.serve_forever()
" &
```

Then inject a tiny auto-reload script at the bottom of every generated HTML:
```html
<script>
// Auto-reload in dev (remove for production)
(async function poll() {
  try {
    const r = await fetch('/_poll');
    const t = await r.text();
    if (window._lastMod && t !== window._lastMod) location.reload();
    window._lastMod = t;
  } catch(e) {}
  setTimeout(poll, 800);
})();
</script>
```

Only include this script when the preview server is running. Remove it on export.

### Compact CLI Output

Terminal space is precious. Keep text responses short and structured:

**On initial generation (3 variations):**
```
✦ Detected: coffee brand landing page → loading food-beverage.md + micro-interactions.md

  A — Terroir Warm       Fraunces + Instrument Sans    Minimal/Editorial
  B — Espresso Dark      DM Serif Display + DM Sans    Dark/Premium
  C — Fresh Market       Crimson Pro + Plus Jakarta     Warm/Human

  Interactions: scroll reveal, counter animation, card lift, filter chips, lightbox

  Files written:
    variant-output/variant-coffee-A.html  ← opened in browser
    variant-output/variant-coffee-B.html
    variant-output/variant-coffee-C.html

  Pick a variation to iterate, or an action:
  Reshape — Vary strong · Distill · Shuffle layout · Change style
  Tune    — Vary subtle · Remix colors · Mix (A+B)
  Animate — Add motion · Dramatize · Make interactive
  Refine  — Polish · Critique · See other views
  Export  — Extract tokens · react A · react B · react C
```

After initial generation, write context with detected scenario, the chosen palettes, and fonts for all 3 variations. Do not write `picked` yet — user hasn't chosen.

**On iteration:**
```
✦ Variation A — Vary subtle · iteration 2  [Terroir Warm · Editorial]

  Changed: tightened spacing to 4pt grid, added tabular-nums on stats,
  hover now lifts 4px→6px with shadow, scroll stagger 60ms→80ms

  variant-output/variant-coffee-A.html  ← updated & opened

  Next action? (react A to export as React component)
```

After each iteration, update context: increment `iterations`, update `picked` if the user is iterating on a specific variation (implies selection).

**Never dump the full HTML in the chat.** Write to file, open in browser, show a 2-3 line summary of what changed. The user reads code in their editor, not in the terminal.

### Quick Triggers

Support shorthand prompts for fast iteration in the terminal:

| User types | Expands to |
|---|---|
| `A vary strong` | Apply "Vary strong" to Variation A |
| `B remix colors` | Apply "Remix colors" to Variation B |
| `C → mobile` | Show Variation C as mobile viewport |
| `pick A` | Select Variation A as the winner, archive B and C |
| `A + B colors` | Mix: A's layout with B's color palette |
| `tokens A` | Extract design tokens from Variation A to CSS file |
| `open B` | Re-open Variation B in browser |
| `dark mode A` | Generate dark ↔ light toggle variant of A |
| `compare` | Open all 3 variations side-by-side (writes a comparison HTML) |
| `react A` | Export Variation A as React .tsx component (alias for `export to react`, Variation A) |
| `react B` | Export Variation B as React .tsx component |
| `react C` | Export Variation C as React .tsx component |
| `reset context` | Delete `.variant-context.json` and start fresh — next generation ignores all persisted preferences |
| `show context` | Print the current `.variant-context.json` contents in the terminal |
| `A vary strong — hero` | Zone-level: vary strong on hero section only, rest unchanged |
| `B remix colors — card` | Zone-level: remix colors on card zone only |
| `zones A` | List all `data-zone` sections found in Variation A |
| `component button` | Component mode: button system with all variants and states |
| `component form` | Component mode: form components |
| `component card` | Component mode: card variants |

### Context Commands

**`show context`** — Print the current context:

```bash
cat ./variant-output/.variant-context.json 2>/dev/null || echo "(no context saved yet)"
```

Display as a formatted single-line summary, e.g.:
```
✦ Context: Amber Warm · Editorial · Instrument Serif + Instrument Sans · picked B · 4 iterations
  Framework: next · Scenario: landing-page
  Notes: user prefers high contrast, no dark mode
```

**`reset context`** — Delete the context file and confirm:

```bash
rm -f ./variant-output/.variant-context.json
```

Print: `✦ Context cleared — next generation starts fresh.`

### Comparison View

When the user says "compare" or wants to see all variations together, generate a single `variant-output/_compare.html` that displays all 3 side-by-side in iframes:

```html
<style>
  body { margin:0; display:grid; grid-template-columns:1fr 1fr 1fr; height:100vh; gap:2px; background:#111; }
  iframe { width:100%; height:100%; border:none; }
  .label { position:absolute; top:8px; left:12px; background:#111; color:#fff; padding:4px 12px;
    font:12px/1 monospace; border-radius:4px; z-index:10; }
  .frame { position:relative; }
</style>
<div class="frame"><span class="label">A</span><iframe src="variant-coffee-A.html"></iframe></div>
<div class="frame"><span class="label">B</span><iframe src="variant-coffee-B.html"></iframe></div>
<div class="frame"><span class="label">C</span><iframe src="variant-coffee-C.html"></iframe></div>
```

### Framework Export

When the user says "export to [framework]" or `react [A/B/C]`, transform the winning variation into the target structure:

| Target | Action |
|---|---|
| `export to next` | Next.js App Router .tsx — `"use client"` where needed, tokens in CSS file |
| `export to vite` | Vite React .tsx — `src/App.tsx` structure, preview via `npm run dev` |
| `export to vue` | Vue 3 SFC .vue — `<script setup lang="ts">` + scoped styles + `svelte/transition` equivalents via CSS |
| `export to astro` | Astro .astro — frontmatter + template + scoped styles, interactive parts as `client:load` islands |
| `export to svelte` | Svelte .svelte — `svelte/transition` animations, `tweened()` for counters, no Framer Motion |
| `export to static` | Clean HTML — remove dev scripts, inline critical CSS |
| `react [A/B/C]` | Shorthand for `export to react` — auto-detects Next vs Vite vs generic from cwd |
| `vue [A/B/C]` | Shorthand for `export to vue` on the specified variation |
| `astro [A/B/C]` | Shorthand for `export to astro` on the specified variation |
| `svelte [A/B/C]` | Shorthand for `export to svelte` on the specified variation |

Always ask which variation to export if the user hasn't picked one yet.

**Preview after React export:** Do not run `vite --open` directly — it may bypass project config. Instead, read `package.json.scripts` and print the correct dev command:
- If scripts contains `"dev"` → print `npm run dev` (or `pnpm dev` / `yarn dev` / `bun dev` based on detected package manager)
- If scripts contains `"start"` → print `npm start`
- If no scripts found → print `npx vite` as fallback, with a note

Example output after React export:
```
✦ Exported: variant-output/VariantA.tsx
  Move to src/components/ to include in your project's build.
  Preview: npm run dev  (then open the page that imports this component)
```

### Clipboard Mode

If the user says "copy" or "clipboard", copy the HTML to system clipboard instead of (or in addition to) writing the file:

```bash
# macOS
cat variant-output/variant-coffee-A.html | pbcopy
```

Useful for pasting into CodePen, Claude.ai artifacts, or other tools.

---

## Project Context Initialization

### Session Start: Read Persisted Context

**Before doing anything else**, check for a context file in the output directory:

```bash
cat ./variant-output/.variant-context.json 2>/dev/null
```

If the file exists and is valid JSON, load it silently and print one line:

```
✦ Resuming context: [palette] · [direction] · picked [variation] · iteration [n]
  (reset context to start fresh)
```

Use all fields as constraints for the current session — the user should not need to re-specify preferences they've already confirmed.

If the file does not exist, proceed to the first-use questions below.

### First Use: Gather Context

On first use in a project, gather design context to ground all future generations. Ask the user:

1. **Users & Purpose** — Who uses this? What problem does it solve? What's the core task?
2. **Brand & Personality** — Existing brand colors? Tone (playful / serious / technical / warm)? Any sites you admire?
3. **Aesthetic Preferences** — Light or dark? Minimal or dense? Any direction from the aesthetic table you're drawn to?
4. **Constraints** — Framework requirements? Accessibility standards beyond baseline? Target devices?

If the user can't answer, infer from their codebase: scan for existing color variables, font imports, component patterns, and README/brand docs. Confirm inferences before proceeding.

### Persist Context After Each Decision

Write `./variant-output/.variant-context.json` whenever the user makes a meaningful choice. Create `variant-output/` first if it doesn't exist.

**Schema:**

```json
{
  "palette": "Amber Warm",
  "fonts": ["Instrument Serif", "Instrument Sans"],
  "direction": "Editorial",
  "scenario": "landing-page",
  "picked": "B",
  "iterations": 3,
  "framework": "next",
  "notes": "user prefers high contrast, no dark mode"
}
```

**When to update:**
- After user picks a palette or confirms a direction → update `palette`, `direction`, `fonts`
- After user says `pick A/B/C` → update `picked`
- After each variation action (vary, remix, shuffle) → increment `iterations`
- After scenario is detected and confirmed → update `scenario`
- After framework is detected → update `framework`
- After user gives a preference constraint → append to `notes`

**Fields are optional** — write only what's known. Do not guess or fill in defaults.

Write the file silently (no terminal output). If write fails (e.g. no write permission), continue silently — context persistence is best-effort, never blocking.

---

## Site Analysis Mode

When the user points to existing code (file paths, a directory, or says "analyze/audit/check my site"), switch from generation mode to analysis mode. Load `references/design-system/style-audit.md` for the full methodology.

### Triggers

| User says | Action |
|---|---|
| "analyze my site" / "audit this" / "check consistency" | Full style audit → report |
| "match this style" / "follow existing design" / "extend my site" | Extract tokens → generate matching pages |
| "extract tokens" (on existing files, not a generated variation) | Token extraction → CSS custom properties file |
| "what's wrong with this design" / "review my CSS" | Style consistency check → findings list |
| "migrate" / "consolidate" / "clean up" | Audit → token generation → migration plan |
| "add a [page] to my site" / "new page matching my existing design" | Extract → match → generate |

### Analysis Workflow

**Step 1: Scan** — Read the files the user points to. If no specific files given, scan for:
```bash
# Auto-detect entry points
find . -name "*.html" -o -name "*.css" -o -name "*.tsx" -o -name "*.jsx" \
  -o -name "*.vue" -o -name "*.svelte" | head -20
# Also check for:
# - tailwind.config.* (Tailwind projects)
# - globals.css / index.css / app.css (common entry CSS)
# - tokens.css / variables.css / theme.* (existing token files)
```

**Step 2: Extract** — Pull all design primitives following the Token Extraction schema in `style-audit.md`: colors, typography, spacing, components, transitions. Group by semantic role.

**Step 3: Detect** — Run all consistency checks from `style-audit.md` Section 2. For each finding, record severity (error/warning/info), the specific values, file locations, and a concrete fix.

**Step 4: Report** — Present findings using the compact terminal format from `style-audit.md` Section 3. Score out of 100. List priority fixes.

**Step 5: Act** — Based on what the user wants:
- **Audit only**: Stop after the report. Offer to generate a token file or migration plan.
- **Extract tokens**: Generate a `tokens.css` file consolidating all values (see `style-audit.md` Section 4).
- **Generate matching page**: Lock extracted tokens as constraints, generate new pages that match (see below).
- **Migration plan**: Generate phased checklist for consolidating the codebase (see `style-audit.md` Section 6).

### Style-Matched Generation

When generating new pages for an existing project, the workflow changes:

1. **Extract first** — Always analyze existing code before generating. Never guess the style.
2. **Lock tokens** — All generated code must use `var(--*)` referencing the existing token system. If no token system exists, generate one first and get user approval.
3. **Match patterns** — Study existing component shapes (card radius, shadow, padding), interaction patterns (transition durations, hover effects), layout patterns (container width, grid), and naming conventions (BEM, Tailwind, CSS modules).
4. **Show diff from existing** — In the Summary Card, note which tokens/patterns are being reused vs. which are new additions.
5. **Flag deviations** — If the design system principles (from Impeccable) conflict with the existing style, flag it: *"Your existing buttons have no hover state — I've added one following your color palette. OK?"*

**Summary Card for style-matched generation:**
```
✦ New page: /pricing — matching existing site style

  Reusing: --bg, --surface, --card, --border, --text, --muted, --accent
  Reusing: Plus Jakarta Sans 400/600, 4 font sizes, 8px grid
  Reusing: .card (24px padding, 8px radius, 1px border)
  Reusing: .btn (100px radius, 200ms transition)

  New additions:
  + Pricing toggle (monthly/annual) — uses existing .btn style
  + FAQ accordion — uses existing .card + new grid height animation
  + Comparison table — new component, follows existing spacing/color

  File: variant-output/pricing-matched.html ← opened in browser
```

### Quick Triggers for Analysis

| User types | Action |
|---|---|
| `audit` | Full style audit on current project |
| `audit src/styles/` | Audit specific directory |
| `tokens` | Extract tokens from existing code → CSS file |
| `match` | Enter style-matched generation mode |
| `new page pricing` | Generate /pricing page matching existing style |
| `migrate` | Generate migration plan for token consolidation |
| `compare old new` | Side-by-side: existing page vs. redesigned version |

---

## UX Review Mode

When the user wants to evaluate usability rather than generate visuals, switch to UX Review mode. Load `references/ux-heuristics.md` and `references/ux-psychology.md`.

### Triggers

| User says | Action |
|---|---|
| "ux review" / "heuristic review" / "usability audit" | Full heuristic evaluation against Nielsen's 10 |
| "review this design" / "what's wrong with this UI" | Heuristic scan → findings list with severity |
| "check usability" / "is this good UX" | Walk through flow, flag violations |
| "cognitive load" / "too complex?" | Cognitive load analysis → reduction suggestions |
| "why do users get confused here" | Mental model analysis → mismatch diagnosis |
| "affordances" / "does this look clickable" | Affordance/signifier audit |
| "dark patterns" / "is this ethical" | Dark pattern scan |

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

# Accessibility baseline
grep -rn "<img " \
  --include="*.tsx" --include="*.jsx" --include="*.html" \
  --exclude-dir=node_modules . 2>/dev/null | grep -v "alt=" | head -10
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
| Mental models, cognitive load, Gestalt | `references/ux-psychology.md` |
| Both | Load both — they complement each other |

**For generation tasks:** Load these references as silent quality constraints. Every generated design should pass the heuristic checklist before being presented — this is part of the quality gate, same as the AI Slop Test.

---

## Smart Prompt Handling

Before generating, apply these three rules in order:

1. **Confirm scenario detection.** State the detected scenario and aesthetic direction. Ask the user to confirm before proceeding: *"I'm reading this as a [scenario] with [direction] vibes — correct?"*
2. **Resolve vague prompts — max 2 questions.** If the prompt lacks enough signal to differentiate 3 variations (e.g. "design something cool"), ask at most 2 clarifying questions. Focus on: (a) what it's for / who uses it, (b) any aesthetic leaning. If the user says "surprise me," pick 3 maximally divergent directions and proceed.
3. **Never generate blind.** Do not produce code until you have either (a) user confirmation of the scenario, or (b) answers to your clarifying questions, or (c) an explicit "surprise me."

---

## Scenario Detection → Load Reference

Identify the scenario and load the corresponding reference file before designing:

| User asks about... | Also matches | Load |
|---|---|---|
| Dashboard, analytics, metrics, monitoring, data viz | 后台, admin panel, management system, backoffice, CRM, internal tool | `references/dashboard.md` |
| Editorial, magazine, journalism, news, article | blog post, report, white paper, newsletter | `references/editorial.md` |
| Landing page, SaaS, product page, startup, B2B | website, 官网, corporate site, personal site, portfolio, agency | `references/saas.md` |
| E-commerce, shopping, product, fintech card, consumer | store, shop, marketplace, cart, checkout | `references/ecommerce.md` |
| Education, learning app, quiz, language, science | lesson, flashcard, tutorial, training, course | `references/education.md` |
| Generative art, music tool, 3D, creative tool, synthesizer | tool, studio, editor, canvas, sequencer, DAW | `references/creative.md` |
| Mobile app, iOS, Android, onboarding, home screen | app, 应用, 界面, UI screen | `references/mobile.md` |
| Portfolio, personal site, showcase, case study | designer portfolio, developer site, freelancer, agency, 作品集 | `references/portfolio.md` |
| Restaurant, recipe, food, coffee, bakery, menu | café, bar, cocktail, wine, tea, meal planning, 餐厅, 菜单 | `references/food-beverage.md` |
| Fashion, clothing, beauty, lookbook, interior design | streetwear, luxury brand, skincare, cosmetics, furniture, 时尚, 服装 | `references/fashion.md` |
| Pitch deck, slides, presentation, keynote, investor deck | 幻灯片, PPT, 演讲稿, deck | `references/presentation.md` |
| WeChat article, 公众号, wechat post, 微信文章 | 公号排版, 推文, 内容排版 | `references/wechat.md` |
| Brand color, moodboard, 五行, wu xing, chinese color, 品牌配色 | 东方美学, 传统配色, 文化品牌 | `references/wuxing-colors.md` |
| Writing, 文案, copywriting, 去AI味, anti-AI writing | 公众号, 小红书, 产品文案, 观点文, 故事文, 教程文, voice | `references/voice.md` |
| UX review, heuristic evaluation, usability audit, cognitive load, mental models | "is this good UX", affordances, dark patterns | `references/ux-heuristics.md` + `references/ux-psychology.md` |
| Unsure / general | | Use aesthetic directions table below + `references/palettes.md` |

**Always also load the relevant design system references** from `references/design-system/` based on what matters most for the design:

| Design challenge | Load |
|---|---|
| Font selection, type scale, hierarchy | `references/design-system/typography.md` |
| Color palette, dark mode, contrast | `references/design-system/color-and-contrast.md` |
| Layout, spacing, grids, visual hierarchy | `references/design-system/spatial-design.md` |
| Animations, transitions, loading states | `references/design-system/motion-design.md` |
| Micro-interactions, scroll reveals, hover effects | `references/design-system/micro-interactions.md` |
| Functional interactions (filter, drag, charts, forms) | `references/interactive-patterns.md` |
| Forms, states, focus, keyboard nav | `references/design-system/interaction-design.md` |
| Style audit, token extraction, consistency checks | `references/design-system/style-audit.md` |
| Mobile-first, breakpoints, fluid design | `references/design-system/responsive-design.md` |
| Labels, errors, empty states, microcopy | `references/design-system/ux-writing.md` |

For initial generation, load at minimum: **typography**, **color-and-contrast**, **spatial-design**, and **micro-interactions**. Load **interactive-patterns** when the design involves filtering, forms, charts, galleries, or drag-and-drop. Load others as the design demands.

## Core Workflow

### 0. Load Persisted Context (Every Session)

Before parsing the prompt, run the context check from "Project Context Initialization → Session Start". If a `.variant-context.json` exists, apply its values as soft constraints on all generation steps: palette selection, font choices, direction, and framework output format. The user can override any field by stating a preference explicitly.

### 1. Parse → Detect → Load
Identify scenario, load domain reference file + relevant design system references, pick 3 starter prompts and palettes. Study the Real Community Examples for composition patterns and what makes each design work — extract the principle, not the surface style.

### 2. Generate 3 Distinct Variations

Each variation = a different studio's interpretation. Never two in the same direction.

**Universal aesthetic directions:**

| Direction | Feel | Signature |
|---|---|---|
| Minimal / Editorial | Type-driven, generous space | One strong font, minimal color |
| Bold / Expressive | High contrast, graphic | Dominant color block |
| Dark / Premium | Moody, atmospheric | Deep bg, elevated surfaces (not shadows) |
| Warm / Human | Rounded, approachable | Soft palette, organic forms |
| Data / Technical | Dense, systematic | Grid, monospace, tight |
| Neo-brutalist | Raw, unconventional | Bold outlines, broken grid |
| Luxury / Silence | Maximum negative space | One image, sparse text |

**For each variation, define before coding:**
- Starter prompt (from reference or custom)
- Color palette (from reference or `palettes.md`) — use OKLCH for perceptually uniform colors where possible
- Typography: display font + body font (see banned fonts list below)
- Layout pattern (from reference) — consult `spatial-design.md` for grid and hierarchy principles
- Motion strategy — consult `motion-design.md` for timing and easing
- **Interaction plan** — which micro-interactions and interactive patterns from `micro-interactions.md` and `interactive-patterns.md` to include (minimum 3 micro-interactions + domain-specific patterns)
- One signature detail that makes this variation unforgettable

### 3. Implement & Present

Working code — HTML (default) or React. Real content, no lorem ipsum. Visually complete.

**Write each variation to a separate file** following the CLI Output Convention (see "CLI Workflow" section). Never dump full HTML into the chat — write to `variant-output/` and open in browser.

Present a **compact Summary Card** in the terminal for each variation:

> **A — [Name]** · [Direction] · [Palette] · [Fonts]
> Layout: [pattern] · Signature: [detail] · Interactions: [list]

Then show the file paths and open the first variation in the browser. The user reads the design in the browser, not in the terminal.

### 4. AI Slop Test (Quality Gate)

Before presenting, run this check on each variation:

> If you showed this interface to someone and said "AI made this," would they believe you immediately? If yes, redesign.

A distinctive interface should make someone ask "how was this made?" not "which AI made this?" Review the Anti-Patterns table below — they are the fingerprints of AI-generated work.

**Interactivity gate**: Before presenting, also verify: Does this page move? Scroll down — do elements animate in? Hover a card — does it respond? Click a button — does it give feedback? If anything is dead on interaction, fix it before presenting.

After passing, show a one-line confidence signal: e.g. *"Passed: distinctive fonts, OKLCH palette, tinted neutrals, WCAG AA, scroll reveals, counter animation, card hover lift, no AI slop patterns detected."*

### 5. Offer Variation Actions

After presenting, always offer grouped by intent:

> Which direction resonates? Pick an action:
>
> **Reshape** — Vary strong · Distill · Shuffle layout · Change style
> **Tune** — Vary subtle · Remix colors · Mix (e.g. "Mix A + B")
> **Animate** — Add motion · Dramatize · Make interactive
> **Refine** — Polish · Critique · See other views
> **Export** — Extract tokens
>
> Can't decide? Say **"Mix A + B"** or **"A's layout + C's colors"**.

---

## Zone-Level Variation

By default, variation actions replace the entire design. **Zone syntax** lets you target a specific section — everything outside the zone stays untouched.

### Zone Syntax

```
[variation] [action] — [zone]

Examples:
  A vary strong — hero
  B remix colors — card
  C shuffle layout — sidebar
  A vary subtle — nav
  B distill — footer
```

Zones are **semantic** — they refer to the role of the section, not a CSS class name. Recognized zone names:

| Zone | Matches |
|------|---------|
| `hero` | Top section, headline, CTA, background |
| `nav` / `header` | Navigation bar, logo, links |
| `card` | Any card component or card grid |
| `sidebar` | Side panel, filters, secondary nav |
| `footer` | Bottom section |
| `form` | Any form or input group |
| `chart` / `data` | Data visualization, metrics, stats |
| `cta` | Call-to-action button or section |
| `modal` | Overlay, dialog, drawer |
| `[custom]` | User can name any section: "pricing table", "testimonials", "team grid" |

### How to Apply Zone Variations

**Step 1: Identify the zone in the file**

Before making changes, read the current file and locate the zone by its semantic role — look for the `data-zone` attribute (if present), or identify it from the HTML structure.

**Step 2: Mark zones on first generation**

When generating initial HTML/TSX, annotate major sections with `data-zone`:

```html
<section data-zone="hero"> ... </section>
<nav data-zone="nav"> ... </nav>
<section data-zone="cards"> ... </section>
<aside data-zone="sidebar"> ... </aside>
<section data-zone="cta"> ... </section>
<footer data-zone="footer"> ... </footer>
```

For TSX, use a `data-zone` prop on the top-level element of each section component.

**Step 3: Isolate and rewrite the zone**

Read the current file. Extract only the content inside the target `data-zone`. Apply the action (vary strong, remix colors, etc.) to that section alone. Rewrite only that section in the file — preserve everything else character-for-character.

**Step 4: Report**

```
✦ Variation A — Remix colors · hero zone only · iteration 3

  Changed: hero background oklch(15% 0.02 240) → oklch(20% 0.15 45) (warm amber)
  hero headline color, gradient, and CTA button updated to match
  Cards, nav, footer unchanged

  variant-output/variant-coffee-A.html ← updated & opened
```

### Zone Variation Rules

- **Preserve outside zones exactly.** Do not reflow, re-indent, or reformat code outside the target zone — even if it looks messy.
- **Tokens cascade.** If the zone uses CSS custom properties (`--color-accent`, `--bg`), update the token values in `:root` only if the zone exclusively uses them. If tokens are shared across zones, override inline within the zone instead.
- **Motion is zone-scoped.** Only change animation/transition properties within the target zone. Don't touch `@keyframes` or animation values used by other zones.
- **If zone not found:** Tell the user which zones are present (`data-zone` attributes found), and ask which one to target. Do not guess.

### Zone Quick Triggers

| User types | Action |
|---|---|
| `A vary strong — hero` | Vary strong applied to hero zone only |
| `B remix colors — card` | Remix colors applied to card zone only |
| `C shuffle layout — sidebar` | Shuffle layout applied to sidebar only |
| `A vary subtle — nav` | Refine nav zone only |
| `zones A` | List all `data-zone` sections found in Variation A |

---

## Variation Action Definitions

### Vary strong
Amplify current direction to maximum. More contrast, stronger type, bolder color, more dramatic composition. Consult `references/design-system/typography.md` for scale ratios and `references/design-system/color-and-contrast.md` for high-contrast palette construction.

*Before → After example:*
- Body text 16px, heading 32px → Body 15px, heading 72px (ratio 1.25 → 1.5+)
- Accent used on buttons only → Accent dominates hero section, bleeds into nav
- Subtle 200ms fade-in → Dramatic 600ms staggered reveal with scale transform

### Vary subtle
Tighten spacing, refine hierarchy, soften where needed. Same direction, higher craft. Focus on vertical rhythm, optical alignment, and micro-interactions per `references/design-system/spatial-design.md` and `references/design-system/motion-design.md`.

*Before → After example:*
- Inconsistent padding (16/20/24px) → Locked to 4pt grid (16/24/32px)
- Generic hover (opacity change) → Contextual hover (card lifts 2px, button darkens accent)
- Missing OpenType → `tabular-nums` on data, `font-kerning: normal` on headlines

### Distill
Strip the design to its absolute essence. Inspired by the Impeccable *distill* philosophy — ruthless simplification reveals what truly matters.

**Process:**
1. Identify the single core purpose of the interface
2. For each element, ask: "Does removing this break the core purpose?" If no, remove it.
3. Simplify across all dimensions:
   - **Information:** Reduce visible options, use progressive disclosure (`<details>`, hover reveals)
   - **Visual:** Fewer colors (aim for 2–3 total), fewer type sizes, remove decorative elements
   - **Layout:** Collapse sections, merge related content, eliminate redundant containers
   - **Interaction:** Fewer clicks to complete the primary task, remove confirmation steps where undo works
   - **Content:** Shorter headlines, tighter copy, remove introductory paragraphs that restate the heading
4. Verify: Can a new user complete the core task faster? If not, you removed the wrong things.

*Before → After example:*
- 5-section landing page → 2 sections: hero with value prop + single CTA
- Dashboard with 12 metric cards → 3 key metrics large + "Show all" expandable
- Nav with 8 items → 4 primary + overflow menu

### Change style
Extract structure/layout DNA, replace entire visual language with a different direction from the table above.

### Remix colors
Keep all shapes, type, layout. Generate 3 palettes using OKLCH color space (per `references/design-system/color-and-contrast.md`):
1. Analogous to current — shift hue ±30°, adjust chroma
2. Complementary contrast — opposite hue, rebalanced lightness
3. Unexpected/left-field — completely different mood

Always tint neutrals toward the brand hue. Never use pure gray, pure black (#000), or pure white (#fff).

*Before → After example (palette 3, unexpected):*
- Dark indigo tech dashboard → Warm cream editorial palette with rust accent
- All neutrals shift from cool blue-gray → warm stone-tinted

### Add motion
Layer additional micro-interactions and animations onto the current design. Consult `references/design-system/micro-interactions.md` for the full pattern library.

**Process:**
1. Audit current interactions — list what already moves and what's dead
2. Add missing baseline: scroll reveals on all sections, card hover lifts, button press feedback
3. Add 2-3 domain-appropriate enhancements from the "Picking Micro-Interactions by Domain" table
4. Wire up any static data displays: counter animations for numbers, bar/donut animations for charts
5. Verify reduced motion fallbacks exist for every new animation

*Before → After example:*
- Static hero → Staggered entrance (title 100ms → subtitle 250ms → CTA 400ms → image 300ms)
- Cards appear instantly → Scroll-triggered fade-up with 80ms stagger
- Numbers display as-is → Count up from 0 with easeOutExpo on scroll into view
- Image gallery static → Lightbox on click with keyboard navigation

### Dramatize
Push existing interactions to their cinematic maximum. Not just "add hover" — make the page feel like a directed experience.

**Process:**
1. Replace subtle scroll reveals with more expressive entrances (word-by-word text reveal, curtain reveal, scale-from-zero)
2. Add parallax layers to hero sections (foreground moves faster than background)
3. Upgrade hover effects: card lift → tilt-3D, link underline → magnetic cursor pull
4. Add page-level choreography: scroll progress bar, sticky header morph, section transitions
5. Include a "hero moment" — one interaction that makes the user pause (e.g., counter hitting a big number, image comparison slider, infinite marquee of client logos)

*Before → After example:*
- Simple fade-in on scroll → Staggered word reveal + parallax background + scroll progress bar
- Card hover lifts 4px → Card tilts toward cursor in 3D perspective with glow
- Static hero → Curtain reveal on page load + magnetic CTA button + background parallax

### Make interactive
Add functional interaction patterns that turn the design from a visual into a working prototype. Consult `references/interactive-patterns.md` for full implementations.

**Process:**
1. Identify what should be functional: Is there a form? Add validation + multi-step. Gallery? Add lightbox. Products? Add filtering. Data? Add live charts.
2. Add the most impactful interaction from `interactive-patterns.md` for this domain (see "Picking Patterns by Domain" table)
3. Wire up navigation: tabs work, accordions expand, drawers slide, modals open with proper focus trap
4. Add data interactions: sorting, filtering, search — with animated transitions between states
5. Add feedback loops: toast on action, copy-to-clipboard confirmation, form submission success state

*Before → After example:*
- Static product grid → Filter by category with animated show/hide + sort by price with FLIP animation
- Image gallery → Lightbox with keyboard nav (←→ Esc) + zoom on hover + dot indicators
- Contact form → Multi-step with progress bar, floating labels, real-time validation, submit→loading→success
- Dashboard metrics → Animated bar chart on scroll, donut chart that draws in, sparklines that trace, flash-on-update for live data

### Shuffle layout
Same content + style. Rearrange structure: try full-bleed → asymmetric grid → editorial columns → card masonry. Consult `references/design-system/spatial-design.md` for grid systems and visual hierarchy principles.

*Before → After example:*
- Centered hero + 3-column grid → Full-bleed left-aligned hero + asymmetric 2-column with oversized feature

### Polish
Apply Impeccable design system refinements systematically:
- **Typography** (`references/design-system/typography.md`): vertical rhythm, modular scale, OpenType features (tabular-nums for data, proper fractions), font-display: swap, size-adjust fallback metrics
- **Spatial** (`references/design-system/spatial-design.md`): squint test, hierarchy through multiple dimensions, optical alignment (text negative margin -0.05em, icon center offsets)
- **Interaction** (`references/design-system/interaction-design.md`): all 8 interactive states (default/hover/focus/active/disabled/loading/error/success), focus-visible rings, proper form design (visible labels, blur validation, `aria-describedby` errors)
- **Motion** (`references/design-system/motion-design.md`): 100/300/500 rule, ease-out-expo for enters, exit at 75% of enter duration, staggered animations with CSS custom properties
- **UX Writing** (`references/design-system/ux-writing.md`): specific button labels (verb + object), error formula (what → why → fix), empty states that teach the interface, link text with standalone meaning
- **Clarify copy**: Scan all visible text — replace vague labels with specific ones, remove redundant intros, ensure every word earns its place. "Submit" → "Create account". "Error" → "Email needs to be in name@example.com format."

### Critique
Systematic audit against design system principles. Score each dimension and provide specific fixes:

1. **Typography:** Is hierarchy clear? Scale ratio consistent? Fonts distinctive? Vertical rhythm locked?
2. **Color:** WCAG contrast passing? Neutrals tinted? 60-30-10 balance? No pure black/white?
3. **Layout:** Passes squint test? Varied spacing creates rhythm? Cards justified? No nested cards?
4. **Motion:** Durations appropriate (100/300/500)? Ease-out for enters? Reduced motion respected? Only transform+opacity animated?
5. **Interaction:** All 8 states designed? Focus rings present? Touch targets ≥44px? Skeleton > spinner?
6. **Responsive:** Mobile-first? Content-driven breakpoints? Input method detected (`pointer`/`hover`)? Safe areas?
7. **Writing:** Specific button labels? Helpful errors (what/why/fix)? Empty states that teach? No redundant copy?
8. **Resilience:** Text truncation handled? Long content graceful? Loading/error states present? i18n-ready spacing?

### Extract tokens
Export the design's token system in the requested format:

**CSS Custom Properties (default):**
```css
:root {
  /* Primitives */
  --blue-500: oklch(55% 0.2 260);
  --stone-100: oklch(95% 0.01 60);
  /* Semantic */
  --color-primary: var(--blue-500);
  --color-surface: var(--stone-100);
  /* Typography */
  --font-display: 'Fraunces', serif;
  --font-body: 'Instrument Sans', sans-serif;
  --text-xs: clamp(0.7rem, 0.65rem + 0.25vw, 0.75rem);
  --text-base: clamp(0.95rem, 0.9rem + 0.25vw, 1.0625rem);
  --text-xl: clamp(1.5rem, 1rem + 2.5vw, 3rem);
  /* Spacing */
  --space-xs: 4px; --space-sm: 8px; --space-md: 16px;
  --space-lg: 24px; --space-xl: 48px; --space-2xl: 96px;
  /* Motion */
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --duration-instant: 100ms;
  --duration-fast: 200ms;
  --duration-normal: 350ms;
}
```

**JSON (for design tools / Figma):** Same structure as flat key-value JSON.

**Tailwind config:** Extend `theme` with `colors`, `fontFamily`, `spacing`, `transitionTimingFunction`.

### See other views
Render additional views with full design system compliance:

- **Empty state** — not just "No items." Design as an onboarding moment:
  1. Acknowledge briefly ("No projects yet")
  2. Explain the value of filling it ("Create your first project to start tracking progress")
  3. Provide a clear primary action (prominent CTA button)
  4. Add visual interest (illustration, icon, or subtle pattern — never a sad face)
  5. If applicable, show a preview of what it will look like when populated

- **Data-filled state** — realistic volume: 3–7 items for lists, 6–12 months of data for charts, edge cases included (one very long name, one empty optional field)

- **Mobile viewport** — not a shrunk desktop. Per `references/design-system/responsive-design.md`:
  - Rethink for thumb zones (primary actions bottom-right for right-handed)
  - Touch targets ≥44px with padding
  - Navigation collapses to hamburger + drawer or bottom tab bar
  - Tables transform to cards with `data-label` attributes
  - Use `@media (pointer: coarse)` for larger tap areas

- **Dark ↔ Light toggle** — per `references/design-system/color-and-contrast.md`:
  - Dark mode uses lighter surfaces for depth (no shadows)
  - Desaturate accent colors slightly for dark backgrounds
  - Reduce font weight (light text on dark appears heavier)
  - Never pure black (#000) background — use oklch(12-18% ...) tinted

- **Onboarding flow** — per Impeccable *onboard* principles:
  - Show Don't Tell: inline demos > text instructions
  - Make It Optional: skip button always visible, no forced tours
  - Time to Value: reach the "aha moment" in ≤3 steps
  - Context Over Ceremony: teach at the moment of need, not upfront
  - Respect User Intelligence: no condescending language, allow power-user shortcuts

- **Hover / active / focus states** — all interactive elements with visible state changes

### Mix
Combine two variations into one. Accepts forms like "Mix A + B" or "A's layout + C's colors."

**Process:**
1. Use the first-named variation as the **structural base** (layout, hierarchy, component structure)
2. Layer the second variation's **visual language** (palette, typography, motion, signature details)
3. When elements conflict (e.g. both have a distinctive nav pattern), explicitly state the trade-off and pick the one that better serves the content
4. Label result as "Mix [A+B]" and present with a Summary Card showing which parts came from where

---

## Variation Loop

Track iteration count internally (reset per variation). After any variation action:
1. **Overwrite the same file** (e.g. `variant-output/variant-coffee-A.html`) — don't create new files for iterations
2. **Re-open in browser** — run `open` / `xdg-open` so the user sees the update immediately
3. **Show a 2-3 line diff summary** in the terminal — what changed, not the full code
4. Offer the grouped action menu again — the loop never ends until the user moves on
5. If the user has iterated 3+ times on the same direction, proactively suggest: "Want to branch? I can apply this to one of the other variations."
6. **At iteration 2:** Ask a direction-check — *"Still feeling this direction, or want to pivot?"*
7. **At iteration 4:** Show a change summary — *"Over 4 rounds: [list key changes]. Want to keep refining or export?"*
8. **At iteration 5+:** Suggest convergence — *"You've refined this 5 times — it's looking solid. Ready to export, or one more pass?"*

---

## Design Principles

Grounded in the Impeccable design system. Consult individual references for deep implementation guidance.

### Content & Intent
- **Real content wins.** Plausible headlines, real data values, actual copy. Makes designs feel alive.
- **Commit fully.** Half-executed aesthetics look worse than simple ones. Bold maximalism and refined minimalism both work — the key is intentionality, not intensity.
- **Never converge.** If A is dark, B cannot also be dark. Each must feel like a different studio.
- **Match type to domain.** Don't default to generic app UI — load the right reference.

### Typography *(→ `references/design-system/typography.md`)*
- **Distinctive display + reliable body.** Use Google Fonts `@import`, always specify weights.
- **Banned display fonts:** Inter, Roboto, Arial, Open Sans, Lato, Montserrat, system-ui, system defaults.
- **Better alternatives:** Instrument Sans, Plus Jakarta Sans, Outfit, Onest, Figtree, Urbanist, Fraunces, Newsreader, Lora.
- **Modular scale:** Use fewer sizes with more contrast (5-size system: xs/sm/base/lg/xl+). Popular ratios: 1.25, 1.333, 1.5.
- **Fluid type:** Use `clamp(min, preferred, max)` for responsive sizing. Not for buttons/labels.
- **Vertical rhythm:** Line-height as base unit for all vertical spacing.
- **OpenType features:** `tabular-nums` for data tables, `diagonal-fractions` for recipes, `all-small-caps` for abbreviations.
- Never mix more than 2 typefaces. One well-chosen family in multiple weights often suffices.

### Color *(→ `references/design-system/color-and-contrast.md`)*
- **Use OKLCH** for perceptually uniform palettes. Reduce chroma as you approach white/black.
- **Tint your neutrals** toward the brand hue — even chroma 0.01 creates subconscious cohesion.
- **60-30-10 rule:** 60% neutral, 30% secondary, 10% accent. Accent colors work because they're rare.
- **Never pure black/white.** Always tint. Pure black/white never appears in nature.
- **Never gray on color.** Gray text on colored backgrounds looks washed out — use a darker shade of the background color.
- **Two-layer tokens:** Primitive (`--blue-500`) + semantic (`--color-primary: var(--blue-500)`). Dark mode redefines semantic only.

### Layout & Space *(→ `references/design-system/spatial-design.md`)*
- **4pt base grid** (not 8pt — too coarse). Scale: 4, 8, 12, 16, 24, 32, 48, 64, 96px.
- **Use `gap`** instead of margins for sibling spacing.
- **Squint test:** Blur your eyes — can you identify the most important element, second most, and clear groupings?
- **Hierarchy through multiple dimensions:** Combine size, weight, color, position, and space (2-3 at once).
- **Cards are not required.** Spacing and alignment create grouping naturally. Never nest cards inside cards.
- **Container queries** for component-level responsiveness.

### Motion *(→ `references/design-system/motion-design.md`)*
- **100/300/500 rule:** 100-150ms instant feedback, 200-300ms state changes, 300-500ms layout changes, 500-800ms entrances.
- **Ease-out-expo** (`cubic-bezier(0.16, 1, 0.3, 1)`) for elements entering. Exit at 75% of enter duration.
- **Only animate `transform` and `opacity`.** For height: use `grid-template-rows: 0fr → 1fr`.
- **Stagger with CSS custom properties:** `animation-delay: calc(var(--i) * 50ms)`. Cap total stagger time.
- **Reduced motion is not optional.** Always include `@media (prefers-reduced-motion: reduce)`.
- **Never bounce/elastic easing.** Real objects decelerate smoothly.

### Interaction *(→ `references/design-system/interaction-design.md`)*
- **Design all 8 states:** default, hover, focus, active, disabled, loading, error, success.
- **Focus rings:** Never `outline: none` without replacement. Use `:focus-visible`.
- **Forms:** Visible labels (not just placeholders), validate on blur, errors below fields with `aria-describedby`.
- **Skeleton screens > spinners.** Optimistic UI for low-stakes actions.
- **Undo > confirm dialogs.** Users click through confirmations mindlessly.
- **Modals only as last resort.** Prefer native `<dialog>` when needed. Consider Popover API for non-modal overlays.

### UX Writing *(→ `references/design-system/ux-writing.md`)*
- **Specific button labels:** "Save changes" not "OK", "Create account" not "Submit".
- **Error formula:** What happened → Why → How to fix. Never blame the user.
- **Empty states are opportunities:** Acknowledge, explain value, provide clear action.
- **Link text must standalone:** "View pricing plans" not "Click here".

---

## Component Mode

When the user asks for a **component** rather than a full page, switch to Component Mode. Generates isolated, self-contained UI pieces — not full layouts.

### Triggers

| User says | Action |
|---|---|
| "design a button system" / "button variants" | Button component set: all sizes, all states |
| "design a form" / "input components" | Form component set: inputs, selects, errors, validation |
| "card component" / "design a card" | Card variants: default, hover, selected, loading, empty |
| "modal" / "dialog component" | Modal with header, body, footer, dismiss, focus trap |
| "design a [X] component" | Single component, all 8 interactive states |
| "component library" / "design system components" | Set of 5–8 related components as a unified system |
| "nav component" / "sidebar component" | Navigation piece with all states and responsive behavior |

### Component Mode Workflow

**Step 1: Clarify scope** — single component or a system of related components?

**Step 2: Define states** — for every component, design all 8 states before coding:
`default → hover → focus → active → disabled → loading → error → success`

**Step 3: Define variants** — size scales, visual emphasis, semantic variants:

| Component | Common variants |
|-----------|----------------|
| Button | sizes (sm/md/lg) × types (primary/secondary/ghost/destructive) |
| Input | sizes × states × types (text/password/search/textarea) |
| Card | default / interactive (hover) / selected / loading (skeleton) / empty |
| Badge / Tag | semantic colors (info/success/warning/error) × sizes |
| Avatar | sizes × states (online/offline/loading) × fallback (initials/icon) |
| Modal | sizes (sm/md/lg/fullscreen) × dismissible/non-dismissible |

**Step 4: Generate** — produce a single HTML file (or TSX) showing all variants side by side on a neutral background, with clear labels. Component files go to `variant-output/component-[name].html`.

**Step 5: State showcase** — always include an interactive state showcase section: hover the component, click it, tab to it — all states visible and working.

### Component Output Format

```html
<!-- Component showcase layout -->
<section data-zone="showcase" style="background:#f5f5f5; padding:48px; font-family:...">
  <h2>Button System</h2>

  <!-- Row per variant group -->
  <div data-zone="primary-buttons">
    <!-- sm, md, lg sizes, all states inline -->
  </div>

  <div data-zone="secondary-buttons"> ... </div>
  <div data-zone="destructive-buttons"> ... </div>

  <!-- State showcase — interactive -->
  <div data-zone="states">
    <p>Hover, click, or tab through to see all states</p>
    <!-- live interactive demo -->
  </div>
</section>
```

Terminal output:

```
✦ Component: Button System
  Variants: primary · secondary · ghost · destructive
  Sizes: sm · md · lg
  States: default · hover · focus · active · disabled · loading

  variant-output/component-buttons.html ← opened in browser

  Next: vary strong · remix colors — [variant] · export tokens · react component
```

### Component + Zone Bridge

Components can be injected into full-page variations using zone syntax:

```
A use new button component    → replace all buttons in Variation A with the new component system
B update card — card zone     → apply new card component to the card zone in Variation B
```

### Quick Triggers for Component Mode

| User types | Action |
|---|---|
| `component button` | Button system: all variants + all states |
| `component form` | Form components: inputs, labels, errors, submit |
| `component card` | Card variants: default/hover/selected/loading/empty |
| `component nav` | Navigation component with responsive behavior |
| `states [component]` | Show all 8 interactive states for a specific component |
| `dark component` | Re-generate component set in dark mode |

---

## Code Export

- **Interactive HTML**: Single-file, embedded CSS + JavaScript. Alive by default. **Default when no React project detected.**
- **React .tsx**: Functional components — auto-selected when React project detected in cwd, or via `react [A/B/C]` / `--react` / `export to react`.

### Interactive HTML Output Spec (Default)

Every HTML output must feel alive — static mockups are not acceptable. Follow this checklist:

**Baseline (every output):**
- CSS custom properties for all colors — use OKLCH where supported with hex fallback: `--accent: oklch(65% 0.2 250); /* fallback: #6366F1 */`
- Semantic token layer: `--color-primary`, `--color-surface`, `--color-text` mapping to primitives
- Google Fonts via `@import` in `<style>` — always specify weights used, include `font-display: swap`
- Responsive: mobile-first, breakpoints at `640px` and `1024px`. Use `clamp()` for fluid values
- No frameworks by default — vanilla CSS + HTML + JS. CDN Tailwind only if user asks
- `@media (prefers-reduced-motion: reduce)` block for all animations
- Minimum visual completeness: populated data, real copy, working nav state

**Interactivity baseline (every output — non-negotiable):**
- **Page load animation**: Staggered entrance for hero elements (title → subtitle → CTA → image) using `animation-delay`. See `design-system/micro-interactions.md` → Page Load.
- **Scroll reveal**: All below-fold sections use `IntersectionObserver` to fade/slide in on scroll. Apply `data-reveal` to sections, `data-reveal-stagger` to card grids.
- **Hover states**: Every button, card, link, and image has visible hover feedback — card lift, image zoom, link underline animation, button press scale. Not just `opacity` changes.
- **Focus rings**: `:focus-visible` on all interactive elements with 2-3px offset ring.
- **Smooth scroll**: `html { scroll-behavior: smooth; }` for anchor links.
- **At least 3 micro-interactions** from `design-system/micro-interactions.md` appropriate to the domain (see the "Picking Micro-Interactions by Domain" table).

**Enhanced interactivity (add when relevant to the design):**
- **Sticky header** that shrinks/blurs on scroll — for any page with navigation
- **Dark mode toggle** with animated icon transition — for any page with `[data-theme]` tokens
- **Counter animation** — for any stat/metric displays (KPIs, hero numbers, pricing)
- **Scroll progress bar** — for long-form editorial, case studies, documentation
- **Infinite marquee** — for client logos, skills, testimonials
- **Image zoom on hover** — for any image gallery, product grid, portfolio
- **Accordion with animated height** — for FAQ, menu sections, sidebar filters
- **Tab switching with indicator slide** — for any tabbed interface
- **Toast notifications** — for any form submission, copy action, save confirmation
- **Floating labels** — for any form with text inputs

**Domain-specific interactivity (consult `references/interactive-patterns.md`):**
- **Dashboard**: Live clock, animated charts (bar/donut/sparkline), flash-on-update metrics, sortable tables
- **SaaS Landing**: Scroll-driven parallax hero, animated counters in social proof, comparison slider for pricing
- **E-commerce**: Filter chips with animated show/hide, image carousel with scroll-snap, product image lightbox
- **Portfolio**: Masonry grid with animated layout, lightbox gallery, tilt-on-hover cards, cursor effects
- **Food & Beverage**: Image lightbox for dishes, accordion menus, step-by-step recipe checkboxes
- **Fashion**: Full-screen image carousel, countdown timer (for drops), before/after comparison slider
- **Editorial**: Word-by-word text reveal, scroll progress bar, parallax images, reading time estimate
- **Education**: Multi-step form with progress, drag-to-sort for quizzes, animated progress bars
- **Mobile**: Slide drawer navigation, snap-scroll carousel, pull-to-refresh hint, swipeable cards

**Always load these references before coding:**
- `references/design-system/micro-interactions.md` — animation patterns and JS snippets
- `references/interactive-patterns.md` — functional interaction patterns (filter, drag, charts, forms)

### React Output Spec

**When to use:** Auto-triggered when React project is detected (see Output Format Detection), or explicitly requested via `react [A/B/C]` / `--react` / `export to react`.

**File output:**
- Write to `variant-output/VariantA.tsx` (preserves same directory convention as HTML)
- Add this comment at the top of every generated `.tsx` file:
  ```tsx
  // Generated by variant-design — move to src/components/ to include in your project's build.
  // Preview: run your project's dev server (npm run dev / pnpm dev) then import this component.
  ```

**Component structure:**
- Functional components only — no class components
- Single default export: `export default function VariantA() { ... }`
- Declare color tokens as `const theme = { ... }` with OKLCH values and hex fallbacks
- Google Fonts: add a `<link>` in the returned JSX or instruct user to add to `index.html`
- Prefer inline styles for one-off values; extract repeated patterns to a `styles` object
- State assumptions upfront in a comment block: which components are stateful, what props to pass
- If Tailwind detected in project: use Tailwind classes; if CSS modules: one `.module.css` per component; otherwise inline styles
- Use `useEffect` sparingly — CSS animations and transitions preferred for entrances and states; JS for scroll observers and data-driven interactions
- Prop defaults must be realistic content (no `undefined`, no "Lorem ipsum")
- **Include interaction hooks**: `useScrollReveal`, `useCounter`, `useThemeToggle` as custom hooks where reusable

**Animation:**
- Check whether `framer-motion` or `motion` is in `package.json` dependencies before importing
- **If Framer Motion detected:** use `motion.div`, `AnimatePresence`, `useInView` for scroll reveals, `layout` prop for animated filtering/sorting
- **If Framer Motion NOT detected:** implement animations with CSS transitions + `IntersectionObserver` in `useEffect` — same visual result, zero extra dependencies. Do NOT add `framer-motion` import.

**Framework-specific rules:**
- **Next.js (key `"next"` detected):** Add `"use client"` directive at the top of any component that uses hooks (`useState`, `useEffect`, `useRef`), browser APIs, event handlers, or animation libraries. Server components are the default in App Router — `"use client"` is required.
- **Vite:** Standard React component, no special directives needed.
- **Generic React:** Standard functional component.

### Multi-Screen / Flow Support

When a user asks for a flow (onboarding, checkout, wizard, multi-step form):
1. Render all screens side-by-side horizontally, each in a `390px` frame with label above
2. Use a shared `currentStep` state variable to show/hide screens if making it interactive
3. Annotate transitions: "→ swipe left to advance" or "→ tab triggers step 2"
4. Each screen must be visually complete — never leave a screen empty as placeholder
5. Apply onboarding principles: show don't tell, make skip visible, reach "aha" in ≤3 steps

### Performance Baseline

Every output must meet these minimums:

- **Images:** `loading="lazy"` on below-fold images, `width`/`height` attributes to prevent CLS, `srcset` for responsive images, WebP/AVIF format preference
- **Fonts:** `font-display: swap`, subset to used character ranges when possible, preconnect to Google Fonts origin: `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>`
- **CSS:** No `@import` for CSS files (blocks render) — only for Google Fonts in `<style>`. Use `content-visibility: auto` for off-screen sections
- **Animation:** Only `transform` and `opacity` (GPU-composited). No `will-change` unless animation is imminent. Use `Intersection Observer` for scroll-triggered animations — never scroll event listeners
- **Layout:** No layout thrashing (read then write, never interleave). Avoid forced synchronous reflows

### Production Hardening Checklist

Apply when the design will be used in real products:

**Text resilience:**
- All text containers handle overflow: `overflow: hidden; text-overflow: ellipsis` for single-line, `-webkit-line-clamp` for multi-line
- Test with 2× expected content length — does the layout survive?
- Test with 0 content — does the empty state make sense?
- Headings: `overflow-wrap: break-word` to prevent horizontal scroll on mobile

**i18n readiness:**
- No fixed-width containers for text — allow 30% expansion for German/French
- Use logical properties: `margin-inline-start` not `margin-left` (RTL support)
- Numbers: use `Intl.NumberFormat` for locale-aware formatting
- Dates: use `Intl.DateTimeFormat` — never hardcode date formats

**Error & edge states:**
- Network failure: show last-known data with "Unable to update" banner, not a blank screen
- Slow connection: skeleton screens appear within 200ms if data isn't ready
- Invalid data: graceful degradation (show "--" for missing numbers, not NaN/undefined)

**Input robustness:**
- Debounce search/filter inputs (300ms)
- Prevent double-submit on forms (disable button after first click, re-enable on error)
- Paste handling: strip formatting on paste into plain-text inputs

### Integration Quick-Start

After exporting, append a brief guide so users know how to own the code:

> **Making it yours:**
> - **Colors:** Edit the `--color-*` CSS custom properties in `:root` — all colors flow from these tokens
> - **Fonts:** Swap the Google Fonts `@import` URL and update `--font-display` / `--font-body`
> - **Spacing:** Adjust `--space-*` tokens to scale the entire layout proportionally
> - **New pages:** Copy the HTML structure, keep the same `<style>` block — the token system ensures visual consistency
> - **Dark mode:** Redefine `--color-*` semantic tokens inside `@media (prefers-color-scheme: dark)` — primitives stay unchanged
> - **Framework migration:** The CSS custom properties work in any framework. For React/Vue, map tokens to your theme object

---

## Anti-Patterns (AI Slop Fingerprints)

Avoid these in every output — they are the telltale signs of AI-generated design:

| Anti-pattern | Instead |
|---|---|
| Two variations in the same aesthetic direction | Ensure A/B/C feel like different studios — re-check the direction table |
| `Inter`, `Roboto`, `Arial`, `system-ui` as display fonts | Distinctive fonts: Instrument Sans, Fraunces, Outfit, Newsreader |
| Hardcoded hex values in CSS rules | CSS custom properties with OKLCH: `color: var(--text)` |
| Lorem ipsum or placeholder text | Real, domain-plausible content |
| Generic "Feature 1 / Feature 2 / Feature 3" copy | Specific feature names that match the domain |
| Five or more colors used at similar weight | 60-30-10: one dominant color used with conviction |
| Cards with identical sizes and equal visual weight | Vary card sizes to create rhythm and hierarchy |
| Hover states missing on interactive elements | Every button, link, and card needs hover + focus-visible |
| Mobile layouts that are just desktop shrunk down | Rethink for thumb zones, touch targets, and vertical flow |
| Gradient abuse (5+ color gradient backgrounds) | One solid color or a two-stop gradient maximum |
| Purple-to-blue gradients, cyan-on-dark, neon accents | Intentional palette from OKLCH, tinted neutrals |
| Glassmorphism everywhere (blur, glow borders) | Purposeful decorative elements that reinforce brand |
| Big rounded icons above every heading | They rarely add value — use typography for hierarchy |
| Cards nested inside cards | Flatten hierarchy — use spacing and dividers |
| Everything centered | Left-aligned with asymmetric layouts feels more designed |
| Same spacing everywhere | Varied spacing creates rhythm — tight groups, generous separations |
| Gradient text on headings/metrics | Decorative, not meaningful — use solid color with weight |
| Dark mode as default with glowing accents | Earn dark mode: different surface depths, desaturated accents, no shadows |
| Bounce/elastic easing | Exponential ease-out — real objects decelerate smoothly |
| `outline: none` without replacement | `:focus-visible` with 2-3px offset ring |
| Modals for everything | Consider alternatives: inline expansion, drawers, popovers |
| Pure black (#000) or pure white (#fff) | Always tint — pure extremes don't exist in nature |
| Gray text on colored backgrounds | Use darker shade of the background color |
| Empty state = "No data" text only | Design as onboarding moment: acknowledge, explain value, CTA |
| Text that overflows its container | `overflow-wrap: break-word`, `text-overflow: ellipsis`, line-clamp |
| Static page with no animations or interactions | Every page needs: entrance animation, scroll reveals, hover states, ≥3 micro-interactions |
| Scroll reveal on ALL elements simultaneously | Stagger children with 60-80ms delay; animate sections independently |
| JavaScript in `<script>` but nothing actually moves | Wire up scroll observer, counters, lightbox — code must produce visible motion |
| Hover effects limited to `opacity: 0.8` | Use card lift, image zoom, underline slide, color shift — see `micro-interactions.md` |
| Charts/numbers that appear fully rendered | Animate bar growth, counter count-up, donut draw on scroll into view |
| **Slides & WeChat (extra rules)** | |
| Emoji in slides or WeChat articles | Never — `references/presentation.md` + `references/wechat.md` |
| CSS variables `var(--xxx)` in WeChat HTML | All styles must be inline; WeChat strips class/var | 
| External font `@import` in WeChat | WeChat blocks Google Fonts — system fonts only |
| `position: fixed/absolute` in WeChat | Not supported in WeChat article renderer |
| JS-driven `scrollTo()` in scroll-deck (Mode 2) | CSS `scroll-snap` only — JS may only passively listen |
| **Writing (中文内容)** | |
| AI taste opening: "在当今时代…" / "不可否认…" | Scene opening: time + place + one concrete detail |
| Stacked modifiers: 深刻/全面/系统性/赋能 | One verb, one noun — see `references/voice.md` |
| Summary + call to share at article end | End with余韵 — open question or resonant detail |

---

## Accessibility Baseline

Apply to every output — non-negotiable:
- Text contrast minimum: **4.5:1** for body, **3:1** for large text (≥24px bold or ≥18.5px normal)
- All interactive elements: minimum **44×44px** touch/click target (use pseudo-elements if visual size is smaller)
- Focus rings: never `outline: none` without a custom visible `:focus-visible` replacement
- Don't convey meaning by color alone — pair with icon, label, or pattern
- Avoid pure white on pure black for long-form text — slightly off-white/off-black (`#F0EDE8` on `#111`) reduces eye strain
- `@media (prefers-reduced-motion: reduce)` — preserve functional animations (progress, loading), remove spatial movement
- Use `rem`/`em` for font sizes, never `px` for body text — respect browser settings
- Minimum 16px body text on all viewports
- Keyboard navigation: logical tab order, skip links for nav-heavy pages, roving tabindex for component groups
- ARIA: landmarks (`main`, `nav`, `aside`), live regions for dynamic content, `aria-describedby` for form errors
