# UX Onboarding Reference

First-use experience design: getting users to value quickly, building correct mental models, and avoiding the abandonment cliff. Grounded in NNGroup research and product growth literature.

---

## Why Onboarding Fails

The most common onboarding failure: **explaining the product instead of delivering value.**

Users don't want to learn your product. They want to achieve their goal. Onboarding should be the shortest path from sign-up to "I got something done."

**The three cliffs:**
1. **Signup cliff** — Too much friction before the user sees anything
2. **Setup cliff** — Required configuration before value is reachable
3. **Blank canvas cliff** — User lands on an empty product with no idea what to do

Good onboarding eliminates all three.

---

## Aha Moment

The specific moment when a user first experiences the core value of your product. Before the Aha moment, users are skeptical. After it, they're retained.

### Identifying the Aha Moment

Look at your most retained users. What did they do in their first session that churned users didn't?

**Examples:**
- Slack: Sent and received first message with a teammate
- Dropbox: Saw a file sync across two devices
- Figma: Shared a file and saw collaborator cursors
- Notion: Created first linked database

**The Aha moment is specific, not vague.** "Understood the product" is not an Aha moment. "Saw that a change made on mobile appeared on desktop in real time" is.

### Designing Toward the Aha Moment

Every step in onboarding should either:
1. Move the user toward the Aha moment
2. Collect information required to deliver the Aha moment

Remove everything else.

```
Bad onboarding flow:
Welcome screen → Product tour (5 slides) → Set preferences →
Choose plan → Invite team → Explore dashboard → [Finally: do the thing]

Good onboarding flow:
Sign up → [Do the core thing immediately] → "Want to invite others?"
```

---

## Empty States

The most neglected part of onboarding — the moment right after signup when nothing exists yet.

### Three Types of Empty States

**First-use empty state:** User has never used this feature. Goal: teach and motivate.
**User-cleared empty state:** User deleted everything. Goal: help them start again.
**Search/filter empty state:** No results found. Goal: help them adjust or try differently.

### First-Use Empty State Design

The empty state is not a failure state — it's a teaching moment.

**Formula:**
```
1. Explain what this space is for (one line, benefit-focused)
2. Show what it looks like when populated (illustration or example)
3. Give a single clear action to get started
```

**Examples:**
```
Bad:
[Empty white space]
"No projects yet"
[Create project button]

Good:
[Illustration showing projects list]
"Your projects live here"
"Create a project to bring your team's work into one place"
[Create your first project →]
```

**Real content beats illustrations:** If you can populate the empty state with sample/example content that shows the product working, do that instead of an illustration. Users learn by doing, not by looking at pictures of doing.

### Search / Filter Empty State

The most common empty state that teams forget to design.

```
Bad: "No results"

Good:
"No results for 'invocie'"
  → Did you mean "invoice"? [Search for invoice]
  → Try removing filters [Clear all filters]
  → Browse all documents [View all]
```

Always provide:
- What was searched (confirm the query)
- A spelling correction if applicable
- Alternative paths forward
- A way to clear filters

---

## Progressive Disclosure

Show only what users need right now. Reveal complexity as users are ready for it.

### Levels of Progressive Disclosure

**Level 1 — Core task visible:** Everything needed for the primary job-to-be-done is immediately visible.

**Level 2 — Power features hidden but accessible:** Advanced options behind "Advanced settings", "More options", "Show all" — discoverable but not in the way.

**Level 3 — Expert mode optional:** Keyboard shortcuts, API access, custom scripting — available but never required.

### Implementing Progressive Disclosure

**Expandable sections:**
```
Basic settings  ▼
  [Essential options]

Advanced settings  ▶
  [Hidden until user clicks — most users never need this]
```

**Contextual reveal:**
- Show "Add custom domain" only after user has set up a basic site
- Show "Bulk actions" only after user has created multiple items
- Show "Keyboard shortcuts" tooltip after user has used the product 5+ times

**Anti-pattern:** Asking for all preferences upfront ("What kind of work do you do? What's your team size? What integrations do you use?") before showing the product. Collect context only when it's needed to personalize the experience.

---

## Onboarding Patterns

### Checklist / Progress Bar

Shows a list of setup tasks with completion indicators. Motivates through completion psychology.

**When it works:**
- Product requires setup steps before delivering value (e.g., add company info, connect data source, invite team)
- Tasks are genuinely necessary, not invented to "engage" users
- Checklist disappears once complete (don't trap users in it)

**When it fails:**
- Tasks are artificial ("Complete your profile" to reach 100%)
- Checklist blocks access to the product until complete
- Checklist is still visible for experienced users who completed it months ago

**Design rules:**
- 3–7 items max (more = overwhelming)
- Show estimated time per item ("~2 min")
- First item should be the easiest / already done at signup
- Last item should be the Aha moment or close to it

### Contextual Tooltips / Coachmarks

Appear next to specific UI elements when first encountered. Explain the element in context.

**Rules:**
- One tooltip at a time (not a tour with 12 steps)
- Appear where the element is, pointing to it directly
- Dismiss on interaction (user clicks the thing → tooltip goes away)
- Never block what they explain
- Re-accessible from help or "?" icon — not one-time only

**Anti-pattern:** Forced linear tours. User clicks through 8 tooltips to get to the interface. Retention research shows most users dismiss tours immediately. **They don't want to be taught — they want to do.**

### Sample / Template Content

Pre-populate the product with example data that shows what it looks like when used.

**"Acme Corp" strategy:** Show the user a sample workspace that looks like a real, well-used version of the product. Users can explore a working example before building their own.

**Benefits:**
- Eliminates blank canvas problem
- Teaches by example, not instruction
- Users can delete sample content when ready

**Examples:** Notion templates, Figma community files, Linear sample project, Trello sample board.

### Inline Onboarding

Embed guidance directly into the UI rather than separate tutorial screens.

```
When user first opens the dashboard:
  [Empty chart placeholder with text inside it]
  "Your sales data will appear here.
   Connect your store to get started → [Connect]"

Not:
  Modal popup: "Welcome! Here's how charts work..."
```

Inline guidance is contextual, undismissable until the action is taken, and helps users understand the cause-effect relationship between action and result.

---

## Signup Flow Design

### Reduce Friction to First Value

**What to collect at signup:** Minimum required to deliver the Aha moment.
**What to collect later:** Everything else.

| Data point | Collect at | Why |
|---|---|---|
| Email | Signup | Account creation |
| Password | Signup | Authentication |
| Name | Signup or first session | Personalization |
| Company / role | After first Aha moment | Context, not required |
| Billing info | At upgrade / purchase | Not at free signup |
| Team members | After user sees value | Invite when ready |
| Preferences / use case | Never at signup | Infer from behavior |

### Social Login

Reduces signup friction significantly. Email + password form = typed text = friction. OAuth tap = one action.

**Order:** Show social login options first, email form below or behind "Or sign up with email".

**Trust consideration:** Some enterprise users won't use Google/GitHub SSO for work tools. Always provide email option.

### Verification Email

Forcing email verification before accessing the product loses 20–30% of signups (they don't click the email).

**Better pattern:**
1. Let user into the product immediately
2. Show a non-blocking banner: "Verify your email to unlock [feature]"
3. Verification unlocks something worth verifying for (inviting others, publishing, etc.)

---

## Measuring Onboarding

### Key Metrics

**Time to Aha moment:** How long from signup to first core action? Target < 5 minutes for consumer apps, < 30 minutes for complex B2B tools.

**Day 1 / Day 7 / Day 30 retention:**
- Day 1: Did they come back after signup?
- Day 7: Did onboarding lead to a habit?
- Day 30: Are they genuinely retained?

**Activation rate:** % of signups who complete the core action (the Aha moment). This is the onboarding conversion metric.

**Funnel drop-off:** Where in onboarding do users abandon? Each drop-off point is a design problem.

### What Ruins Retention Despite Good Onboarding

- **Overpromising:** Onboarding raises expectations the product can't meet
- **Bait-and-switch:** Free trial that's not the real product (limited features mislead users)
- **No value loop:** Product delivers Aha moment once but has no reason to return
- **Notification spam:** Over-aggressive engagement emails after onboarding = unsubscribes and app deletes

---

## Onboarding Anti-Patterns

| Pattern | Problem | Fix |
|---|---|---|
| Splash screen / welcome modal | Delays first interaction | Remove it |
| Mandatory profile completion | Forces work before value | Make it optional, incentivize later |
| Full product tour | Cognitive overload, most skip it | Replace with contextual tooltips |
| Asking "How did you hear about us?" at signup | Friction, feels like a survey | Ask in follow-up email if needed |
| Email verification gate | 20–30% abandonment | Let in immediately, verify later for specific features |
| Forcing credit card at free trial start | High drop-off, breaks trust | Card at end of trial or at upgrade |
| 10-step setup wizard | Fatigue, abandonment cliff | Reduce to 2–3 steps or progressive collection |
| No empty state | Blank canvas paralysis | Templates, sample data, or clear CTA |
| Hiding navigation during onboarding | User feels trapped | Keep nav accessible |
| "Skip for now" that actually skips nothing | Deceptive, re-shows same thing | Respect skip; store preference |
