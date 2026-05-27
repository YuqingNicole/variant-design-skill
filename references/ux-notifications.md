# UX Notifications Reference

Notifications are the interface talking back. Done well, they're brief, timely, and actionable. Done poorly, they're noise that trains users to ignore everything. This reference covers the four core notification types — Toast, Banner, Badge, Push — with selection rules, timing, priority management, and stacking behavior.

---

## The Four Types at a Glance

```
┌──────────────┬───────────────┬────────────────┬──────────────────────┐
│   Type       │  Placement    │  Persistence   │  Primary trigger     │
├──────────────┼───────────────┼────────────────┼──────────────────────┤
│  Toast       │  Overlay      │  Auto-dismiss  │  Async op result     │
│  Banner      │  Inline/fixed │  Persistent    │  System status       │
│  Badge       │  Icon/nav     │  Until cleared │  Background activity │
│  Push        │  OS-level     │  Until cleared │  Time-sensitive event│
└──────────────┴───────────────┴────────────────┴──────────────────────┘
```

---

## Toast (Snackbar)

A brief, floating notification that appears in response to a user action or async operation result. Auto-dismisses. Does not require a response.

### When to use

| Use Toast | Don't use Toast |
|---|---|
| Confirm an async action completed ("Changes saved") | Errors that require user action to fix |
| Notify of non-blocking failure ("Export failed — retry") | Critical system alerts |
| Undo affordance after a destructive action | Information that needs to persist for reference |
| Background task completing ("Upload complete") | Multiple simultaneous notifications |

### Anatomy

```
┌──────────────────────────────────────────────────────┐
│  [Icon]  Message text here           [Action]  [✕]   │
└──────────────────────────────────────────────────────┘
```

- **Icon:** Optional but recommended — colored dot or symbol that conveys severity at a glance
- **Message:** 1 sentence, < 80 characters. State the outcome, not the process.
- **Action:** Optional, single CTA — "Undo", "Retry", "View". Never "OK" (that's just dismissal)
- **Dismiss:** Optional ✕ for long-duration toasts; omit for sub-3s toasts

### Timing

| Severity | Duration | Notes |
|---|---|---|
| Success | 3–4s | Short — user already saw the action succeed |
| Info | 4–5s | Slightly longer — new information |
| Warning | 5–6s | Needs reading time |
| Error with retry | Persistent (manual dismiss) | Don't auto-dismiss errors requiring action |

**Pause on hover:** Freeze the auto-dismiss timer when the user hovers the toast — they're reading it.

### Positioning

- **Bottom-center** (mobile): thumb-reachable action, out of header content
- **Bottom-right** (desktop): out of the primary content reading path
- **Top-center**: Only for warnings/errors that need immediate attention — draws the eye upward, disrupting flow

```css
/* Desktop toast container */
.toast-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  display: flex;
  flex-direction: column-reverse; /* New toasts stack above older ones */
  gap: 8px;
  z-index: var(--z-toast);
  max-width: 360px;
}

/* Mobile toast container */
@media (max-width: 640px) {
  .toast-container {
    right: 16px;
    left: 16px;
    bottom: calc(16px + env(safe-area-inset-bottom));
    max-width: none;
  }
}
```

### Stacking and queue

Avoid more than 3 simultaneous toasts. If multiple actions complete in rapid succession:
- **Queue pattern:** Show one at a time; next appears after the current dismisses
- **Collapse pattern:** If 3+ of same type, show "3 files uploaded" instead of individual toasts
- **Priority override:** An error toast can interrupt and replace a visible success toast

### Variants

```css
/* Success */
--toast-bg:     oklch(97% 0.04 145);
--toast-border: oklch(80% 0.12 145);
--toast-icon:   oklch(55% 0.18 145);

/* Error */
--toast-bg:     oklch(97% 0.03 25);
--toast-border: oklch(80% 0.14 25);
--toast-icon:   oklch(55% 0.22 25);

/* Warning */
--toast-bg:     oklch(98% 0.04 80);
--toast-border: oklch(85% 0.14 80);
--toast-icon:   oklch(60% 0.18 80);

/* Info */
--toast-bg:     oklch(97% 0.03 250);
--toast-border: oklch(82% 0.12 250);
--toast-icon:   oklch(55% 0.18 250);
```

---

## Banner

A persistent, inline or fixed notification that communicates ongoing system states. Requires user acknowledgment or persists until the condition resolves.

### When to use

| Use Banner | Don't use Banner |
|---|---|
| Degraded service or outage | Confirmation of completed actions (use Toast) |
| Maintenance window warning | Background activity (use Badge) |
| Billing / subscription issues requiring attention | Single-field validation errors (use inline) |
| Feature announcements requiring action | Every informational update |
| Offline mode / sync status | — |

### Banner placement hierarchy

```
[System Banner]   ← above navigation, full-width — affects entire product
──────────────────────────────────────────
[Nav]
──────────────────────────────────────────
[Page Banner]     ← below nav, full-width — affects this page/section
──────────────────────────────────────────
[Content]
    [Contextual Banner]  ← inside content — affects a specific component/region
```

**Rule:** Match placement to scope. An account-suspension banner belongs at system level; a form-import warning belongs inside the import panel.

### Anatomy

```
┌──────────────────────────────────────────────────────────────────┐
│  [Icon]  [Headline — optional]  Message text here.  [CTA]   [✕] │
└──────────────────────────────────────────────────────────────────┘
```

- **Icon:** Required for warnings and errors — don't rely on color alone
- **Headline:** Optional for system-level banners; skip for inline contextual ones
- **Message:** 1–2 sentences. State the status, the impact, and next step.
- **CTA:** 1–2 actions max. Primary action + optional "Learn more"
- **Dismiss:** Omit for critical system banners (billing, outage); include for informational ones

### Severity levels

| Severity | Color signal | Can dismiss? | Auto-resolve? |
|---|---|---|---|
| Info | Blue | Yes | No |
| Success | Green | Yes | Yes (when condition clears) |
| Warning | Amber | Optional | No |
| Error / Critical | Red | No (until resolved) | Yes (when condition clears) |

### Multiple banners

If multiple banners are active simultaneously:
1. Show the highest-severity banner first (error > warning > info > success)
2. Limit to 2 visible at once — add a "2 more alerts" collapse below
3. Never stack more than 3 banners at full height; they consume too much vertical space

---

## Badge

A count or dot indicator on an icon or nav item that signals background activity without interrupting the user's current task.

### When to use

| Use Badge | Don't use Badge |
|---|---|
| Unread message count | Completed actions (use Toast) |
| Pending notifications count | Errors requiring immediate attention (use Banner) |
| Activity requiring user attention in another section | Status that changes the entire app state |
| Draft / unsaved changes indicator | — |

### Types

```
Dot badge      ●     — presence only; "something is here"
Count badge   [3]    — quantity; "this many items"
Status badge  [!]    — single flag; used for warnings/errors on icons
```

**Count badge rules:**
- Show raw count up to 99; show "99+" for 100+
- For critical sections (chat, inbox): show exact counts up to 999, then "999+"
- Zero count: hide the badge entirely (don't show [0])

### Anatomy

```css
.badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 8px;
  font-size: 0.6875rem;  /* 11px */
  font-weight: 700;
  line-height: 16px;
  text-align: center;
  background: var(--color-error);
  color: white;
  border: 2px solid var(--color-surface); /* Knockout border so it floats over icon */
}

.badge--dot {
  min-width: 8px;
  width: 8px;
  height: 8px;
  padding: 0;
  border-radius: 50%;
}
```

### Clearing badges

- **Count badge:** Decrement on view of individual item; clear when all items viewed
- **Dot badge:** Clear when user visits the section
- **Unsaved indicator:** Clear only on successful save — not on navigation (risk of losing work)

---

## Push Notifications

OS-level or browser-level notifications delivered outside the app context. High interruption cost — misuse causes permission revocation.

### Permission strategy

**Never ask for push permission on first visit.** Users don't yet understand the value and will deny by default.

```
Optimal timing for permission request:
1. After the user has experienced the value of the feature that drives notifications
2. At a natural pause (not mid-task)
3. Preceded by a permission pre-prompt (in-app screen explaining what they'll get)

Example flow:
User receives first message → reads it → "Get notified of new messages?" [Enable] → 
  if yes → trigger OS permission dialog (primed to accept)
  if no  → do not re-prompt for 30 days
```

### When to send a push

| Send | Don't send |
|---|---|
| Direct messages, mentions | Weekly digest (use email) |
| Task assigned to user | General product updates |
| Time-sensitive alerts | Marketing / engagement prompts |
| Calendar reminders | Activity on content user doesn't own |

### Push message format

```
App Name · Time
[Headline — 50 chars max]
[Body — 100 chars max; frontload the most important information]
[Deep link target: specific resource, not app home]
```

**Personalization:** Include the sender name or relevant entity — "Sarah commented on Q3 Report" is 3× more likely to be tapped than "You have a new comment."

### Frequency capping

Prevent notification fatigue with hard caps:
- Max 3 push notifications per day per user (configurable lower per user preference)
- Respect quiet hours (default: 10pm–8am local time)
- Batch non-urgent notifications if multiple trigger within 1 hour

---

## Priority Management

When multiple notification types are active simultaneously, apply a clear hierarchy.

### Priority order

```
1. Error banner (blocking system issue)
2. Warning banner (action required, not blocking)
3. Toast — error (async operation failed)
4. Toast — success/info
5. Badge update
6. Push notification
```

Higher priority items can interrupt lower priority items. Lower priority items queue.

### The interruption budget

Every notification consumes attention. Maintain an "interruption budget":

| User activity | Max interruption level |
|---|---|
| In a form / entering data | Toast max — no banner overlay |
| Reading / consuming content | No new toasts; queue them |
| Idle / navigating | Any type |
| In a modal | No toasts; queue; badges ok |

Implement this by tracking `userActivity` state and gating notification rendering:

```typescript
type ActivityState = 'idle' | 'navigating' | 'inputting' | 'reading' | 'modal'

function canShowToast(state: ActivityState, severity: Severity): boolean {
  if (state === 'modal') return false
  if (state === 'inputting' && severity === 'info') return false
  return true
}
```

---

## Notification Design Anti-Patterns

| Anti-pattern | Why it fails |
|---|---|
| Auto-dismissing error notifications | User may miss critical information |
| Stacking 5+ toasts simultaneously | Causes panic, user ignores all of them |
| Using push for marketing | Trains users to revoke permissions |
| Showing badge count for low-value activity | Badge loses signal value |
| Banner for every info update | Notification blindness — users tune out |
| No dismiss on informational banners | Wastes vertical space after user has read it |
| Same notification style for success and error | Color-only differentiation fails for color-blind users |
| Toast appearing over primary CTA | Blocks intended action |

---

## Accessibility

- **Role:** `role="status"` for non-critical toasts (polite); `role="alert"` for errors (assertive)
- **aria-live:** `aria-live="polite"` for success/info; `aria-live="assertive"` for errors
- **Focus:** Don't steal focus for toasts; do move focus to the banner if it requires action
- **Keyboard dismiss:** All toasts/banners dismissible with `Escape` key
- **Duration:** Respect `prefers-reduced-motion` — reduce animation, but don't remove the notification itself

```html
<!-- Success toast -->
<div role="status" aria-live="polite" class="toast toast--success">
  Changes saved
</div>

<!-- Error alert requiring action -->
<div role="alert" aria-live="assertive" class="toast toast--error">
  Upload failed — <button>Try again</button>
</div>
```

---

## Related References

- `ux-error-design.md` — Error classification and when errors become notifications
- `ux-empty-states.md` — How async error toasts relate to empty error states
- `design-system/micro-interactions.md` — Toast entry/exit animation specs
- `ux-interaction-transitions.md` — Notification animation choreography
