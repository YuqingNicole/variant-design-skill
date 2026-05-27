# UX Interaction Transitions Reference

The feel of an interface lives in the transitions between states — not in the states themselves. This reference covers component-level transition choreography: timing, easing, sequencing, and the perceptual principles that make interactions feel responsive, natural, or broken.

Distinct from general motion principles (see `references/design-system/motion-design.md`) and scroll/hover effects (see `references/design-system/micro-interactions.md`) — this is specifically about **state-to-state transitions within and between components**.

---

## The Perception Model

Before timing numbers, understand what the brain is doing:

| Delay | Perception |
|---|---|
| < 100ms | Instantaneous — feels like direct manipulation |
| 100–300ms | Fast response — system is reacting to me |
| 300–1000ms | Noticeable — something is happening |
| > 1000ms | Waiting — I've handed control to the system |
| > 10s | Abandoned — user's attention has moved elsewhere |

**The design goal:** Keep every interaction feeling like it's in the first two rows. When something takes longer (network call, complex render), use motion to *bridge* the wait — make the user feel the system is working, not broken.

**The responsiveness contract:**
1. **Acknowledge immediately** (< 100ms) — visual feedback that input was received
2. **Show progress** if it takes > 300ms
3. **Deliver or explain** within a predictable time

---

## Easing Reference

Easing curves encode the *personality* of a transition. Using the wrong curve makes a correct timing feel wrong.

```css
/* Standard — general transitions, content entering */
--ease-standard: cubic-bezier(0.4, 0.0, 0.2, 1);

/* Decelerate — elements entering the screen (start fast, slow to rest) */
--ease-enter: cubic-bezier(0.0, 0.0, 0.2, 1);

/* Accelerate — elements leaving the screen (start slow, exit fast) */
--ease-exit: cubic-bezier(0.4, 0.0, 1, 1);

/* Emphasized (Material 3) — high-attention transitions */
--ease-emphasized: cubic-bezier(0.2, 0.0, 0, 1.0);

/* Spring — physical, bouncy, use sparingly */
--ease-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275);

/* Linear — progress bars, spinners, anything continuous */
--ease-linear: linear;
```

**The most important rule:** Enter with deceleration (ease-enter), exit with acceleration (ease-exit). This matches physical intuition — objects arriving slow down, objects leaving speed up. Reversing this feels wrong even when users can't articulate why.

---

## Button Transitions

### Default → Hover
```css
.button {
  transition: background-color 150ms var(--ease-standard),
              box-shadow 150ms var(--ease-standard),
              transform 150ms var(--ease-standard);
}
.button:hover {
  /* Lighten or darken 8–12% — not a full color change */
  background-color: oklch(from var(--color-brand) calc(l + 0.08) c h);
}
```
**150ms, ease-standard.** Fast enough to feel responsive, slow enough to register.

### Hover → Active (Press)
```css
.button:active {
  transform: scale(0.97);
  transition-duration: 80ms; /* Faster than hover — snappy */
}
```
**80ms, scale 0.97.** The shrink on press is the most important tactile signal in digital UI — it confirms "I received your press." Scale 0.95 feels heavy; 0.99 is imperceptible. 0.97 is the sweet spot.

### Default → Loading
```css
/* Step 1: Disable immediately (0ms) — acknowledge the click */
/* Step 2: Replace label with spinner (100ms delay — prevents flash on fast responses) */
/* Step 3: Re-enable after response */

.button--loading {
  cursor: not-allowed;
  opacity: 0.8;
}
.button__spinner {
  animation: spin 600ms linear infinite;
  /* 600ms is perceptually "working but not struggling" */
  /* < 400ms = frantic; > 800ms = broken */
}
```

**The 100ms spinner delay is critical.** If a request completes in 80ms, the user never sees a spinner — it would flash and disappear, which feels glitchy. Show the spinner only if the wait exceeds 100ms.

```javascript
// Implementation pattern
const handleSubmit = async () => {
  let showSpinner = false;
  const spinnerTimeout = setTimeout(() => {
    showSpinner = true;
    setLoading(true);
  }, 100);

  await submitRequest();
  clearTimeout(spinnerTimeout);
  setLoading(false);
};
```

### Default → Disabled
```css
.button--disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transition: opacity 200ms var(--ease-standard);
  /* No transform, no shadow changes — disabled state should feel inert */
}
```

### Loading → Success (Brief confirmation)
```css
/* Spinner → checkmark: 200ms crossfade */
/* Checkmark holds: 800–1200ms */
/* Checkmark → normal: 300ms */
/* Total: ~1.5s — long enough to register, short enough not to block */
```

---

## Form Input Transitions

### Focus Ring Appearance
```css
.input {
  outline: 2px solid transparent;
  outline-offset: 2px;
  transition: outline-color 150ms var(--ease-standard),
              border-color 150ms var(--ease-standard);
}
.input:focus-visible {
  outline-color: var(--color-border-focus);
  border-color: var(--color-border-focus);
}
```
**150ms.** The focus ring should appear fast — it's a direct response to a keypress or click. Slow focus rings feel laggy.

### Error State Appearance
```css
/* Wrong: error appears instantly — feels like a punishment */
/* Wrong: error slides in from far away — too theatrical */
/* Right: error fades + slides up 4px — noticeable but calm */

.input-error {
  animation: error-appear 200ms var(--ease-enter) forwards;
}

@keyframes error-appear {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

**The 4px translate is the key.** More than 8px feels cartoonish. Less than 2px is imperceptible. 4px is exactly enough to guide the eye without distracting.

### Error → Valid (Clearing an error)
```css
/* Fade out faster than it appeared — 120ms */
/* Don't slide — the message is leaving, not arriving */
.input-error--clearing {
  animation: error-disappear 120ms var(--ease-exit) forwards;
}
@keyframes error-disappear {
  to { opacity: 0; }
}
```

**Errors appear slower than they disappear.** The appearance needs to catch attention. The disappearance should feel instant — relief shouldn't be delayed.

---

## Modal / Dialog Transitions

Modal transitions communicate the *relationship* between the page and the overlay.

### Entry
```css
/* Scrim (overlay) */
.scrim {
  animation: scrim-in 200ms var(--ease-standard) forwards;
}
@keyframes scrim-in {
  from { opacity: 0; }
  to { opacity: 0.5; }
}

/* Dialog panel */
.modal {
  animation: modal-in 300ms var(--ease-enter) forwards;
}
@keyframes modal-in {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
```

**Scrim starts first (0ms), modal follows immediately.** The scrim establishes that "something is happening" before the content appears. If both animate simultaneously, neither registers clearly.

**8px translate + scale(0.98).** The combination creates a sense of the modal arriving from slightly below (physical intuition: modals float above the page). Scale reinforces the "surfacing" metaphor. Without scale, the translate alone looks like a slide.

### Exit
```css
/* Exit is faster than entry — 200ms vs 300ms */
/* Accelerate out — objects leaving move faster */
.modal--exiting {
  animation: modal-out 200ms var(--ease-exit) forwards;
}
@keyframes modal-out {
  to {
    opacity: 0;
    transform: translateY(4px) scale(0.99);
    /* Smaller values than entry — exits should be quieter than entries */
  }
}
```

**Exit animations should be shorter and subtler than entry.** The user has dismissed the modal — they want it gone. A slow dramatic exit says "look at me leaving."

### Bottom Sheet Entry (Mobile)
```css
.bottom-sheet {
  transform: translateY(100%);
  transition: transform 400ms var(--ease-enter);
}
.bottom-sheet--open {
  transform: translateY(0);
}
```

**400ms for bottom sheet, 300ms for modal.** Bottom sheets travel farther (full height of visible area), so they get more time — but the easing is the same ease-enter so the *feel* matches.

---

## Dropdown / Select Transitions

```css
.dropdown-panel {
  transform-origin: top center; /* Opens from trigger point */
  animation: dropdown-open 200ms var(--ease-enter) forwards;
}
@keyframes dropdown-open {
  from {
    opacity: 0;
    transform: scaleY(0.9) translateY(-4px);
  }
  to {
    opacity: 1;
    transform: scaleY(1) translateY(0);
  }
}
```

**scaleY(0.9) — not translateY alone.** The scale from the top creates the illusion that the dropdown is unfolding from the trigger. Pure translateY looks like it's sliding in from off-screen — the wrong metaphor for a menu that should feel *attached* to its trigger.

**transform-origin matters.** `top center` makes it expand downward. For dropdowns that open upward (near bottom of viewport), use `bottom center`.

---

## Navigation Transitions

### Tab Switch
```css
/* Cross-fade for sibling tabs — content is at the same level */
.tab-panel {
  transition: opacity 150ms var(--ease-standard);
}
.tab-panel--entering {
  animation: tab-enter 200ms var(--ease-standard);
}
@keyframes tab-enter {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

**No transform on tab content.** Sliding content left/right for tabs is overused and implies directionality that tabs don't have (tabs are peers, not a sequence). Simple crossfade is correct.

**Exception:** If tabs have a clear left-right order (step 1, step 2, step 3), sliding is appropriate. Moving from tab 2 to tab 3 should slide left; moving to tab 1 should slide right — matching the spatial metaphor.

### Page / Route Transition
```css
/* Entering page */
.page-enter {
  animation: page-in 300ms var(--ease-enter) forwards;
}
@keyframes page-in {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Exiting page */
.page-exit {
  animation: page-out 200ms var(--ease-exit) forwards;
  /* Exit first, then enter — prevents Z-index overlap issues */
}
@keyframes page-out {
  to { opacity: 0; }
}
```

**Directional page transitions (for sequential flows):**
```css
/* Going forward in a flow */
.page-enter--forward {
  animation: slide-in-right 300ms var(--ease-enter) forwards;
}
@keyframes slide-in-right {
  from { transform: translateX(24px); opacity: 0; }
  to   { transform: translateX(0); opacity: 1; }
}

/* Going back */
.page-enter--back {
  animation: slide-in-left 300ms var(--ease-enter) forwards;
}
@keyframes slide-in-left {
  from { transform: translateX(-24px); opacity: 0; }
  to   { transform: translateX(0); opacity: 1; }
}
```

**24px, not the full viewport width.** Sliding the entire page across the screen is the wrong metaphor for web — it's a mobile-native pattern that feels wrong in desktop UI. 24px creates a subtle direction cue without the theatrical full-width slide.

---

## Toast / Notification Transitions

```css
/* Enter from bottom-right */
.toast {
  animation: toast-in 300ms var(--ease-enter) forwards;
}
@keyframes toast-in {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Auto-exit after hold duration */
.toast--exiting {
  animation: toast-out 200ms var(--ease-exit) forwards;
}
@keyframes toast-out {
  to {
    opacity: 0;
    transform: translateY(-4px); /* Exits upward — visually "consumed" */
  }
}
```

**Stacking multiple toasts:**
```
New toast appears at bottom → existing toast shifts up
Shift animation: transform translateY(-{newToastHeight + gap}px) 
Duration: 200ms ease-standard
```
Each toast should animate its position when a new one appears — not jump. Jumping toasts look broken.

---

## Skeleton → Content Transition

The moment data loads and skeleton is replaced by real content is the most commonly mishandled transition.

```css
/* Wrong: content appears instantly, layout shifts */
/* Wrong: content fades in independently (each item at different time = chaos) */
/* Right: cross-fade the entire skeleton with the content region */

.skeleton-region {
  transition: opacity 200ms var(--ease-standard);
}
.skeleton-region--loaded {
  opacity: 0; /* Fade out skeleton */
}
.content-region {
  opacity: 0;
  transition: opacity 200ms var(--ease-standard) 100ms; /* 100ms delay — wait for skeleton fade */
}
.content-region--visible {
  opacity: 1;
}
```

**Never stagger individual skeleton items on load.** Staggered loading (each card appearing 50ms apart) looks clever in Dribbble shots and horrible in real use — the layout jumps 8 times instead of once.

**One exception:** If content loads progressively (stream), stagger is acceptable — it reflects actual data arrival, not a designed delay.

---

## Choreography: Multi-Element Transitions

When multiple elements transition together, sequencing matters.

### The Container-First Rule
```
1. Container appears (opacity + scale) — 0ms
2. Content inside appears — 50–100ms delay
3. Sub-content appears — 50ms more

Never the reverse (content before container — looks like content
is floating in space)
```

### Stagger Timing
```css
/* List items appearing */
.list-item:nth-child(1) { animation-delay: 0ms; }
.list-item:nth-child(2) { animation-delay: 40ms; }
.list-item:nth-child(3) { animation-delay: 80ms; }
.list-item:nth-child(4) { animation-delay: 120ms; }
/* Cap at 5–6 items — after that, stagger has diminishing returns */
/* Beyond 6 items: stagger only the first 3, rest appear simultaneously */
```

**40ms stagger per item, not 100ms.** 100ms stagger on a 10-item list = the last item appears 1 second after the first. The user is waiting. 40ms on 6 items = 200ms total — feels like a single fluid entrance.

### Modal with Form Inside
```
1. Scrim fades in — 0ms, 200ms duration
2. Modal panel enters — 0ms, 300ms duration (overlaps scrim)
3. Form title appears — 150ms delay, 200ms duration
4. Form fields appear — 200ms delay, 200ms duration
5. Submit button appears — 250ms delay, 200ms duration
```

The delayed content entry guides the eye: frame → title → task → action. Without delays, everything appears at once and the user has to visually scan from scratch.

---

## Reduced Motion

Always respect `prefers-reduced-motion`. Users with vestibular disorders, epilepsy, or motion sensitivity must not be excluded.

```css
@media (prefers-reduced-motion: reduce) {
  /* Strategy: keep duration, remove transform */
  /* Pure opacity transitions are safe — no spatial movement */
  
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    /* 0.01ms, not 0 — prevents some browser jank */
  }
}
```

**Better approach — per-component:**
```css
@media (prefers-reduced-motion: no-preference) {
  .modal { animation: modal-in 300ms var(--ease-enter); }
}
/* Modal still appears with reduced-motion — just no animation */
/* Content is always accessible; animation is an enhancement */
```

---

## Transition Debugging Checklist

When a transition feels wrong, diagnose with these questions:

**Timing:**
- [ ] Is the duration appropriate for the distance traveled? (More distance = more time)
- [ ] Is it in the correct perception row? (< 100ms = instant, 100–300ms = responsive)
- [ ] Does exit happen faster than entry?

**Easing:**
- [ ] Does entering content decelerate (ease-enter)?
- [ ] Does exiting content accelerate (ease-exit)?
- [ ] Is spring/bounce easing being used for non-physical metaphors?

**Choreography:**
- [ ] Does the container appear before its contents?
- [ ] Is stagger delay capped at 40ms per item, max 6 items?
- [ ] Are related elements transitioning together (not independently)?

**Metaphor:**
- [ ] Does the motion direction match the spatial metaphor? (Modal from below = above the page)
- [ ] Does scale reinforce the direction? (Surfacing = scale up; dismissing = scale down)
- [ ] Would a user with no animation background understand what happened from the motion alone?

**Accessibility:**
- [ ] Is `prefers-reduced-motion` handled?
- [ ] Is content always accessible, with animation as an enhancement only?
- [ ] Are no essential interactions hidden behind gesture/motion?
