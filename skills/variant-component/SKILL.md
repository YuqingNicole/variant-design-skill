---
name: variant-component
description: Generate isolated UI components with all 8 states and variants — button systems, forms, cards, modals, nav. Design System-aware when a token set is confirmed. Load skills/shared/code-output.md for framework detection and output conventions. Triggers on: component, button system, form component, card component, modal, navigation component, design a button, input components, component library
---

> Before generating code, load `skills/shared/code-output.md` for framework detection and output conventions.

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
