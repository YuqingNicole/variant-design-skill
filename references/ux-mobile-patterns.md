# UX Mobile Patterns Reference

Interaction design rules for mobile — gestures, thumb zones, platform conventions, and touch-first patterns. Distinct from visual mobile aesthetics (see `references/mobile.md`).

---

## Touch Target Sizing

The minimum touch target is not the visual element — it's the tappable area.

| Platform | Minimum touch target | Recommended |
|---|---|---|
| Apple HIG | 44×44pt | 44–48pt |
| Material Design | 48×48dp | 48–56dp |
| WCAG 2.5.5 (AAA) | 44×44px | — |
| WCAG 2.5.8 (AA, 2.2) | 24×24px minimum | 24px+ with 24px spacing |

**Common violation:** Icon buttons (back arrow, close, share) rendered at 20×20px visually but needing a 44×44px tap area. Apply padding invisibly:
```css
.icon-button {
  width: 20px;
  height: 20px;
  padding: 12px;          /* Tap area = 44×44 */
  margin: -12px;          /* Collapse layout impact */
  touch-action: manipulation; /* Prevent double-tap zoom delay */
}
```

**Spacing between targets:** Minimum 8pt/dp between adjacent tap targets to prevent mis-taps.

---

## Thumb Zones

Steven Hoober's research on how people hold phones defines where on screen each hand can reach comfortably.

### One-Handed Grip (Most Common — ~49% of interactions)

```
┌─────────────┐
│  ☠ HARD     │  ← Top: requires stretch, error-prone
│  ☠ HARD     │
│─────────────│
│  ✓ OK       │  ← Middle: reachable but not natural
│  ✓ OK       │
│─────────────│
│  ✓✓ EASY    │  ← Bottom 40%: natural thumb zone
│  ✓✓ EASY    │
│  ✓✓ EASY    │
└─────────────┘
```

**Design implications:**
- Primary actions (CTA, most-used nav) → bottom of screen
- Destructive actions → top of screen (harder to tap accidentally)
- Bottom tab bar → correct pattern (puts navigation in thumb zone)
- Top nav bar with back button → forces stretch or grip change

### Two-Handed Use (~36%)
Both thumbs active. Most common for typing. Less relevant for navigation design.

### Cradled / One Hand + Stylus (~15%)
Less common; used for reading and focused tasks.

### Right vs. Left Thumb
~90% of users are right-handed. Left side of screen near bottom = right thumb's natural zone. Right side near top = harder for right-handed users. Don't put critical actions at top-right.

---

## Gesture Design

### Standard Gestures (Never Override Without Good Reason)

| Gesture | Standard meaning | Override risk |
|---|---|---|
| Swipe left/right | Navigate between pages / dismiss | Low (common in apps) |
| Swipe down | Close bottom sheet / refresh | High — system conflicts |
| Swipe up | Scroll, or dismiss (iOS Home gesture zone) | Very high — avoid in bottom 20% of screen |
| Pinch/spread | Zoom | Never override |
| Long press | Context menu / multi-select | Low |
| Double tap | Zoom to fit / like (Instagram) | Medium — context dependent |
| Pull to refresh | Refresh list | Strong convention — follow it |
| Shake | Undo (iOS), feedback (some apps) | Rarely used, don't rely on it |

### Bottom Gesture Conflict Zone (iOS)

The bottom ~34pt of the screen is the iOS Home Indicator zone. Gestures in this area conflict with:
- Swipe up to home
- Swipe up and hold for app switcher
- Swipe along bottom edge to switch apps

**Rule:** Never place critical buttons or interactive elements in the bottom ~34pt on iPhone X and later. Use `safeAreaInsets.bottom` in native code; in web use `env(safe-area-inset-bottom)`.

```css
.bottom-bar {
  padding-bottom: max(16px, env(safe-area-inset-bottom));
}
```

### Gesture Discoverability

Gestures are invisible. Users can't discover them unless told. Rules:
- Gestures should be supplemental, not the only way to do something
- Provide visual affordances that hint at gesture (handles, drag indicators, partially visible next item)
- Reveal gestures progressively (teach on first encounter, not in onboarding)
- Never gate critical actions on undiscoverable gestures

**Swipe-to-delete example:**
```
✓ Swipe to reveal delete — AND — visible button in edit mode
✗ Swipe to delete — no other way to delete
```

---

## iOS vs Android Conventions

### Navigation

| Pattern | iOS | Android |
|---|---|---|
| Back navigation | Swipe right from left edge + back button in top-left | System back button/gesture (bottom or swipe from either edge) |
| Close modal | Swipe down | Back button / tap scrim |
| Tab bar position | Bottom | Bottom (Material 3) — was top in older Material |
| Floating action button | Less common | Primary action button (Material) |
| Overflow menu | Bottom sheet / action sheet | Top-right ⋮ menu |

**Cross-platform design:** If building one codebase for both, default to bottom navigation (works on both). Avoid relying on Android back button behavior — some users disable navigation gestures.

### Interaction Conventions

| Behavior | iOS | Android |
|---|---|---|
| Tap feedback | Highlight | Ripple effect |
| List item tap | No ripple, subtle highlight | Ripple |
| Destructive actions | Red, confirmation sheet | Red, snackbar with undo |
| Selection in lists | Checkmark right side | Checkbox left side |
| Search | Search bar in nav or below nav | Search in top app bar |
| Date/time picker | Wheel picker (native) | Dialog with calendar (Material) |

### Typography Scale

| Element | iOS (SF Pro) | Android (Roboto/system) |
|---|---|---|
| Large title | 34pt | 57sp (Display Large) |
| Title | 28pt | 22sp (Title Large) |
| Body | 17pt | 16sp (Body Large) |
| Caption | 12pt | 12sp (Body Small) |

**Web/cross-platform:** Use 16px body minimum (browsers default). Scale up for 1.5× line-height. Don't go below 14px for any readable text.

---

## Bottom Sheets

The primary mobile-first overlay pattern. Replaces desktop modals and dropdowns.

### Types

**Standard bottom sheet:** Persistent, can be swiped to different heights.
- Use for: secondary content, details panel, filters
- Heights: collapsed (handle visible) → half-screen → full-screen

**Modal bottom sheet:** Blocks background interaction.
- Use for: actions, confirmations, short forms
- Dismiss: swipe down, tap scrim
- Max height: 60% of screen (don't push to full — use a full page instead)

**Expanded bottom sheet (full screen):** Navigation destination, not a modal.
- Treat as a new screen — has its own nav bar
- Use back/close to dismiss

### Bottom Sheet Rules

```
✓ Show drag handle for swipeable sheets
✓ Content starts below the handle (not behind it)
✓ If list inside: allow list scroll first, then sheet swipe
✗ Don't use bottom sheet for complex multi-step flows (use navigation instead)
✗ Don't open bottom sheet from a bottom sheet (nest maximum 1 level)
✗ Don't put bottom sheets inside tab pages that already have bottom navigation
```

---

## Mobile Forms

Forms on mobile have 40–60% higher abandonment than desktop. Every field matters more.

### Keyboard Handling

| Input type | Use `inputmode` or `type` | Opens |
|---|---|---|
| Email | `type="email"` | @ keyboard |
| Phone | `type="tel"` | Numeric dial pad |
| Number (integer) | `inputmode="numeric"` | Number pad |
| Decimal | `inputmode="decimal"` | Number pad with decimal |
| Search | `type="search"` | Search keyboard |
| URL | `type="url"` | URL keyboard with .com |

**Auto-capitalize and autocorrect:** Turn off for fields where it will cause errors.
```html
<input type="email" autocomplete="email" autocorrect="off" autocapitalize="none" spellcheck="false" />
```

### Keyboard Avoidance

When the keyboard opens, it covers ~40% of the screen. The focused input must scroll into view.

**Common failure:** Form at bottom of page — when user focuses last input, keyboard covers it and "Submit" button. User can't see what they typed and can't submit.

**Fix patterns:**
- Short forms: Place them in top half of page
- Long forms: Use scroll-into-view with 100px buffer above keyboard
- Single-input screens (phone OTP, search): Place input in center — keyboard pushes everything up cleanly

### One Thing Per Screen

For checkout / onboarding flows, each screen should collect one piece of information.

```
✗ Single screen: Name + Email + Phone + Company + Role + Billing address
✓ Step 1: Name + Email (primary identity)
  Step 2: Phone (verification)
  Step 3: Company + Role (context)
  [Billing asked only at purchase, not signup]
```

Benefits: Higher completion rate, clearer progress, easier error recovery.

---

## Loading and Performance Perception

Mobile users are more impatient than desktop users. Network latency is less predictable.

### Skeleton Screens vs. Spinners

| Situation | Use |
|---|---|
| Content with known structure (feed, cards, list) | Skeleton screen |
| Unknown duration operation (upload, processing) | Progress bar with % |
| Fast operation (< 300ms) | Nothing — instant feels better |
| Background operation | Status bar or subtle indicator |
| Blocking operation | Full-screen loading with cancel option |

**Skeleton screen rules:**
- Match the exact layout of the content it represents
- Animate (shimmer left-to-right) to signal loading, not error
- Replace with real content as soon as any chunk is ready (don't wait for everything)

### Optimistic UI

Show the result of an action immediately, before the server confirms. Revert only if server returns error.

```
User taps "Like" →
✓ Heart fills immediately (optimistic) → server confirms in background
✗ Heart stays empty → fills after 300ms server roundtrip (feels sluggish)
```

Best for: likes, follows, simple toggles — anything with a low error rate and easy revert.

---

## Scrolling Patterns

### Infinite Scroll vs. Pagination

| Pattern | Use when | Avoid when |
|---|---|---|
| Infinite scroll | Content consumption (feed, social, browsing) | Users need to return to a specific item |
| Pagination | Search results, data tables, finding specific items | Content consumption / exploration |
| "Load more" button | Middle ground — user controls when to load | — |

**Infinite scroll accessibility failure:** Keyboard and screen reader users get trapped. Always provide a "Load more" button as a fallback.

### Scroll Position Preservation

When user navigates back to a list, restore scroll position to where they were — not to the top.

**Violation:** User scrolls to item 50 in a feed, opens it, presses back → lands at top of feed. Must scroll to item 50 again. Major frustration signal.

---

## Mobile-Specific Anti-Patterns

| Pattern | Problem | Fix |
|---|---|---|
| Hover-only interactions | No hover state on touch | Move to tap or long-press |
| Fixed elements covering content | Keyboard + fixed header = 40% of screen gone | Use `position: sticky` carefully; account for keyboard |
| Tiny tap targets | Mis-taps, frustration | 44×44pt minimum, 8pt spacing |
| Horizontal scroll without indication | Users don't know content exists off-screen | Partially visible next item, scroll indicator |
| Full-screen modals for simple actions | Heavy, feels like navigation | Bottom sheet for simple actions |
| Disabling zoom (`user-scalable=no`) | Breaks accessibility and user preference | Never disable zoom |
| Auto-playing audio/video | Startles user, drains battery | Always require user initiation |
| Desktop-only features hidden on mobile | "Use desktop version for X" | Feature parity or mobile-appropriate alternative |
