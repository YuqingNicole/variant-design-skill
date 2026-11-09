<!-- Written for Variant Design. The ideas come from this repository's own motion audit of its website and from emilkowalski/skills (MIT); the text is original. -->
# Motion and Feedback Rules

`motion-design.md` covers durations, easing curves, stagger, perceived performance and the reduced-motion basics. This file covers what it leaves out: whether an element should move at all, what a rule of thumb costs in practice, and a few failure modes that come from generated code. Read both when the task adds or changes motion.

## 1. Decide whether to animate

Ask how often the user meets the element. Frequency decides the budget more than taste does.

| How often | Motion |
|---|---|
| Keyboard-initiated, or many times a minute (command palette, shortcuts, tab switching by key) | None |
| Many times a day (hover, list navigation, filters) | A colour, opacity or underline change, 140ms or less. No lift, tilt or slide |
| Now and then (menu, dialog, toast, drawer) | The standard 150–300ms entrance; exits shorter |
| Rare or first time (onboarding, a finished task, a celebration) | May be expressive |

Feedback is not the same as motion. A pressed state or a colour change tells the user the system heard them. When in doubt, remove the animation and keep the state change.

## 2. Budgets

- UI feedback stays within 300ms. The 500–800ms entrances in `motion-design.md` are for one-off moments such as the first paint of a page, not for anything the user triggers repeatedly.
- Press feedback 100–160ms; tooltips and small popovers 125–200ms; dropdowns 150–250ms; dialogs and drawers 200–500ms.
- Put the curve and the durations in tokens on `:root`, for example `--ease-out`, `--dur-press`, `--dur-fast`, `--dur-base`, `--dur-slow`, and use them everywhere. Define them on `:root` rather than on a page class, because view-transition pseudo-elements only inherit from the root. Hand-typed values drift: five curves that almost match are a finding in a review.

## 3. Where a thing comes from

- A popover, menu or tooltip grows from the element that opened it: set `transform-origin` to the trigger's edge. A dialog appears centred, and centre is correct for it.
- Nothing appears from `scale(0)`. Start from `scale(0.95)`–`scale(0.98)` with `opacity: 0`. The only exception is an effect that grows from a physical point, such as a click ripple.
- Press feedback: `:active { transform: scale(0.97) }` with a 100–160ms transition. Keep it between 0.94 and 0.98, and apply it only when `prefers-reduced-motion: no-preference`.

## 4. Make it interruptible

A CSS transition retargets from wherever it is; a keyframe animation restarts from zero.

- Use transitions for anything that can be triggered again before it finishes: toggles, save and like buttons, expanding panels, toasts that stack.
- Use keyframes for one-shot mounts that cannot be re-triggered.
- To animate an element in without JavaScript, use `@starting-style`; where it is not available, set a `data-mounted` attribute after the first frame.
- Drive gestures with springs or by following the pointer, so an interrupted drag keeps its velocity. A gentle spring has `bounce` between 0.1 and 0.3.

## 5. Properties

- Animate `transform`, `opacity`, and colours. Never `transition: all`: it also animates properties added by later rules. Write the property list out.
- Do not animate `width`, `height`, `padding`, `margin`, `top` or `left`; they recalculate layout every frame. To open a panel use `grid-template-rows: 0fr` to `1fr`, or `transform`. A preview that switches between two widths should switch, not animate.
- Keep `filter: blur()` during a transition under about 20px; large blurs are costly, especially in Safari.

## 6. Hover only where hover exists

Put hover motion inside `@media (hover: hover) and (pointer: fine)`. On a touch screen a tap fires a false hover. Anything that is only revealed on hover (a save button on a card) must be visible when the device reports `hover: none`.

## 7. Reduced motion means fewer and gentler, not none

Remove movement, scaling, parallax, autoplaying video and looping effects. Keep the feedback that explains state: opacity and colour changes, focus indicators, progress, and a dialog's fade-in.

`motion-design.md` shows `*, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }` as an option. That removes the feedback too, so prefer limiting what may transition:

```css
@media (prefers-reduced-motion: reduce) {
  .page * { transition-property: opacity, color, background-color, border-color !important; }
  .dialog[open] { animation-name: fade-only; } /* a keyframe that changes opacity only */
}
```

## 8. Page and state transitions

- Same-page changes (open a card, switch a filter): use `document.startViewTransition` through one helper that checks support and skips the transition under reduced motion. Give each moving element a unique `view-transition-name`.
- Navigation between pages: `@view-transition { navigation: auto }` inside `@media (prefers-reduced-motion: no-preference)` is a progressive enhancement; unsupported browsers simply navigate. Register `pageswap` and `pagereveal` listeners in an inline script in the `<head>`, because they fire before deferred modules run.
- If the same element carries a name on two pages, the browser will move it across the screen during a page navigation. Drop those names for the duration of a cross-document transition.

## 9. Focus

Use one focus-ring style across the product: a 2px ring in one token colour, offset from the element. Check that it has at least 3:1 contrast against what is behind it; with an offset, that is the surrounding background, not the element's own fill. A dark bar may use a light ring. Say what you checked (ring colour and contrast); this is not a statement of WCAG conformance.

## 10. Review checklist

1. Is this element met often enough to lose its animation?
2. Within 300ms, with a token for the curve and the duration?
3. Does it grow from the right place, and never from `scale(0)`?
4. Does a press give feedback, and can the motion be interrupted?
5. Only `transform`, `opacity` and colour, and no `transition: all`?
6. Hover motion behind `(hover: hover) and (pointer: fine)`?
7. With reduced motion, are movement gone and feedback kept?
8. One focus ring, at least 3:1 against its background?
