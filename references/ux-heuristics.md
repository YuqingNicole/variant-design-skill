# UX Heuristics Reference

Distilled from Nielsen Norman Group research. Use during UX Review mode and as design generation constraints.

---

## Nielsen's 10 Usability Heuristics

### 1. Visibility of System Status
Keep users informed about what's happening. Always provide feedback within a reasonable time.

**What it means:** Every action should produce a visible result. Users should never wonder "did that work?"

**Common violations:**
- Button doesn't change state after click
- File upload with no progress indicator
- Form submission with no success/error response
- Background task running with no status indicator

**Design checklist:**
- [ ] Loading states exist for all async actions (skeleton > spinner for content)
- [ ] Buttons have loading state (disable + show spinner) during submission
- [ ] Success state is explicit, not just "the error went away"
- [ ] Progress indicators for multi-step flows
- [ ] Active/selected state is always visually distinct

**Anti-patterns:**
```
✗ "Submit" button does nothing visibly for 3 seconds
✗ Upload completes but page looks identical
✗ Navigation item looks same whether selected or not
```

---

### 2. Match Between System and the Real World
Speak the users' language. Use words, concepts, and conventions familiar to your audience — not internal jargon.

**What it means:** The system should use the same mental models, metaphors, and vocabulary that users already have.

**Common violations:**
- Technical error codes shown to end users ("Error 0x8007045D")
- Internal product names used in UI (user doesn't know what "WorkflowInstance" means)
- Date formats that differ from user's locale
- Icons with no established meaning used without labels

**Design checklist:**
- [ ] All labels use user vocabulary, not developer/business vocabulary
- [ ] Icons are either universally recognized OR have visible text labels
- [ ] Dates, currencies, and units match user's locale
- [ ] Metaphors map to real-world objects users know (shopping cart, folder, trash)

**Good example:** "Save to favorites" not "Add to bookmark collection"

---

### 3. User Control and Freedom
Users make mistakes. Provide clearly marked "emergency exits" — undo, redo, cancel.

**What it means:** Users need to feel in control. Easy ways out reduce anxiety and encourage exploration.

**Common violations:**
- No undo after destructive action
- No way to cancel a multi-step flow mid-way
- Modal with no close button or ESC support
- "Are you sure?" without actually allowing "no" to do anything

**Design checklist:**
- [ ] Undo available for all destructive actions (delete, archive, send)
- [ ] Cancel available in all multi-step flows
- [ ] Modal dismissible via ESC key + backdrop click + explicit ✕
- [ ] Back navigation works and doesn't lose state
- [ ] "Soft delete" → trash/archive before permanent deletion

**The rule:** Make the escape route as visible as the primary action.

---

### 4. Consistency and Standards
Follow platform conventions. Users shouldn't have to wonder whether different words, situations, or actions mean the same thing.

**What it means:** Internal consistency (your own patterns are consistent) + external consistency (follows platform norms).

**Common violations:**
- "Delete" in one place, "Remove" in another for identical actions
- Primary button is blue on one screen, green on another
- Icon for "edit" is pencil on one page, gear on another
- Form validation triggers on blur in one form, on submit in another

**Design checklist:**
- [ ] Single name for each action, used consistently everywhere
- [ ] Button hierarchy (primary/secondary/destructive) applied consistently
- [ ] Spacing and layout tokens applied from design system
- [ ] Interaction patterns (hover, focus, click) consistent across components
- [ ] Follows OS/platform conventions (right-click context menu, CMD+Z, etc.)

---

### 5. Error Prevention
Design to prevent problems from occurring. Better than a good error message is a design that doesn't let the error happen.

**What it means:** Eliminate error-prone conditions. Confirm before consequential, irreversible actions.

**Common violations:**
- Password field with no "show password" toggle (typos invisible)
- Delete button with no confirmation for irreversible action
- Date picker that accepts impossible dates (Feb 30)
- No validation until final submit (user filled 10 fields, one was wrong)

**Design checklist:**
- [ ] Inline validation for inputs (show while typing or on blur, not only on submit)
- [ ] Destructive actions require confirmation or have undo
- [ ] Auto-format / auto-correct where format is predictable (phone, card numbers)
- [ ] Constrained inputs for constrained choices (date picker > text field for dates)
- [ ] "Show password" toggle on all password fields

**Prevention hierarchy:** Constraint > Confirmation > Undo > Good error message

---

### 6. Recognition Rather than Recall
Minimize the user's memory load. Make objects, actions, and options visible. User shouldn't have to remember information from one part of the interface to another.

**What it means:** Show options rather than requiring users to remember them. Context always visible.

**Common violations:**
- Command-line only interface with no discoverability
- "Continue from last session" but no summary of what that session was
- Filter applied but not visible (results change, user can't see why)
- Breadcrumb absent — user doesn't know where they are

**Design checklist:**
- [ ] Current filters/applied state always visible and removable
- [ ] Breadcrumbs or location indicator in deep navigation
- [ ] Form autocomplete for repeated information (name, address, email)
- [ ] Recently used items surface in relevant contexts
- [ ] Tooltips on icon-only buttons
- [ ] Visible placeholder/examples in inputs (shows expected format)

---

### 7. Flexibility and Efficiency of Use
Accelerators — unseen by novice users — allow experts to work faster. Let users tailor frequent actions.

**What it means:** Design for both ends of the expertise spectrum simultaneously.

**Common violations:**
- No keyboard shortcuts for power users
- Every action requires mouse navigation through menus
- No bulk actions — must repeat action 50 times for 50 items
- Expert users can't hide beginner-oriented help text

**Design checklist:**
- [ ] Keyboard shortcuts for frequent actions (CMD+K, etc.)
- [ ] Bulk actions available in list/table views
- [ ] Saved views / presets for power users
- [ ] Advanced settings hidden by default but accessible
- [ ] Quick actions surfaced on hover (don't require entering sub-pages)

---

### 8. Aesthetic and Minimalist Design
Every extra unit of information competes with the relevant information. Remove anything that doesn't serve the user's current task.

**What it means:** Less is more. Irrelevant information dilutes important information.

**Common violations:**
- Dashboard with 20 metrics when user only acts on 3
- Long onboarding questionnaire before showing value
- Marketing copy inside the app interface
- Multiple CTAs competing for attention on same screen

**Design checklist:**
- [ ] One primary CTA per screen (or at most one primary + one secondary)
- [ ] Progressive disclosure: show basics, reveal details on demand
- [ ] Remove fields from forms that are "nice to have" (every field = drop-off)
- [ ] No decorative elements that compete with functional ones
- [ ] If removing an element wouldn't confuse anyone, remove it

**The test:** Cover each element and ask "if this were gone, would the user's task break?"

---

### 9. Help Users Recognize, Diagnose, and Recover from Errors
Error messages should be in plain language, indicate the problem, and constructively suggest a solution.

**What it means:** Good errors have three parts: what happened, why it happened, how to fix it.

**Common violations:**
- "An error occurred" (tells user nothing)
- Error in red near field but doesn't say what's wrong
- Validation error that clears all other fields
- Error email saying "contact support" with no direct link

**Error formula:** `[What failed] + [Why it failed] + [How to fix it]`

**Examples:**
```
✗ "Invalid input"
✓ "Email address must include @ — for example, name@company.com"

✗ "Error 403"  
✓ "You don't have permission to view this. Ask your admin to share it with you."

✗ "Upload failed"
✓ "File is too large (12 MB). Maximum is 5 MB. Try compressing it first."
```

**Design checklist:**
- [ ] Every error message has all three parts (what/why/fix)
- [ ] Errors appear adjacent to the offending element
- [ ] Form doesn't clear on error — preserve user's input
- [ ] Errors are red but also use text/icon (not color alone) for accessibility
- [ ] System errors give user actionable next step, not just "try again later"

---

### 10. Help and Documentation
Even though it's better if the system can be used without documentation, it may be necessary to provide help. Documentation should be easy to search, focused on the user's task, list concrete steps, and not be too large.

**What it means:** Help should be contextual, not a separate manual users have to search.

**Common violations:**
- Separate help site that requires leaving the app
- Documentation written for developers, not end users
- No empty state guidance (blank canvas problem)
- Onboarding tooltip appears once then is gone forever

**Design checklist:**
- [ ] Empty states teach the interface (show what to do, not just "nothing here")
- [ ] Contextual help inline — tooltip, ? icon, sidebar — not separate docs
- [ ] Onboarding tips re-accessible, not one-time-only
- [ ] Error states link to relevant help or contact
- [ ] First-time use guidance without blocking the UI (not forced modal tours)

---

## Heuristic Severity Ratings

When auditing, rate each violation:

| Rating | Meaning | Priority |
|--------|---------|----------|
| 0 | Not a usability problem | Skip |
| 1 | Cosmetic — fix only if time | Low |
| 2 | Minor — low priority | Medium |
| 3 | Major — important to fix | High |
| 4 | Catastrophic — must fix before launch | Critical |

**Rating factors:** Frequency (how often does this happen?) × Impact (how bad is it when it does?) × Persistence (does the user encounter it repeatedly?)

---

## Heuristic Evaluation Protocol

Use this process for structured UX audits:

1. **Define tasks** — List the 3–5 core tasks a user needs to complete
2. **Walk each task** — Go through the flow step by step as a new user would
3. **Log violations** — Note which heuristic is violated, severity, and location
4. **Look for patterns** — Multiple violations of same heuristic = systemic problem
5. **Prioritize** — Sort by severity × frequency; fix catastrophic issues first
6. **Retest** — After fixes, re-walk the same tasks

**Quick audit format:**
```
Screen: [name]
Task: [what user is trying to do]
Heuristic violated: [H1–H10]
Violation: [describe what's wrong]
Severity: [0–4]
Fix: [specific recommendation]
```

---

## Fitts's Law (Interaction Sizing)

The time to acquire a target is a function of distance and size.

**Practical rules:**
- Touch targets minimum 44×44px (Apple HIG) / 48×48dp (Material)
- Most-used actions = largest, closest to thumb/cursor starting position
- Destructive actions = smaller, farther away, require confirmation
- Edge/corner of screen = effectively infinite size (cursor stops there)
- Put primary CTA at bottom of mobile screen — within thumb reach

---

## Hick's Law (Decision Time)

Time to make a decision grows logarithmically with number of choices.

**Practical rules:**
- Navigation: max 7 items (Miller's Law) — ideally 5 or fewer
- Feature menus: group into categories to reduce perceived complexity
- Onboarding: one decision per screen
- Pricing: 3 tiers is optimal (too few = no comparison; too many = paralysis)
- Reduce choices by personalizing based on context/history

---

## Jakob's Law

Users spend most of their time on other sites. They prefer your site to work the same way as all the sites they already know.

**Practical rules:**
- Logo top-left, links to homepage
- Search top-right or top-center
- Navigation horizontal at top (desktop) or hamburger (mobile)
- Primary CTA high contrast, right side
- Shopping cart top-right
- Don't invent new interaction patterns for basic actions

**When to break it:** Only break conventions when there's overwhelming benefit AND your users are sophisticated enough to adapt. The more mainstream your audience, the more you should follow conventions.
