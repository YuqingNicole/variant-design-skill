# UX Component Specs Reference

State machines, variants, interaction rules, and spacing specifications for common UI components. Based on Material Design, Apple HIG, Radix UI, and ARIA Authoring Practices.

---

## How to Spec a Component

Every component spec needs these six dimensions:

1. **States** — All visual and interactive states
2. **Variants** — Visual/functional variants of the same component
3. **Anatomy** — Named parts of the component
4. **Spacing** — Internal padding, gap, external margin
5. **Behavior** — What happens on interaction, keyboard, focus, error
6. **Accessibility** — ARIA role, keyboard nav, screen reader output

### Recording Values

- **Never invent a value.** Every number comes from the source: tokens, CSS, component code, or a computed style read in the browser. A value you cannot find stays `[TBD]`, with a note on where it should come from. A plausible guess presented as a spec is worse than a gap.
- **Specify architecture, not content.** Name slots by role and sizing behavior, not by sample copy: `TITLE · FILL`, `CLOSE ACTION · FIXED 32`, `FOOTER ACTIONS · HUG`. The spec should stay true when the text changes.
- **Name the variables, then relate them.** Label repeated measurements once (`S1` padding, `S2` gap, `R1` outer radius, `B` border) and write derived sizes as formulas rather than loose numbers:

```
H_header = 2·S1 + H_title          header height follows its padding and title
R_inner  = max(0, R1 − B − S1)     nested corner (see ux-design-tokens.md → Nested Radius)
W_body   = W_dialog − 2·S1
```

A formula records intent. When `S1` changes, the reader knows which other sizes must move with it.

---

## Button

Cross-checked against the public button docs of Material 3, Apple HIG, Radix Themes, Primer, Atlassian, Polaris and Geist (2026-11-03). Every rule below can be checked in the CSS or the rendered preview.

### Variants and hierarchy

| Variant | Use | Visual |
|---|---|---|
| Primary | The one main action of a view or group | Solid fill in the accent |
| Secondary | Supporting actions | Tonal (soft accent or neutral fill) or a light 1px outline in a neutral or translucent accent, never a near-text dark outline. The outline uses the divider token (`--color-border`), not the input border: inputs need 3:1 against the page to be found, a labelled button does not |
| Ghost / plain | Low emphasis, toolbars, inline actions | No container until hover |
| Danger | Delete, remove, revoke | On the page: red label on a secondary or ghost button. Solid red only on the confirm button of the confirmation dialog, next to a secondary Cancel |

- At most one solid primary per view or group. A solid primary and a solid danger never share a view.
- In a pair, the action that completes the step is the stronger one ("Confirm role change" over "Cancel"); two equal outlined buttons leave the user to work out which one moves on.
- Emphasis comes from the variant, not from a bigger size.

### Size

| Size | Height | Padding inline | Font | Icon / gap |
|---|---|---|---|---|
| SM | 32px | 12px | 13–14px | 16px / 6px |
| MD (default) | 36–40px | 14–16px | 14px | 16–18px / 8px |
| LG | 44–48px | 18–20px | 15–16px | 18–20px / 8px |

Horizontal padding is 0.35–0.6 of the height. In touch-first or sparse content areas, the target is at least 44px (the button, or the button plus its surrounding gap). Minimum width 64px; loading keeps the width.

### Shape

The radius comes from one shape token shared with inputs and selects. Use one of two options. The first is a fixed ratio, radius ≈ 0.15–0.25 of the height (6–8px on a 36px button). The second is a full pill (`9999px`). Square corners (0) only when the direction is deliberately hard-edged. A 2–3px radius on a 32px+ button is neither and reads as unfinished.

### Label

UI sans (`--font-ui`), weight 500–600, 13–15px, sentence case, no letter-spacing beyond ±0.01em, no all-caps. A brand serif stays in headings and display text; button labels use the interface face even when the brand is a serif (Material keeps a plain interface face apart from the brand face). Labels are verbs that say what happens: "Remove Ravi", not "OK".

### States: derive, do not pick

| State | Rule |
|---|---|
| Hover | A state layer of the label color over the fill: `color-mix(in oklab, var(--btn-bg), var(--btn-fg) 8%)`. Ghost buttons get the same layer on a transparent base |
| Pressed | The same layer at 12%. No `scale()`; at most a 1px downward shift |
| Focus | `:focus-visible` only: `outline: 2px solid var(--color-focus); outline-offset: 2px` (solid buttons) or `-2px` (outlined and ghost). One ring, never a doubled border; on a solid fill, add an inset ring of the page color if the outline is hard to see. Ring contrast against the adjacent color ≥ 3:1 |
| Disabled | Neutral, not tinted: neutral fill and muted neutral label, or the whole button at reduced opacity. Prefer not disabling: keep submit enabled and explain what is missing. If disabled, say why nearby |
| Loading | Spinner inside the button, label says what is happening ("Sending invite…"), width and focus kept |
| Transition | Color properties only, 80–150ms, inside `@media (prefers-reduced-motion: no-preference)` |

One rule serves every variant, so no per-variant hover hex values are needed. Relative color syntax (`oklch(from var(--accent) calc(l - 0.06) c h)`) also works, with an `@supports (color: oklch(from red l c h))` fallback.

```css
.btn { --btn-bg: transparent; --btn-fg: var(--color-text); height: var(--control-height); padding-inline: var(--space-4);
  border-radius: var(--radius-control); font: 500 var(--text-ui)/1 var(--font-ui); background: var(--btn-bg); color: var(--btn-fg); }
.btn:hover { background: color-mix(in oklab, var(--btn-bg), var(--btn-fg) 8%); }
.btn:active { background: color-mix(in oklab, var(--btn-bg), var(--btn-fg) 12%); }
.btn:focus-visible { outline: 2px solid var(--color-focus); outline-offset: 2px; }
.btn-primary { --btn-bg: var(--color-accent); --btn-fg: var(--color-on-accent); }
.btn-secondary { --btn-bg: var(--color-surface); box-shadow: inset 0 0 0 1px var(--color-border); }
.btn-danger-quiet { --btn-fg: var(--color-danger); }
@media (prefers-reduced-motion: no-preference) { .btn { transition: background-color 120ms, color 120ms; } }
```

### Showing states

Show live buttons the reader can hover, press and tab to. When a static comparison is needed, force states with an attribute (`data-state="hover"`) styled like the real state, and label the row as forced. Do not make fake buttons labelled "Hover example".

### Richer feedback

Default to the CSS above; it adds no dependency. Use these only when the user asks or the moment clearly earns it, and always with a reduced-motion path and a text outcome for screen readers:
- spring-like easing with `linear()`, a shine or progress fill with `@property`;
- View Transitions for the list change a button causes (feature-detect `document.startViewTransition`);
- SVG filters or a Canvas particle effect for a delete ("dust").

Motion (motion.dev), Rive or Lottie only when the project already uses them or the user names them: each is a new dependency.

### Loading State Pattern

```jsx
// Don't change button width during loading — prevents layout shift
<Button disabled={loading} style={{ minWidth: buttonRef.current?.width }}>
  {loading ? <Spinner size="sm" /> : null}
  {loading ? 'Saving...' : 'Save'}
</Button>
```

---

## Form Inputs

### Input States

| State | Visual |
|---|---|
| Default | Border 1px solid, neutral color |
| Hover | Border darkens slightly |
| Focus | Border 2px solid brand/focus color, focus shadow optional |
| Filled | No change from focus (or subtle border) |
| Disabled | Gray background, text dimmed, cursor not-allowed |
| Read-only | No border or dashed border, no focus ring |
| Error | Red border, error icon, error message below |
| Success | Green border or checkmark (use sparingly — only when validation matters) |

### Anatomy

```
[Label]                        ← required, above the input
[Helper text]                  ← optional, below label, smaller
[Input field]                  ← includes placeholder
[Error message / helper text]  ← below input, error takes priority
```

**Label placement rules:**
- Label ABOVE input: universally correct, mobile-safe, supports long labels
- Label LEFT of input (inline): only for short labels in dense table/form layouts
- Placeholder ONLY: never — placeholder disappears on focus, no label = accessibility failure

### Error Message Placement

Error message appears immediately below the input it describes. Never above. Never in a summary-only block at top of form (can also have summary, but always also inline).

```
[Email address]
[your@email.com ]  ← red border
✕ Please enter a valid email address (example: you@company.com)
```

### Anatomy Spacing

```
Label to input top: 4px
Input height: 40px (MD), 36px (SM), 48px (LG)
Input internal padding: 8–12px vertical, 12–16px horizontal
Input to error message: 4px
Error message font: 12–14px
Between inputs: 16–24px
```

---

## Checkbox and Radio

### Checkbox States

| State | Visual |
|---|---|
| Unchecked | Empty box, visible border |
| Checked | Checkmark inside filled box |
| Indeterminate | Dash inside box (for "select all" when some selected) |
| Hover | Box border darkens |
| Focus | Focus ring around checkbox |
| Disabled unchecked | Gray box, no interaction |
| Disabled checked | Gray filled box, locked |

### Radio Button States

Same as checkbox but circular. Only one can be selected in a group. No indeterminate state.

### Touch Target

Checkbox/radio visual size: 16–20px. Touch target: 44×44px minimum. Extend using padding on the label or wrapper.

### Label Click Area

The entire `<label>` element — including the text — should be clickable to toggle the checkbox/radio.

```html
<label>
  <input type="checkbox" />
  <span>Subscribe to newsletter</span>
</label>
```

---

## Toggle / Switch

Used for settings that take effect immediately without requiring a save action. Distinct from checkbox (which is part of a form that is submitted).

### States

| State | Visual |
|---|---|
| Off | Track gray, thumb left |
| On | Track brand color, thumb right |
| Off + hover | Track darkens slightly |
| On + hover | Track darkens slightly |
| Focus | Focus ring on thumb or track |
| Disabled off | Gray track, low opacity |
| Disabled on | Muted brand color, low opacity |
| Loading | Spinner on thumb during async operation |

### Sizing

| Size | Track width | Track height | Thumb size |
|---|---|---|---|
| SM | 32px | 18px | 14px |
| MD | 44px | 24px | 20px |
| LG | 52px | 28px | 24px |

### Transition

Thumb moves from left to right in 150–200ms with ease-in-out. Track color transitions simultaneously.

### Accessibility

```html
<button
  role="switch"
  aria-checked="true"
  aria-label="Dark mode"
>
  <!-- visual toggle -->
</button>
```

---

## Select / Dropdown

### Anatomy

```
[Label]
[Selected value          ▼]  ← trigger button
   ┌─────────────────────┐
   │ Option 1            │  ← dropdown panel
   │ Option 2      ✓     │  ← selected state
   │ Option 3            │
   └─────────────────────┘
```

### Trigger States

Same as button: default, hover, focus, open (active), disabled.

When open: trigger visually "active" / indented. Dropdown panel appears below (or above if insufficient space).

### Dropdown Panel

- Z-index above all content except modals
- Min-width matches trigger width
- Max-height: 300px with internal scroll (never grow to full viewport)
- Scroll to selected option on open
- Shadow to lift above content

### Keyboard Behavior

| Key | Action |
|---|---|
| Space / Enter | Open dropdown |
| Arrow Down / Up | Navigate options |
| Enter / Space | Select focused option |
| Escape | Close without selecting |
| Tab | Close and move focus to next element |
| Type a letter | Jump to first option starting with that letter |

---

## Modal / Dialog

### Anatomy

```
[Overlay / Scrim]
   ┌──────────────────────────────┐
   │ Title                   [✕] │  ← header
   │──────────────────────────────│
   │                              │
   │  Content area                │  ← body (scrollable if needed)
   │                              │
   │──────────────────────────────│
   │        [Cancel]  [Confirm]  │  ← footer with actions
   └──────────────────────────────┘
```

### Sizing

| Type | Width | Use |
|---|---|---|
| Small | 400px | Confirmation dialogs, simple forms |
| Medium | 560px | Forms, details |
| Large | 720px | Complex content, previews |
| Full | 100vw × 100vh | Image viewers, full editors |

**Max height:** 80vh with internal scroll. Don't let modal grow past viewport.

### Behavior

- **On open:** Scrim fades in (200ms), modal slides up or fades in (200ms). Focus moves to first interactive element inside modal (or modal itself if no interactive element).
- **Focus trap:** Tab cycles only within the modal. Shift+Tab cycles backwards.
- **On close:** Focus returns to the element that triggered the modal.
- **Dismiss:** Escape key + clicking scrim (for non-critical dialogs). Confirmation modals should NOT dismiss on scrim click (accidental dismiss).

### When NOT to Use a Modal

- Displaying a lot of information that the user needs to read (use a page)
- Multi-step flow with 3+ steps (use a full page or drawer)
- Showing content that users frequently need to reference while doing something else (use a panel/drawer)
- Displaying the same modal repeatedly (use inline)

---

## Tooltip

### Rules

- Triggered by hover (desktop) or long press (mobile)
- Appears after 300–500ms delay (prevents tooltips flashing while cursor passes over)
- Disappears on mouse-out or when content no longer focused
- Max width: 200–280px (wraps text)
- Content: description only — no interactive elements (links, buttons) inside a tooltip
- If you need interactive content: use a popover instead

### Placement Priority

```
1. Top (default)
2. Bottom
3. Right
4. Left
Flip automatically if space unavailable in preferred direction
```

### Accessibility

```html
<!-- Tooltip trigger -->
<button aria-describedby="tooltip-id">
  <Icon name="info" />
</button>

<!-- Tooltip content (hidden until hover/focus) -->
<div id="tooltip-id" role="tooltip">
  Tooltip content here
</div>
```

---

## Navigation (Tab Bar / Sidebar)

### Tab Bar Anatomy

```
[Icon + Label] [Icon + Label] [Icon + Label] [Icon + Label]
     ↑ active (indicator below or above)
```

- 3–5 items
- Each item: icon + label (never icon only for primary navigation)
- Active indicator: underline, pill background, or color change
- Inactive: muted color (gray or low-opacity brand)

### Sidebar Anatomy

```
[Brand Logo]
─────────────
[Section header]  ← optional, uppercase, 11–12px
[Nav item] ←      ← icon + label, full width
[Nav item (active)]  ← highlighted background, left accent bar optional
[Nav item]
─────────────
[Sub-items]  ← indented 16–24px, appear on expand
  [Sub-item]
  [Sub-item]
─────────────
[Bottom section: settings, profile, help]
```

### Navigation Item States

| State | Visual |
|---|---|
| Default | Icon + label, neutral |
| Hover | Subtle background highlight |
| Active / current | Highlighted background, bolder text or icon fill |
| Focus | Focus ring |
| Expanded | Chevron rotated 90°, child items visible |
| Collapsed | Chevron pointing right, child items hidden |

---

## Component Spec Checklist

When reviewing or creating a component spec:

- [ ] All interactive states documented (default, hover, focus, active, disabled, loading, error)
- [ ] All meaningful variants specified (not just "there are variants")
- [ ] Keyboard interaction pattern defined
- [ ] ARIA role, properties, and state documented
- [ ] Touch target meets 44×44px minimum
- [ ] Spacing uses design token values (not px values)
- [ ] Every value traces to a source; unknowns are marked `[TBD]`, not guessed
- [ ] Slots are named by role and sizing behavior (fill / hug / fixed), not by sample content
- [ ] Derived sizes and nested radii are written as formulas over named variables
- [ ] Focus indicator visible and meets 3:1 contrast ratio
- [ ] Animation duration and easing from motion tokens
- [ ] Responsive behavior defined (what changes at mobile breakpoint)
- [ ] Error state designed (not just happy path)

---

## Handoff and Build QA

When a chosen direction goes to engineering, the spec must also cover what a mockup cannot show. Adapted from the `design-handoff` skill in Anthropic's [knowledge-work-plugins](https://github.com/anthropics/knowledge-work-plugins) (Apache-2.0) and the `handoff-spec` and `design-qa-checklist` skills in [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills) (MIT).

In addition to the six dimensions, record:

| Area | Record |
|---|---|
| Content | Character limits; the truncation rule (ellipsis, line clamp or wrap); minimum and maximum content; what an empty string or missing field renders |
| Localization | Room for text expansion (design for 40%; see `references/ux/content-strategy.md` → Text expansion), RTL mirroring, locale date and number formats |
| Conditions | Loading on a slow connection, partial data, error, and offline where relevant |
| Responsive | What changes at each breakpoint, not only that the component "adapts" |
| Motion | Trigger, animated properties, duration and easing per transition, and the reduced-motion behavior |
| Rationale | One line on why for each non-obvious decision ("collapses on mobile because the list is used one-handed"), so implementers can make judgment calls |

### Verify the Build Against the Spec

- Compare computed values in the browser (`getComputedStyle` or DevTools), not screenshots judged by eye or a memory of the design. Choose the browser and place probe files as in `references/workflow/quality-baseline.md` → Behavioral evidence: files go in the project's `.variant-work/`.
- Walk every state and variant at every specified breakpoint, with realistic and extreme content.
- Report each mismatch as spec against actual, with element, viewport and value: `card padding: spec S1 = 16, actual 20 @ 390px`.
- A value marked `[TBD]` is not a mismatch. Resolve it in the spec first.
