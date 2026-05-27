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

---

## Button

### States

| State | Visual |
|---|---|
| Default | Resting state |
| Hover | Background lightens/darkens ~10%, cursor: pointer |
| Active / pressed | Background darkens further, slight scale down (scale 0.98) |
| Focus | Focus ring (2px solid, 2px offset) |
| Loading | Spinner replaces icon or appears left of label; disabled interaction |
| Disabled | 40–50% opacity, cursor: not-allowed, no hover/active states |
| Success | Brief check icon state (optional, for async actions) |

### Variants

| Variant | Use | Visual |
|---|---|---|
| Primary | Main CTA, one per section | Filled, brand color |
| Secondary | Supporting action | Outlined or low-fill |
| Tertiary / Ghost | Lowest emphasis | Text only or very subtle fill |
| Destructive | Delete, remove, cancel permanent | Red fill or red text |
| Icon only | Toolbar, compact UI | Icon with no label |
| Icon + label | Standard | Icon left of label |

**Hierarchy rule:** One primary button per section/card. Secondary and tertiary can co-exist. Never two primary buttons side by side.

### Sizing

| Size | Height | Padding H | Font size |
|---|---|---|---|
| SM | 32px | 12px | 14px |
| MD | 40px | 16px | 14–15px |
| LG | 48px | 20px | 16px |
| XL | 56px | 24px | 16–18px |

### Anatomy

```
[Icon] [Label]
       ↑
       gap: 8px between icon and label
       padding: 8–12px top/bottom, 16–24px left/right (varies by size)
       min-width: 64px (don't let buttons collapse to near-zero width)
```

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
- [ ] Focus indicator visible and meets 3:1 contrast ratio
- [ ] Animation duration and easing from motion tokens
- [ ] Responsive behavior defined (what changes at mobile breakpoint)
- [ ] Error state designed (not just happy path)
