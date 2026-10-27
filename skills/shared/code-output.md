<!-- Shared by the variant-design routes. Read it before writing interface code. Previews: `references/workflow/preview.md`. Edits and undo: `references/workflow/history.md`. Export and integration: `skills/shared/export.md`. -->

# Code output

The user cannot see the output until it opens in a browser, so every step should shorten the path from idea to pixels: write files, build the preview, and give the exact path or URL.

## Detect the output format

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

For Vue, Astro or Svelte, also read `skills/shared/frameworks.md`.

**Edge cases:**
- `.tsx` files exist but no `react` key → HTML output (Preact/Solid/stale files don't count)
- Both `vue` and `nuxt` detected → treat as Nuxt 3 (same SFC format, note `useNuxtApp` available)
- Monorepo: check cwd only, never traverse to parent `package.json`
- Multiple frameworks in same `package.json` (unusual) → print ambiguity warning, ask user to pass `--[framework]`


## Where files go

Write to `./variant-output/` in the target project, never into its source folders. Create the directory if needed.

- HTML: `variant-[scenario]-A.html`, `-B.html`, `-C.html` (for example `variant-dashboard-A.html`).
- React: Write default-exported `VariantA.tsx`, `VariantB.tsx`, and `VariantC.tsx` into `variant-output/`. Mount them automatically using `references/workflow/preview.md`; the comparison view and three direct URLs are part of delivery. Starting the original project's server alone is insufficient. Keep production routes untouched. Use a native isolated route adapter when framework-specific imports/providers require it, and remove only files created by this task during cleanup.
- Data shared by all three directions: one file under `variant-output/shared/`.
- Working files (candidates, change files, probes, screenshots): `.variant-work/` in the project root. It contains project source; do not commit it.

Keep these paths stable across edits. Changing an existing direction goes through the history helper (`references/workflow/history.md`), which snapshots before replacing files; Git does not preserve uncommitted intermediate edits.

Never paste full generated code into the chat. Report the files written and a short summary.

To show a single file (a component sheet, a design-system preview), use the environment's browser tooling or `node <skill-root>/scripts/open-preview.mjs <file>`; without a browser, give the exact path. A/B/C comparisons and React mounting follow `references/workflow/preview.md`.

## Output Completeness

Generated code is production input — partial output is broken output.

**Banned output patterns — never produce:**
- `// ...` / `/* ... */` standing in for omitted code
- `// rest of code` / `// rest of component` / `// implement here`
- `// similar to above` / `// continue pattern` / `// add more as needed`
- `// TODO` in delivered output
- Describing what code should do instead of writing it

**Handling long outputs:** Write at full quality up to a clean breakpoint (end of function / end of file). Then output:
```
[PAUSED — X of Y complete. Send "continue" to resume from: <next section name>]
```
On "continue": pick up exactly where stopped. No recap, no repetition.

**Cross-check before responding:** Every code block must contain runnable code. Every component the user requested must be present and complete.

## Interactive HTML (default)

Every output must support its product task with working controls. Use motion only when it conveys useful information or the user requests expressive exploration.

**Baseline (every output):**
- CSS custom properties for all colors — use OKLCH where supported with hex fallback: `--accent: oklch(65% 0.2 250); /* fallback: #6366F1 */`
- Semantic token layer: `--color-primary`, `--color-surface`, `--color-text` mapping to primitives
- Preserve existing font loading. For new web fonts, specify used weights and `font-display: swap`; do not require a remote font service.
- Responsive: mobile-first, breakpoints at `640px` and `1024px`. Use `clamp()` for fluid values
- No frameworks by default — vanilla CSS + HTML + JS. CDN Tailwind only if user asks
- `@media (prefers-reduced-motion: reduce)` block for all animations
- Minimum visual completeness: populated data, real copy, working nav state

**Interactivity baseline:**
- Make task controls work with keyboard and pointer, including relevant feedback and error recovery.
- Preserve a visible focus indicator on all interactive elements.
- Entry animations, scroll reveal, smooth scrolling, and micro-interaction counts are optional; omit decoration without an information purpose.
- Reduced motion covers CSS and JavaScript: show final values immediately, cancel pending animation frames/timers, and handle preference changes during use.

**Optional pattern examples (not requirements; apply the precedence above):**
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

**Optional domain patterns** (when one serves the task, read only its section of `references/interactive-patterns.md`):
- **Dashboard**: Live clock, animated charts (bar/donut/sparkline), flash-on-update metrics, sortable tables
- **SaaS Landing**: Scroll-driven parallax hero, animated counters in social proof, comparison slider for pricing
- **E-commerce**: Filter chips with animated show/hide, image carousel with scroll-snap, product image lightbox
- **Portfolio**: Masonry grid with animated layout, lightbox gallery, tilt-on-hover cards, cursor effects
- **Food & Beverage**: Image lightbox for dishes, accordion menus, step-by-step recipe checkboxes
- **Fashion**: Full-screen image carousel, countdown timer (for drops), before/after comparison slider
- **Editorial**: Word-by-word text reveal, scroll progress bar, parallax images, reading time estimate
- **Education**: Multi-step form with progress, drag-to-sort for quizzes, animated progress bars
- **Mobile**: Slide drawer navigation, snap-scroll carousel, pull-to-refresh hint, swipeable cards

Read `references/design-system/micro-interactions.md` or `references/interactive-patterns.md` only for a pattern you are about to build, and only that section.

## React

**When to use:** Auto-triggered when React project is detected (see Output Format Detection), or explicitly requested via `react [A/B/C]` / `--react` / `export to react`.

**File output:**
- Write to `variant-output/VariantA.tsx` (preserves same directory convention as HTML)
- Create the isolated preview entry automatically; see `references/workflow/preview.md`.

**Component structure:**
- Functional components only — no class components
- Single default export: `export default function VariantA() { ... }`
- Declare color tokens as `const theme = { ... }` with OKLCH values and hex fallbacks
- Fonts: reuse project loading, or wire required font assets into the preview automatically
- Prefer inline styles for one-off values; extract repeated patterns to a `styles` object
- State assumptions upfront in a comment block: which components are stateful, what props to pass
- If Tailwind detected in project: use Tailwind classes; if CSS modules: one `.module.css` per component; otherwise inline styles
- Use `useEffect` sparingly — CSS animations and transitions preferred for entrances and states; JS for scroll observers and data-driven interactions
- Prop defaults must be realistic content (no `undefined`, no "Lorem ipsum")
- **When needed, include interaction hooks**: `useScrollReveal`, `useCounter`, `useThemeToggle` as custom hooks where reusable

**Animation:**
- Check whether `framer-motion` or `motion` is in `package.json` dependencies before importing
- **If Framer Motion detected:** use `motion.div`, `AnimatePresence`, `useInView` for scroll reveals, `layout` prop for animated filtering/sorting
- **If Framer Motion NOT detected:** implement animations with CSS transitions + `IntersectionObserver` in `useEffect` — same visual result, zero extra dependencies. Do NOT add `framer-motion` import.

**Framework-specific rules:**
- **Next.js (key `"next"` detected):** Add `"use client"` directive at the top of any component that uses hooks (`useState`, `useEffect`, `useRef`), browser APIs, event handlers, or animation libraries.
- **Vite:** Standard React component, no special directives needed.
- **Generic React:** Standard functional component.

## Multi-Screen / Flow Support

When a user asks for a flow (onboarding, checkout, wizard, multi-step form):
1. Render all screens side-by-side horizontally, each in a `390px` frame with label above
2. Use a shared `currentStep` state variable to show/hide screens if making it interactive
3. Annotate transitions: "→ swipe left to advance" or "→ tab triggers step 2"
4. Each screen must be visually complete — never leave a screen empty as placeholder
5. Apply onboarding principles: show don't tell, make skip visible, reach "aha" in ≤3 steps

## Performance Baseline

Every output must meet these minimums:

- **Images:** `loading="lazy"` on below-fold images, `width`/`height` attributes to prevent CLS, `srcset` for responsive images, WebP/AVIF format preference
- **Fonts:** `font-display: swap`, subset to used character ranges when possible, preconnect to Google Fonts origin: `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>`
- **CSS:** No `@import` for CSS files (blocks render) — only for Google Fonts in `<style>`. Use `content-visibility: auto` for off-screen sections
- **Animation:** Only `transform` and `opacity` (GPU-composited). No `will-change` unless animation is imminent. Use `Intersection Observer` for scroll-triggered animations — never scroll event listeners
- **Layout:** No layout thrashing (read then write, never interleave). Avoid forced synchronous reflows

For React projects without Vite, the preview helper accepts `--vite-root` for an isolated bundler package while reusing the project's React. Follow `references/workflow/preview.md`; unsupported framework behavior or unavailable installation remains unverified. Do not improvise a bundler.

## Verification records

For revision-bound delivery evidence, read `references/workflow/artifact-verification.md`. Use the reusable browser runner with explicit task expectations when Playwright is available. Capture non-target behavior and project-check failures before an edit, rerun after it, and retain both reports. Missing tools or expectations remain unverified; static scans alone cannot establish runtime success.

Before generating files for project integration, prepare a source/target baseline using `skills/shared/export.md`. Applying staging without a prepared plan is rejected.

Comparison delivery uses preview-first cards, with full-page links above and expandable direction details below. Rebuild existing comparisons with the preview helper; do not hide or discard the comparison statements.
