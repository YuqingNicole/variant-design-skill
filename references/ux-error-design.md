# UX Error Design Reference

Errors are the most trust-sensitive moments in any interface. A well-designed error recovers the user; a poorly designed one loses them. This reference covers error taxonomy, message writing, recovery path design, and prevention layers.

---

## Error Taxonomy

Not all errors are equal. Classification determines placement, severity, and how hard you fight to prevent them.

| Class | Cause | User Can Fix? | Example |
|---|---|---|---|
| **Validation** | Input doesn't meet requirements | Yes, immediately | "Password must be 8+ characters" |
| **Conflict** | Action clashes with system state | Yes, with guidance | "Email already registered" |
| **Permission** | User lacks access | Depends on role | "You don't have access to this workspace" |
| **Not Found** | Resource doesn't exist or was deleted | Sometimes | "This page doesn't exist" |
| **Network** | Connectivity or timeout | Usually (retry) | "Connection lost. Changes saved locally." |
| **Server** | Backend failure | No — wait or contact support | "Something went wrong on our end" |
| **Limit** | User hit a quota or plan ceiling | Yes — upgrade or reduce | "You've used 100% of your storage" |

**Design decision from the taxonomy:**
- Validation → inline, immediate, actionable
- Network → toast or banner with retry affordance
- Server → full-page if blocking, banner if not; give status link
- Permission → explain *why*, offer a path forward (request access, upgrade)

---

## Message Writing Rules

### The formula

```
[What happened] + [Why it happened, if useful] + [What to do next]
```

Never lead with what *didn't* happen. "Your file could not be uploaded" is weaker than "Upload failed — the file exceeds the 25 MB limit."

### Tone

| Avoid | Use instead |
|---|---|
| "Error", "Failure", "Invalid" as standalone labels | Describe the specific problem |
| Technical codes without explanation | "Code 403 — you don't have permission to view this" |
| Blame language ("You entered…") | Neutral or system-focused ("The password doesn't match") |
| Vague apology ("Sorry for the inconvenience") | Specific and helpful ("We're working on it — check status.example.com") |
| Exclamation marks on errors | Calm, declarative tone |

### Length guidelines

- **Inline field error:** 1 sentence max. Fit on one line.
- **Toast:** 1–2 sentences. Include a link or action button if recovery is possible.
- **Modal or full-page error:** 2–4 sentences. Lead with what happened, follow with what to do. Optional: a secondary "technical details" disclosure for power users.

### Examples

```
Bad:  "An error occurred."
Good: "Couldn't save changes — you're offline. Reconnect to sync."

Bad:  "Invalid input."
Good: "Phone number must include a country code (e.g., +1 212 555 0100)."

Bad:  "You don't have permission to do that."
Good: "Only workspace admins can change billing settings. Ask your admin, or contact support."

Bad:  "500 Internal Server Error"
Good: "Something went wrong on our end. Your data is safe — try again in a moment."
```

---

## Inline Validation Timing

When to show a field error is as important as what to say.

| Trigger | When to use | Why |
|---|---|---|
| **On blur** (field loses focus) | Default for most fields | Doesn't interrupt mid-typing |
| **On submit** | Short forms, low-complexity validation | Less disruptive for quick inputs |
| **On input (live)** | Password strength only; format-as-you-type masks | Immediate feedback on complex rules |
| **On submit + persist inline** | Any form | Show all errors at once, keep them visible while user corrects |

**Never:** Show an error while the user is still typing the correct answer. Premature errors on email fields (triggering "invalid email" before `@` is typed) destroy trust.

**Always:** Clear the error as soon as the condition is resolved — not on next submit, but immediately as the user types.

```css
/* Error state tokens */
--color-error:        oklch(55% 0.22 25);    /* Red — strong but not alarm-red */
--color-error-subtle: oklch(97% 0.03 25);    /* Background tint for error zones */
--color-error-border: oklch(70% 0.18 25);

.field-error {
  color: var(--color-error);
  font-size: 0.8125rem;   /* 13px — smaller than field label */
  margin-top: 4px;
  display: flex;
  align-items: flex-start;
  gap: 4px;
}
.field-error::before {
  content: "⚠";           /* Or SVG icon — always pair color with icon for a11y */
  flex-shrink: 0;
  margin-top: 1px;
}
```

---

## Error Placement Hierarchy

Where an error appears signals how important it is and how broadly it affects the user.

```
[Page-level banner]          ← System status, degraded service, session expiry
─────────────────────────────
[Form-level summary]         ← "3 fields need attention" — links to each
─────────────────────────────
[Section-level callout]      ← A group of fields failed a cross-field rule
─────────────────────────────
[Field-level inline]         ← Single field validation
─────────────────────────────
[Toast / Snackbar]           ← Async operation result (save failed, upload error)
```

**Rule:** Match the scope of the error to its placement. A billing error shouldn't appear as a tiny inline field message; a password mismatch shouldn't trigger a page-level banner.

---

## Recovery Path Design

Every error state needs an exit. Design the exit before designing the error message.

### Recovery pattern matrix

| Error type | Primary recovery | Secondary recovery |
|---|---|---|
| Validation | Fix the field (keep values, don't clear form) | Help text / format example |
| Network / timeout | Retry button (auto-retry with backoff for silent ops) | Check connection guide |
| Server error | Retry, then contact support | Status page link |
| Not found | Go back / search | Suggest related content |
| Permission denied | Request access CTA | Upgrade plan CTA (if gated by tier) |
| Conflict (e.g., duplicate) | "Use existing" or "Create with different name" | — |
| Limit reached | Upgrade CTA | Delete items to free space |

### Auto-retry for network errors

Don't force the user to manually retry transient failures. Build exponential backoff into network operations, show a subtle "Retrying…" state, and only surface the error UI if all retries fail.

```
Attempt 1 → fail → wait 1s → Attempt 2 → fail → wait 2s → Attempt 3 → fail → show error
```

### Preserve user work

On any error that interrupts a flow, preserve everything the user has entered. Never clear a form on submit failure. If the session expires, save draft state to localStorage and restore on re-auth.

---

## Prevention Layers

The best error is one the user never sees. Layers of prevention, ordered from most to least effective:

**1. Constraints** — Make the wrong action impossible  
Disable the submit button until required fields are complete. Disable date selection for unavailable dates. Don't let users type non-numeric characters into a number field.

**2. Format affordances** — Make the right format obvious  
Use input masks, placeholders with real examples, helper text below the field. Show "(e.g., +1 212 555 0100)" before they type, not after they fail.

**3. Confirmation gates** — Verify before destructive actions  
"Delete this project? This can't be undone." Require typing the project name to confirm deletion of high-stakes items.

**4. Undo** — Make mistakes recoverable  
Prefer soft delete + undo over confirmation dialogs. "Project deleted. [Undo]" is faster and less disruptive than "Are you sure?"

**5. Inline validation** — Catch errors as they're made  
Last line of prevention before submit. See timing rules above.

### The poka-yoke checklist

Before shipping any form or destructive action, verify:
- [ ] Can the user submit a state that will obviously fail? (disable or prevent)
- [ ] Is the expected format visible before the user types?
- [ ] If they do fail, is the error next to the source of the problem?
- [ ] Does the error tell them exactly what to fix?
- [ ] Is their entered data preserved?
- [ ] Is there a clear next step in the error message?

---

## Error States for Async Operations

Loading → error transitions need their own treatment.

```
Pattern: Optimistic UI
─────────────────────
User action → Immediately show success state → 
  If API call succeeds: keep success state
  If API call fails: revert to previous state + show error toast

Use for: low-stakes actions where failure is rare (like/upvote, toggle, reorder)
Never for: payments, deletion, sends — always wait for confirmation

Pattern: Pessimistic UI
───────────────────────
User action → Show loading indicator → 
  If success: transition to success state
  If fail: show error in context (inline or toast)

Use for: payments, file uploads, form submits, anything irreversible
```

### Empty vs. error differentiation

An empty list and a failed list load look identical without intentional design.

```
Empty state:  "No results" + illustration + action CTA
Error state:  "Couldn't load results" + retry button + (optionally) last-known data

Visual signal: Empty uses neutral tone (gray illustration, secondary text)
               Error uses error color (red icon/text) and includes retry
```

---

## Accessibility Requirements

- **Never use color alone** to indicate an error — always pair with an icon, text label, or both
- **ARIA roles:** Use `role="alert"` for dynamically injected error messages; `aria-invalid="true"` on the field; `aria-describedby` linking field to error message
- **Focus management:** On form submit with errors, move focus to the first error field or the error summary
- **Screen reader announcement:** Error messages injected into the DOM will be announced via `role="alert"` — don't use `display:none` to hide them; use `visibility:hidden` or remove from DOM entirely

```html
<div class="field-group" aria-invalid="true">
  <label for="email">Email</label>
  <input
    id="email"
    type="email"
    aria-describedby="email-error"
    aria-invalid="true"
  />
  <p id="email-error" role="alert" class="field-error">
    Enter a valid email address (e.g., name@example.com)
  </p>
</div>
```

---

## Related References

- `ux-empty-states.md` — Differentiating error from empty, empty state patterns
- `ux-onboarding.md` — Error states during first-use flows
- `ux-notifications.md` — Toast and banner placement for async errors
- `design-system/micro-interactions.md` — Error animation (shake, pulse)
