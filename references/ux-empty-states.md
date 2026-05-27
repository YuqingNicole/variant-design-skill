# UX Empty States Reference

Empty states are not edge cases — they're guaranteed states that every user encounters. First-time visitors, users who've cleared their data, searches with no results, and broken loads all land in an empty state. Poorly designed, they feel like dead ends. Well-designed, they become onboarding moments, recovery prompts, and trust signals.

This reference covers all four empty state types as distinct design problems: **First Use**, **User-Cleared**, **No Results**, and **Error**.

---

## The Four Types

```
┌─────────────────────────────────────────────────────────┐
│  Type          │  Cause               │  User intent     │
├─────────────────────────────────────────────────────────┤
│  First Use     │  Nothing created yet │  "Help me start" │
│  User-Cleared  │  User deleted all    │  "Confirm done"  │
│  No Results    │  Filter/search fail  │  "Fix my query"  │
│  Error         │  Load failed         │  "Let me retry"  │
└─────────────────────────────────────────────────────────┘
```

Each type needs different copy, different illustration tone, and a different primary action. Using one generic "nothing here" design for all four is one of the most common empty state mistakes.

---

## Type 1: First Use

The user just signed up or navigated to a feature for the first time. Nothing exists because nothing has been created yet. This is an **onboarding opportunity**.

### Design goals
1. Orient the user — what is this space for?
2. Reduce activation energy — make the first action feel small
3. Show the reward — what will this space look like when used?

### Structure
```
[Illustration — shows the feature in use, not absence of content]
[Headline — "Your projects live here"]
[Body — 1–2 sentences max: what this is, why it's useful]
[Primary CTA — action verb: "Create your first project"]
[Secondary — optional: "See an example" / "Import existing data"]
```

### Copy principles
- Headline: possession language ("Your X") makes it feel personal, not empty
- Body: benefit-first, not feature-first ("Organize your work in one place" not "Projects are containers for tasks")
- CTA: specific verb ("Create project", not "Get started")

### Illustration tone
- Show the *product in use* — a sample card, a populated list, an active chart
- Avoid: silhouette/ghost outlines of empty containers
- Avoid: stock-art humans looking confused or excited
- Use: brand illustration style, light and optimistic color palette

### Example
```
[Illustration: three sample project cards with sample data]

Your projects live here
Keep all your work organized in one place. Create a project to
invite teammates, set milestones, and track progress.

[Create project]          [See a demo project →]
```

---

## Type 2: User-Cleared

The user intentionally deleted everything — archive, inbox zero, completed task list. This is a **completion state**, not a problem.

### Design goals
1. Confirm success — validate that the action worked
2. Don't push — avoid aggressive CTAs; the user just finished something
3. Offer a gentle next step if natural

### Structure
```
[Illustration — celebratory, light, simple]
[Headline — confirms completion: "All caught up" / "Inbox zero"]
[Body — optional, minimal: "New items will appear here"]
[CTA — optional, contextual: "Archive" / "Browse templates"]
```

### Copy principles
- Headline: declarative completion ("All done" not "Nothing here")
- Body: informational only, not promotional
- No aggressive upsell in this state — the user is in a positive moment, respect it

### Illustration tone
- Celebratory but subtle: checkmark, sparkle, clean slate
- Avoid: confetti-heavy animations (can feel condescending for routine tasks)
- Match frequency of the action — daily inbox zero gets a simple check, one-time setup completion can be more celebratory

### Example
```
[Illustration: simple checkmark or clean inbox icon]

All caught up
New messages will appear here when they arrive.
```

---

## Type 3: No Results

The user searched or filtered and nothing matched. This is a **query correction moment** — the user has intent and needs help adjusting their approach.

### Design goals
1. Confirm what was searched (so user knows the system understood them)
2. Diagnose likely cause (typo? too specific? wrong filter?)
3. Offer concrete paths to try again

### Structure
```
[Illustration — neutral search/magnifying metaphor]
[Headline — echo the query: "No results for 'Q3 Report'"]
[Body — suggest corrections or explain the scope]
[Actions — "Clear filters" / "Search all projects" / "Create new"]
```

### Copy principles
- Echo the search term in the headline — confirms the system received the input
- Suggest up to 3 recovery paths — don't make the user guess
- If filters are active, always offer "Clear all filters" as the first action

### Diagnosing and suggesting

```
User searched:        Likely cause:           Suggest:
──────────────────────────────────────────────────────────
"q3 rprot" (typo)    Spelling error           "Did you mean 'Q3 report'?"
"meeting notes"      Too broad                Show top results with partial match
"budget 2019"        Out of scope/old         "Try searching in Archive"
[search + filters]   Filters too restrictive  "Remove filters to see all results"
No input, just noop  System issue             Handle as error state instead
```

### Example
```
[Illustration: magnifying glass, neutral tone]

No results for "Q3 rprot"

Check the spelling, or try a broader search term.
If you're looking for older files, they may be in the Archive.

[Clear filters]     [Search in Archive]     [Create new document]
```

---

## Type 4: Error

A load failed due to network, server, or permission issues. This is a **recovery state** — the user had intent and hit a wall.

### Design goals
1. Don't leave the user stranded — always offer a retry or next step
2. Be honest but not alarming — "couldn't load" not "error"
3. Differentiate from no-results — different icon, different tone

### Structure
```
[Illustration — error tone: broken connection, warning]
[Headline — "Couldn't load your projects"]
[Body — brief cause if known + "Try again"]
[Primary CTA — "Retry"]
[Secondary — "Contact support" / status page link for persistent errors]
```

### Copy principles
- Never say "error" or "failure" as the headline — describe what didn't load
- If cause is known (offline, server), mention it briefly
- If retrying auto-triggered in the background, show "Retrying…" not static error

### Auto-retry pattern
For network errors, attempt silent background retries before showing the error state. Show "Retrying…" with a spinner rather than immediately alarming the user.

```
Load attempt 1 → fail → 1s pause → attempt 2 → fail → 3s pause →
attempt 3 → fail → show error state with "Retry" button
```

### Example
```
[Illustration: broken connection icon, red-tinted or warm gray]

Couldn't load your projects
Check your connection and try again. If the problem
continues, our status page has real-time updates.

[Try again]     [Check status →]
```

---

## Visual Design System for Empty States

### Illustration sizing and weight

| Context | Illustration size | Tone |
|---|---|---|
| Full page / section | 120–180px | More detailed, illustrated |
| Panel / card | 64–96px | Icon-weight, simple |
| Inline / table row | 24–40px | Icon only, no illustration |

### Color usage by type

```
First Use    → Brand color, optimistic palette
User-Cleared → Success green or neutral — calm, positive
No Results   → Neutral gray — non-alarming, inquisitive tone
Error        → Warning amber or error red — but desaturated/illustrated, not raw
```

### Text hierarchy

```css
/* Headline */
font-size: 1rem;        /* 16px — prominent but not oversized */
font-weight: 600;
color: var(--color-text-primary);

/* Body */
font-size: 0.875rem;    /* 14px */
font-weight: 400;
color: var(--color-text-secondary);
max-width: 320px;       /* Keep lines short — this is not prose */
text-align: center;

/* CTA spacing */
margin-top: 20px;
```

### Layout

```
┌────────────────────────┐
│                        │
│   [Illustration]       │  ← centered, 120–180px
│                        │
│   Headline             │  ← 16px/600, centered
│   Body copy here       │  ← 14px, max 320px, centered
│                        │
│   [Primary CTA]        │  ← standard button
│   [Secondary CTA]      │  ← text link or ghost button
│                        │
└────────────────────────┘

Vertical padding: 48px top + bottom minimum for full-page states
Vertical padding: 24px for embedded/panel states
```

---

## Common Mistakes

| Mistake | Why it fails | Fix |
|---|---|---|
| Single "no data" design for all four types | Misses emotional context — error ≠ celebration | Use distinct illustrations, headlines, and CTAs per type |
| Illustration of empty containers | Reinforces emptiness instead of showing potential | Show the filled state in miniature |
| CTA that doesn't match user intent | "Upgrade plan" on a no-results state feels manipulative | Match CTA to recovery path |
| No CTA at all | Leaves user stranded | Always give at least one path forward |
| Error state that looks like no-results | User retries when they should debug filters | Distinct visual language: warning icon vs. search icon |
| Overly long copy | Empty states get skimmed | Headline + 1 short sentence max |
| Pushy promotional copy in user-cleared states | Ruins the completion moment | Completion states earn neutral/minimal treatment |

---

## Checklist Before Shipping

For each list, grid, search result, or data view, verify:

- [ ] Have I designed all four empty state variants (first use, cleared, no results, error)?
- [ ] Does each variant have distinct illustration, headline, and CTA?
- [ ] Does the no-results state echo the user's search query?
- [ ] Does the error state offer a retry and differentiate from no-results visually?
- [ ] Is the first-use state showing value (filled state preview) not absence?
- [ ] Is the user-cleared state congratulatory, not promotional?
- [ ] Is copy under 2 sentences for body text?
- [ ] Is there at least one action available in every empty state?

---

## Related References

- `ux-error-design.md` — Error classification, recovery path design
- `ux-onboarding.md` — First-use flows, blank canvas problem
- `ux-search-patterns.md` — No-results state in search context
- `ux-notifications.md` — Async error toasts vs. inline empty state errors
