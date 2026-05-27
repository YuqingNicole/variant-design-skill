# UX Accessibility Reference

Practical accessibility guidelines grounded in WCAG 2.1/2.2 and inclusive design principles from Nielsen Norman Group research. Accessibility is not a checklist — it is a design quality standard.

---

## Why Accessibility Matters

**Who it affects:**
- 15% of the global population has some form of disability (WHO)
- Vision: color blindness (~8% of men), low vision, blindness
- Motor: tremors, paralysis, RSI — affects keyboard-only and switch users
- Cognitive: ADHD, dyslexia, learning disabilities
- Situational: bright sunlight, one hand occupied, noisy environment

**The curb-cut effect:** Accessibility improvements benefit everyone.
- Captions help users in loud environments and second-language speakers
- Keyboard navigation helps power users who prefer not to use a mouse
- High contrast helps users in bright light
- Clear error messages help all users, not just those with cognitive disabilities

**Legal:** WCAG 2.1 AA is the legal baseline in the EU (EAA), US (ADA), UK (Equality Act), and most other jurisdictions. Inaccessible products face legal liability.

---

## WCAG 2.1 AA — The Four Principles (POUR)

### 1. Perceivable
Information and UI components must be presentable in ways users can perceive.

**Key requirements:**
- All images have alt text (or are marked `alt=""` if decorative)
- Color is never the only means of conveying information
- Text contrast ratio ≥ 4.5:1 (normal text) or 3:1 (large text, 18pt+)
- UI components and focus indicators have contrast ratio ≥ 3:1
- Captions for all video/audio content
- Content doesn't rely on sensory characteristics alone ("click the round button" → name it)

**Quick contrast check:**
| Text type | Minimum ratio | AA | AAA |
|---|---|---|---|
| Normal text (< 18pt) | 4.5:1 | ✓ | 7:1 |
| Large text (≥ 18pt or 14pt bold) | 3:1 | ✓ | 4.5:1 |
| UI components / icons / focus indicators | 3:1 | ✓ | — |

### 2. Operable
UI components and navigation must be operable by all input methods.

**Key requirements:**
- All functionality accessible via keyboard (no mouse traps)
- No content that flashes more than 3 times per second (seizure risk)
- Users can pause, stop, or hide moving content
- Skip navigation link to skip to main content
- Page titles are unique and descriptive
- Focus order follows a logical reading sequence
- Link purpose is clear from link text alone (not "click here", "read more")
- Sufficient time to complete tasks (or user can extend time limits)

### 3. Understandable
Information and operation of UI must be understandable.

**Key requirements:**
- Page language is declared (`<html lang="en">`)
- Unusual words are explained, abbreviations expanded
- Pages behave predictably (no unexpected focus changes, no auto-navigation)
- Error messages identify the problem AND suggest a fix
- Labels for all inputs, never placeholder text as the only label
- Required fields are indicated before the form (not just with an asterisk at the bottom)

### 4. Robust
Content must be interpreted reliably by assistive technologies.

**Key requirements:**
- Valid, semantic HTML (not `<div>` for everything)
- All UI components have name, role, and value (ARIA where HTML semantics fall short)
- Status messages are programmatically determinable (announced by screen readers)

---

## Keyboard Navigation

Keyboard accessibility is the foundation of all accessibility. If something works with a keyboard, it works with a switch, voice control, and most assistive technologies.

### The Keyboard Contract

Every interactive element must be:
1. **Reachable** via Tab key
2. **Operable** via Enter/Space (buttons), arrow keys (menus, sliders)
3. **Visible** — has a clear focus indicator when focused
4. **Announced** — screen readers speak the element's name and role

### Tab Order

Tab order must follow the visual reading order (top-to-bottom, left-to-right in LTR languages).

**Common violations:**
```
✗ CSS grid/flexbox reorders elements visually but DOM order (tab order) doesn't match
✗ Modal opens but focus stays on the trigger button behind it
✗ Tab enters a component but can't exit without using a mouse
✗ Skip navigation link missing — users tab through 40 nav items on every page
```

**Fix patterns:**
```jsx
// Skip navigation (first focusable element on page)
<a href="#main-content" className="sr-only focus:not-sr-only">
  Skip to main content
</a>

// Focus trap in modal (required)
// Use a library like focus-trap-react or implement manually:
// On modal open → move focus to first focusable element in modal
// On modal close → return focus to the trigger element
```

### Focus Indicators

Default browser focus rings are removed by many CSS resets: `outline: none` or `outline: 0`. This is an accessibility failure.

**Requirements:**
- Focus indicator must have at least 3:1 contrast against adjacent colors
- Must be visible (not just a color change — use outline or border change)
- Must surround or be adjacent to the component

**Good focus indicator pattern:**
```css
/* Don't remove it — make it better */
:focus-visible {
  outline: 2px solid #0066cc;
  outline-offset: 2px;
  border-radius: 2px;
}

/* Remove only for mouse users, keep for keyboard */
:focus:not(:focus-visible) {
  outline: none;
}
```

### Keyboard Interaction Patterns (ARIA Authoring Practices)

| Component | Expected keyboard behavior |
|---|---|
| Button | Enter or Space to activate |
| Link | Enter to follow |
| Checkbox | Space to toggle |
| Radio group | Arrow keys to move between options; Tab to leave group |
| Select / dropdown | Space/Enter to open; Arrow keys to navigate; Enter/Escape to close |
| Dialog/Modal | Tab to navigate inside; Escape to close; focus trapped inside |
| Tabs | Arrow keys to move between tabs; Tab to navigate inside active panel |
| Menu | Arrow keys to navigate; Enter to select; Escape to close; Tab to leave |
| Slider | Arrow keys to increment/decrement; Home/End for min/max |
| Tree | Arrow keys to expand/collapse; Enter to select |
| Date picker | Arrow keys for day navigation; Enter to select |

---

## Semantic HTML

Semantic HTML provides meaning that assistive technologies depend on. Non-semantic HTML breaks screen readers and keyboard navigation.

### Use the Right Element

```html
<!-- Wrong: div-soup -->
<div class="button" onclick="submit()">Submit</div>
<div class="header">Page Title</div>
<div class="nav">
  <div class="link" onclick="goto('/home')">Home</div>
</div>

<!-- Right: semantic HTML -->
<button type="submit">Submit</button>
<h1>Page Title</h1>
<nav>
  <a href="/home">Home</a>
</nav>
```

### Heading Hierarchy

Headings (h1–h6) are the primary navigation tool for screen reader users. Many skip from heading to heading to scan the page.

**Rules:**
- One `<h1>` per page (the page title)
- Don't skip levels (no h1 → h3 without h2)
- Use headings for structure, not for style (don't use h2 because you want large text)
- Every major section should have a heading

**Common violation:**
```html
<!-- Wrong: headings used for visual size -->
<h3>Small label text</h3>  <!-- h3 just because it's smaller -->

<!-- Right: use CSS for visual size, heading for structure -->
<p class="label-text">Small label text</p>
```

### Landmark Regions

Landmarks tell screen reader users where major sections of the page are. They can jump directly to `<main>`, `<nav>`, `<aside>`, `<footer>`.

```html
<header>  <!-- or role="banner" -->
  <nav>   <!-- or role="navigation" aria-label="Main" -->
    ...
  </nav>
</header>

<main>    <!-- or role="main" — only one per page -->
  ...
</main>

<aside>   <!-- or role="complementary" -->
  ...
</aside>

<footer>  <!-- or role="contentinfo" -->
  ...
</footer>
```

---

## ARIA — When and How to Use

ARIA (Accessible Rich Internet Applications) adds accessibility information HTML can't express natively. **First rule of ARIA: don't use ARIA if a native HTML element can do the job.**

### When to Use ARIA

- Custom interactive components (not standard HTML elements)
- Dynamic content that changes without page reload
- Complex widgets (tabs, carousels, tree views, autocomplete)
- Status messages and live regions

### Essential ARIA Patterns

**Labels for icon-only buttons:**
```jsx
// Without aria-label: screen reader says "button" — useless
<button onClick={handleClose}>✕</button>

// With aria-label: screen reader says "Close dialog"
<button onClick={handleClose} aria-label="Close dialog">✕</button>
```

**Expanded/collapsed state:**
```jsx
<button
  aria-expanded={isOpen}
  aria-controls="menu-list"
  onClick={toggleMenu}
>
  Menu
</button>
<ul id="menu-list" hidden={!isOpen}>...</ul>
```

**Live regions for dynamic updates:**
```html
<!-- Polite: announced after current speech finishes -->
<div aria-live="polite" aria-atomic="true">
  3 items added to cart
</div>

<!-- Assertive: interrupts current speech (use sparingly — errors only) -->
<div aria-live="assertive" role="alert">
  Error: Could not save. Please try again.
</div>
```

**Required fields:**
```html
<label for="email">
  Email address
  <span aria-hidden="true">*</span>
</label>
<input
  id="email"
  type="email"
  aria-required="true"
  aria-describedby="email-error"
/>
<span id="email-error" role="alert" aria-live="polite">
  Please enter a valid email address
</span>
```

---

## Color and Visual Design

### Color Is Never the Only Differentiator

```
✗ Error: Red field border only
✓ Error: Red border + error icon + error text

✗ Required field: Red asterisk only
✓ Required field: Red asterisk + "(required)" label + screen reader announcement

✗ Chart: Different colored lines only
✓ Chart: Different colors + different line patterns (solid/dashed/dotted) + labels
```

### Color Contrast Requirements

**Tools:** Use a contrast checker (browser extensions: axe DevTools, Colour Contrast Analyser).

**Pitfalls:**
- Placeholder text is not a substitute for a label — it disappears and typically fails 4.5:1
- Disabled states are exempt from contrast requirements — but make them look different from enabled states
- Gradient backgrounds: check contrast at the point where text appears

### Typography for Readability

- Minimum 16px for body text (browsers default)
- Line height 1.5× for body text (WCAG recommendation)
- Line length 45–75 characters per line (not too narrow, not too wide)
- Don't use text in ALL CAPS for long passages (slows reading by ~10%)
- Don't use light font weights (< 300) for body copy

---

## Forms and Inputs

### Always Visible Labels

```html
<!-- Wrong: placeholder as label — disappears on focus, fails screen readers -->
<input type="email" placeholder="Email address" />

<!-- Right: visible label, placeholder as example only -->
<label for="email">Email address</label>
<input type="email" id="email" placeholder="you@example.com" />
```

### Error Messages

```html
<!-- Wrong: error only indicated by color change -->
<input class="error" type="email" />

<!-- Right: error message associated with input -->
<label for="email">Email address</label>
<input
  id="email"
  type="email"
  aria-invalid="true"
  aria-describedby="email-error"
/>
<span id="email-error" role="alert">
  Enter a valid email address (example: you@company.com)
</span>
```

### Input Types

Use the correct `type` attribute — it triggers the right keyboard on mobile and enables browser autofill:

| Data | Input type | Effect |
|---|---|---|
| Email | `type="email"` | @ on mobile keyboard, email autocomplete |
| Phone | `type="tel"` | Numeric keyboard on mobile |
| Number | `type="number"` | Numeric input, spin buttons |
| Password | `type="password"` | Masked input, password manager hooks |
| Date | `type="date"` | Native date picker |
| Search | `type="search"` | Search keyboard on mobile, clear button |
| URL | `type="url"` | URL keyboard on mobile |

---

## Images and Media

### Alt Text Rules

```html
<!-- Informative image: describe what it conveys, not what it depicts -->
<img src="chart.png" alt="Bar chart showing 40% increase in sign-ups in Q4 2024" />

<!-- Decorative image: empty alt so screen reader skips it -->
<img src="divider.png" alt="" role="presentation" />

<!-- Functional image (inside a link/button): describe the action -->
<a href="/home"><img src="logo.png" alt="Return to homepage" /></a>

<!-- Wrong: redundant -->
<img src="photo.jpg" alt="Photo of a dog" />
<!-- (We know it's a photo — describe what matters about it) -->

<!-- Wrong: missing alt -->
<img src="important-chart.png" />
```

### Video and Audio

- **Captions:** Required for all pre-recorded video with audio. Must be accurate, synchronized, include speaker identification and sound descriptions.
- **Transcript:** Recommended for all audio content. Required for deaf-blind users.
- **Audio description:** Required if visual content conveys information not in the audio track.
- **No autoplay:** Never autoplay video with sound. If autoplay is required, mute by default with visible control to unmute.

---

## Accessibility Code Review Checklist

Run these checks during code review:

```bash
# Images missing alt text
grep -rn "<img " --include="*.tsx" --include="*.jsx" --include="*.html" \
  --exclude-dir=node_modules . | grep -v "alt="

# Buttons missing accessible name (no text content, no aria-label)
grep -rn "<button\|<Button" --include="*.tsx" --include="*.jsx" \
  --exclude-dir=node_modules . | grep -v "aria-label\|aria-labelledby\|children\|>"

# outline:none / outline:0 — possible focus indicator removal
grep -rn "outline:\s*none\|outline:\s*0" --include="*.css" --include="*.scss" \
  --include="*.tsx" --include="*.jsx" --exclude-dir=node_modules .

# Missing form labels
grep -rn "<input" --include="*.tsx" --include="*.jsx" --include="*.html" \
  --exclude-dir=node_modules . | grep -v "type=\"hidden\"\|aria-label\|aria-labelledby\|id="

# onClick on non-interactive elements (div, span, p)
grep -rn "onClick" --include="*.tsx" --include="*.jsx" \
  --exclude-dir=node_modules . | grep -E "<div|<span|<p" | head -20

# Missing lang attribute (check index.html / root HTML file)
grep -rn "<html" --include="*.html" . | grep -v "lang="
```

---

## Accessibility Testing Approach

### Automated Testing
Catches ~30–40% of WCAG violations.

- **axe DevTools** (browser extension) — best coverage, low false positives
- **Lighthouse** (Chrome DevTools) — accessibility tab, quick overview
- **eslint-plugin-jsx-a11y** — catches issues at write time in React

### Manual Testing

**Keyboard test (5 minutes):**
1. Unplug your mouse
2. Tab through the entire flow
3. Can you reach every interactive element?
4. Is the focus always visible?
5. Can you complete the primary task without a mouse?

**Screen reader test:**
- macOS: VoiceOver (Cmd+F5 to enable)
- Windows: NVDA (free) or JAWS (paid)
- iOS: VoiceOver (Settings > Accessibility)
- Android: TalkBack

**Core test:** Can you complete the primary user task using only the screen reader?

### User Testing with Disabled Users
Automated and manual testing by non-disabled developers catches technical compliance but misses real-world usability issues. Test with actual users with disabilities — this reveals friction that tools never flag.

---

## Accessibility Anti-Patterns

| Pattern | Problem | Fix |
|---|---|---|
| `outline: none` everywhere | Keyboard users lose focus | Use `:focus-visible` instead |
| `<div onClick>` as button | No keyboard access, no role | Use `<button>` |
| Form placeholders as labels | Label disappears, fails screen readers | Visible `<label>` always |
| Generic link text "Read more" | Screen reader list of links is meaningless | "Read more about accessibility" |
| Toast for critical errors | Screen reader may not catch it | Use `role="alert"` aria-live |
| Color-only form validation | Invisible to color-blind users | Add icon + text |
| Tab index > 0 | Breaks tab order | Use `tabindex="0"` max or rethink DOM order |
| `aria-hidden="true"` on focused element | Focusable but invisible to SR | Don't hide focused elements from AT |
| Infinite scroll with no end | Keyboard users trapped | Provide "Load more" button alternative |
| Carousel auto-advances | Content removed before user reads it | Pause on focus/hover; provide controls |
