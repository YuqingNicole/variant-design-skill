# UX Information Architecture Reference

Distilled from Nielsen Norman Group research on IA, navigation, search, and content organization.

---

## What Is Information Architecture

IA is the structure of a digital space — how content is organized, labeled, and connected so users can find what they need. Bad IA is the most common root cause of "I can't find it" complaints.

**Three pillars:**
- **Organization** — How content is categorized and grouped
- **Labeling** — What words are used to describe categories and actions
- **Navigation** — How users move through the structure

**IA ≠ UX design** — IA is the skeleton. UX design is the skin. A good-looking interface with bad IA will still fail users.

---

## Navigation Patterns

### Global Navigation (Always Visible)

Primary navigation accessible from every page. Sets user expectations for the entire product.

**Patterns:**
- **Top nav bar** — Desktop standard. Works for 4–8 top-level items. Breaks when labels are too long or items exceed 8.
- **Left sidebar** — Desktop apps, dashboards, file systems. Works for 5–15 items + nested hierarchy.
- **Bottom tab bar** — Mobile apps. 3–5 items only. More = confusion. Items should be destinations, not actions.
- **Hamburger menu** — Mobile web. Hides navigation. User research shows 20–30% lower engagement with hidden nav vs. visible tab bar for frequent tasks. Use only when vertical space is truly unavailable.

**Selection rules:**
| Product type | Recommended nav |
|---|---|
| Marketing / content site | Top nav |
| Dashboard / admin app | Left sidebar |
| Mobile app | Bottom tab bar |
| Mobile web with 3–5 sections | Bottom tab or top nav |
| Document / writing tool | Left sidebar + top contextual |

### Local Navigation

Navigation within a section — tabs, breadcrumbs, pagination, anchor links.

**Tabs:** Use for peer-level content (same importance, same type). Max 6 tabs. Don't use tabs for sequential steps (use a wizard/stepper instead).

**Breadcrumbs:** Required whenever users can be more than 2 levels deep. Format: `Home > Category > Subcategory > Page`. Clickable except the current page (last item).

**Anchor links / table of contents:** For long pages with 4+ sections. Sticky sidebar TOC for docs/articles over 1000 words.

### Contextual Navigation

In-content links that connect related content. "Related articles", "See also", "You might also like".

**Rule:** Contextual links should surface what the user needs next, not what marketing wants to promote.

---

## Information Scent

Users follow links that look like they'll lead to what they want. If the link doesn't look promising, they won't click — even if it's the right path.

**Strong information scent:** The label or description closely matches what the user is looking for.
**Weak information scent:** Vague, generic, or misleading labels.

**Examples:**
```
Weak scent:
  "Resources" — user doesn't know if this has what they need
  "Solutions" — meaningless marketing term
  "Learn More" — learn more about what?

Strong scent:
  "API Documentation" — clear what's inside
  "Pricing" — exactly what it says
  "Compare plans" — specific action, specific outcome
```

**How to test:** Show users the navigation without context. Ask "where would you click to find X?" If they hesitate or click wrong, scent is weak.

---

## Card Sorting

Research method to discover how users naturally group content — used to validate or build IA.

### Open Card Sort
Users group cards (topics, pages, features) any way they want and name the groups. Use to **discover** mental models and natural categories.

**When to use:** Early in design, before you've built navigation. No IA exists yet.

**Output:** Cluster analysis showing which items users group together most often.

### Closed Card Sort
Users sort cards into pre-defined categories. Use to **validate** an existing IA structure.

**When to use:** You have a proposed IA and want to know if users understand it.

**Output:** How well users' expectations match your structure. Items that end up in the wrong category = labeling problem.

### Tree Testing
Users navigate a text-only tree of your IA to find specific items — without visual design. Tests the IA in isolation from the UI.

**When to use:** After card sorting, before building the full UI. Validates labels and hierarchy.

**Success metrics:**
- **Directness** — Did user go straight to the answer, or wander?
- **First click** — Where did they click first? (First click accuracy predicts overall success rate)
- **Success rate** — Did they find the right item?

---

## Navigation Labels

Labels are the most underrated part of IA. Wrong labels break navigation even when the structure is correct.

### Rules for Good Labels

**Use user vocabulary, not company vocabulary:**
```
✗ "Solutions" → ✓ "Products" or "What we build"
✗ "Offerings" → ✓ "Services"
✗ "Insights" → ✓ "Blog" or "Articles"
✗ "Enabling technologies" → ✓ "Tools"
```

**Be specific:**
```
✗ "Resources" → ✓ "Documentation" + "Tutorials" + "Case studies" (split if different audiences)
✗ "More" → name what's in it
```

**Match the task, not the category:**
```
Task-oriented: "Get a quote", "Start free trial", "Compare plans"
Category-oriented: "Products", "Pricing", "Company"
Both have a place — actions for CTAs, categories for nav
```

**Parallel structure:** All items at the same level should use the same grammatical form.
```
✗ "Getting started" / "API Reference" / "How to deploy" / "Examples"
✓ "Getting Started" / "API Reference" / "Deployment Guide" / "Examples" (all noun phrases)
```

### Labeling Anti-Patterns

| Anti-pattern | Problem | Fix |
|---|---|---|
| Jargon | Users don't know the word | Use the word users search for |
| Ambiguity | Multiple valid interpretations | Be more specific |
| Overlap | User can't decide between two items | Merge or clearly differentiate |
| False precision | Subcategories that don't help | Flatten the hierarchy |
| Mystery meat | Label tells you nothing | Name what's inside |

---

## Content Organization Models

### Hierarchical (Tree)
Most common. Parent → child relationships. Site maps, folder structures.

**Depth vs. breadth tradeoff:**
- **Too deep** (5+ levels) → users get lost, forget context
- **Too broad** (30+ items at one level) → decision paralysis
- **Sweet spot:** 3–4 levels deep, 4–8 items per level

**Rule of thumb:** If users need to click more than 3 times to reach any content, the hierarchy is too deep.

### Sequential
Linear path through content. Onboarding flows, checkout, wizards.

**Design rules:**
- Show progress (step X of Y)
- Allow going back without losing state
- Don't branch unexpectedly
- Each step = one decision or one piece of information

### Matrix / Faceted
Users can navigate via multiple dimensions simultaneously. E-commerce filters, app feature tables.

**Design rules:**
- Show applied filters prominently (always visible, always removable)
- Show result count as filters are applied (not after)
- Provide "clear all" option
- Saved filter sets for power users

### Hub and Spoke
Central page linking out; each spoke is a dead end that returns to hub. Mobile apps, onboarding.

**Design rules:**
- Back to hub must always be one tap/click
- Don't let spokes link to other spokes (spaghetti navigation)

---

## Search Design

Search is navigation for users who've given up on browsing — or for users who know exactly what they want.

### When Search Is Critical

- Content-heavy products (50+ items/pages)
- Power users who know what they want
- Content with many dimensions (database-like)
- Any time "browse" would take 3+ clicks to reach common items

### Search UX Patterns

**Search placement:**
- Top center or top right = expected by Jakob's Law
- Persistent input vs. icon-only: use input when search is a primary task; icon when it's secondary

**Autocomplete / suggestions:**
- Start suggesting after 2–3 characters
- Show 5–8 suggestions max
- Group by category if results span multiple types
- Bold the matching portion of suggestions

**No results state** (the most neglected pattern):
```
Bad: "No results found"

Good:
  "No results for 'invoic' — did you mean 'invoice'?"
  + Suggestions: [Recent searches] [Popular searches]
  + Alternative: "Browse all documents" / "Contact support"
```

**Search results page:**
- Show what was searched (breadcrumb: Results for "invoice")
- Show count ("23 results")
- Filters/facets for large result sets
- Best match first (not most recent, not alphabetical)
- Snippet shows WHY this result matched (highlight query terms in context)

### Search Anti-Patterns

| Pattern | Problem |
|---|---|
| Search that only matches exact strings | Users type naturally, not machine-precise |
| No search on mobile | Desktop has search but mobile doesn't |
| Results page with no filters | Unusable for large result sets |
| Search that searches only titles | Most content is in the body |
| Empty search = empty results | Should show recent/popular or all items |

---

## Site Maps and Flow Diagrams

Tools for designing and communicating IA — not shown to users, used by the team.

### Site Map
Shows the hierarchical structure of pages/screens. Every page node, every relationship.

**What to include:**
- Page/screen name
- Parent-child relationships
- Shared pages (appears in multiple places = different entry points, same page)
- Entry points (homepage, direct links, search results)

**When to use:** Early in design to align on scope before wireframing.

### User Flow
Shows the sequence of steps a user takes to complete a specific task. Each step = a decision point or a screen.

**Format:**
```
Start → [Screen 1] → [Decision: logged in?]
         ├─ Yes → [Dashboard]
         └─ No → [Login screen] → [Dashboard]
```

**Why it matters:** Surfaces all the edge cases (what if they're not logged in? what if they forgot their password?) before they become bugs.

### Content Inventory
Complete list of every piece of content in the product. Used before a redesign to understand scope and find orphan/duplicate content.

---

## IA Anti-Patterns

| Pattern | What goes wrong | Fix |
|---|---|---|
| Org-chart navigation | Site structure mirrors company structure, not user needs | Reorganize around user tasks |
| Duplicate paths | Same content in 2+ places, one gets outdated | Single source of truth + cross-links |
| Too many levels | Users lose context after 3 clicks | Flatten hierarchy |
| Orphan pages | Pages with no links to them | Audit with site crawl; add to relevant sections |
| Mixed metaphors | Two different mental models used in the same product | Pick one, be consistent |
| Feature-named sections | "Project Workspace", "Collaboration Hub" — internal marketing names | Name by what users do there |

---

## IA in the Design Review Checklist

When reviewing information architecture:

- [ ] Can users find the most important content in ≤ 3 clicks from any page?
- [ ] Are navigation labels using user vocabulary (not internal/marketing terms)?
- [ ] Is the hierarchy ≤ 4 levels deep?
- [ ] Are there breadcrumbs or location indicators at every level below the top?
- [ ] Is search available? Does it handle no-results gracefully?
- [ ] Are filter/facet states visible and removable?
- [ ] Do tabs represent peer-level content, not sequential steps?
- [ ] Is there a site map or flow diagram documenting the intended structure?
- [ ] Has the navigation been tested with card sorting or tree testing?
