# UX Search Patterns Reference

Search is often the highest-leverage interaction in a product — users turn to it when navigation fails. This reference covers search input behavior, autocomplete and suggestions, filter composition, and results page design, from the simplest search bar to full-scale search experiences.

---

## Search Model Selection

Before designing the UI, align on the underlying model:

```
┌────────────────┬────────────────────────────────────────────┬───────────────────────┐
│  Model         │  When to use                               │  Example              │
├────────────────┼────────────────────────────────────────────┼───────────────────────┤
│  Filter search │  Structured data; user knows what exists   │  Admin user table     │
│  Full-text     │  Content; user searches by terms/phrases   │  Docs, articles       │
│  Semantic      │  Meaning-based; natural language queries   │  AI search, help      │
│  Faceted       │  Multi-dimensional browsing + search       │  E-commerce, catalogs │
│  Command       │  Actions + navigation + search unified     │  Cmd-K, Spotlight     │
└────────────────┴────────────────────────────────────────────┴───────────────────────┘
```

The model determines the interaction pattern. Designing a faceted search UI on a full-text backend, or vice versa, creates mismatch that confuses users.

---

## Search Input Behavior

### Input design

```
┌──────────────────────────────────────────────────┐
│ 🔍  Search projects…                           ✕ │
└──────────────────────────────────────────────────┘
```

- **Icon:** Search icon left-aligned, inside the input — signals function, fills dead space before input
- **Placeholder:** Describe scope and format: "Search projects by name or tag" not "Search…"
- **Clear button (✕):** Appears only when input has content; clears value and returns focus to input
- **Width:** Minimum 200px; 280–360px optimal for desktop search bars in content areas

### Placeholder vs. label

For search inputs embedded in a page (not in a modal), use a visible label above if the input's purpose is non-obvious in context. In navigation bars and toolbars, the icon + placeholder combination is sufficient.

### Keyboard behavior

| Key | Action |
|---|---|
| Type | Filter/search live (if instant search) or accumulate query |
| Enter | Submit search / navigate to results |
| Escape | Close suggestion dropdown; second Escape clears input (optional) |
| ↑ / ↓ | Navigate suggestion list |
| Tab | Move to first suggestion (optional); or close suggestions and move focus |
| Ctrl/Cmd+K | Open search if using command palette pattern |

### Search trigger timing

| Pattern | When to use |
|---|---|
| **As-you-type (instant)** | Fast filter of already-loaded data (< 200 rows); instant local search |
| **Debounced (300ms)** | API-backed search with autocomplete; prevents excessive requests |
| **On Enter only** | Complex queries, slow backends, search with many side effects |
| **On submit button** | Forms with explicit "Search" CTA; advanced search with multiple fields |

Debounce threshold: 300ms for autocomplete; 500ms for full results. Never show stale results — cancel previous requests when a new query fires (AbortController / query cancellation).

---

## Autocomplete and Suggestions

Autocomplete is the most impactful investment in search UX. Good suggestions make users feel the system understands them; poor suggestions feel random and erode trust.

### Suggestion types

```
┌──────────────────────────────────────────────────────┐
│ 🔍  des                                           ✕  │
├──────────────────────────────────────────────────────┤
│ ⏱  design system        ← Recent search             │
│ ⏱  desktop mockups      ← Recent search             │
├──────────────────────────────────────────────────────┤
│ 🔍  design tokens       ← Query completion           │
│ 🔍  design critique     ← Query completion           │
├──────────────────────────────────────────────────────┤
│ 📄  Design System v2    ← Direct result match        │
│ 📄  Desktop App Spec    ← Direct result match        │
└──────────────────────────────────────────────────────┘
```

**Priority order for suggestions:**
1. Recent searches by this user (personalized, fast)
2. Query completions (what others search for that starts with this prefix)
3. Direct result matches (show up to 3–5 top results inline)
4. Category/type shortcuts ("Search in Documents", "Search in People")

### Suggestion list design

- Max 8 items total before scroll — users don't scroll suggestion lists
- Group by type with dividers and section labels if mixing types
- Highlight the matching prefix in bold: `**des**ign system`
- Show an icon indicating result type (document, person, action)
- Never show confidence scores or internal rankings

### Suggestion interactions

```
Hover item        → highlight, show preview if available
Click item        → navigate to result or fill search query
↑↓ arrow keys     → move active item; update input field to match (optional)
Enter on item     → same as click
Escape            → close dropdown, return focus to input, preserve query
```

**Input field behavior during arrow navigation:** Two schools of thought:
- Update the input to match the highlighted suggestion (Windows Explorer style) — good for command/navigation patterns
- Keep the original query, only highlight the list item (Google style) — better for search-and-browse

Choose based on context. For command palettes, update the input. For search, keep the query.

### Zero-query state (search opened, no input yet)

When the user opens a search without typing:
- Show recent searches (personalized history)
- Show trending/popular searches (social proof, discovery)
- Show shortcuts: recent documents, pinned items

```
┌────────────────────────────────────────────┐
│ 🔍  Search…                             ✕  │
├────────────────────────────────────────────┤
│  Recent                                    │
│  ⏱  Q3 roadmap review                      │
│  ⏱  Component library                     │
├────────────────────────────────────────────┤
│  Popular this week                         │
│  🔥  Design system v3                      │
│  🔥  2026 strategy                         │
└────────────────────────────────────────────┘
```

---

## Filter Composition

Filters narrow an existing result set. Search finds items. When combined, they answer: "Find X, then show me only Y."

### Filter affordance patterns

**Toolbar filters** — Compact, always visible, 2–4 key dimensions:
```
[All types ▾]  [Last 30 days ▾]  [Status: Active ✕]  [More filters…]
```

**Facet sidebar** — Full-width browsing, 5+ filter dimensions:
```
│ Results (48)      │
│                   │
│ Type              │
│ ◉ All             │
│ ○ Documents (24)  │
│ ○ Projects (12)   │
│ ○ People (12)     │
│                   │
│ Date modified     │
│ ○ Today           │
│ ○ This week       │
│ ● Last 30 days    │
│ ○ Custom range…   │
```

**Filter chips** — Applied filters as dismissible tags:
```
[type: Document ✕]  [modified: Last 30 days ✕]  [Clear all]
```

### Filter state management

- Filters should be deep-linkable (URL params) — users share filtered views
- Active filter count badge on "More filters" button: "Filters (3)"
- Applying a filter should not reset pagination to page 1 — maintain current position if results overlap
- Show result count update in real-time as filters are toggled

### Search-within-filter vs. filter-within-search

```
Search-first:   User types query → results appear → user applies filters to narrow
Filter-first:   User sets filters → narrowed set visible → user types to search within it
```

Both flows should be supported. The distinction affects the empty state: "no results for your query" vs. "no results matching your filters" — different messages, different recovery actions.

---

## Search Results Page

A full results page (not inline dropdown) is required when:
- Results need context to evaluate (preview, metadata)
- Users browse/compare rather than targeting a specific item
- Sorting and filtering are complex enough to need dedicated space

### Results page anatomy

```
┌────────────────────────────────────────────────────────────┐
│  Search bar (pre-filled with query)           [New search] │
├────────────────────────────────────────────────────────────┤
│  [Active filter chips]               [Clear all filters]   │
│  "48 results for 'design system'"   [Sort: Relevance ▾]   │
├───────────────┬────────────────────────────────────────────┤
│               │  [Result card]                             │
│  Facet        │  [Result card]                             │
│  sidebar      │  [Result card]                             │
│  (optional)   │  ...                                       │
│               │                                            │
│               │  [Pagination]                              │
└───────────────┴────────────────────────────────────────────┘
```

### Results header

The results header carries critical orientation information:
- **Result count:** "48 results" — always visible, updates when filters change
- **Query echo:** "for 'design system'" — confirms the system understood the query
- **Sort control:** Relevance (default for text search) / Date / Title / etc.
- **View toggle:** Grid / List — optional, persist user preference

### Result card design

Match card density to content type:

```
Compact (file/data items):
┌─────────────────────────────────────────────────┐
│ [Icon] Title here                    Date  Type  │
│        Match context: ...query term...           │
└─────────────────────────────────────────────────┘

Standard (content items):
┌─────────────────────────────────────────────────┐
│ [Thumbnail]  Title here                          │
│              Description with ...query match...  │
│              Tag  Tag  ·  Last modified 2d ago   │
└─────────────────────────────────────────────────┘
```

**Match highlighting:** Show the query term in context, highlighted. Aim for 1–2 lines of context around the match — not just the title.

```html
<!-- Server-rendered match excerpt -->
<p class="result-excerpt">
  The <mark>design system</mark> documentation covers tokens, components,
  and usage patterns for the product team.
</p>
```

```css
mark {
  background: oklch(95% 0.08 80);   /* Amber highlight */
  color: inherit;
  border-radius: 2px;
  padding: 0 2px;
}
```

### Relevance vs. recency sorting

Default to **relevance** for intent-driven search (user is looking for a specific thing). Default to **recency** for browsing search (user wants latest content). Let users switch. Never hide the sort control.

### No-results state

See `ux-empty-states.md` — Type 3: No Results. Summary for search context:
- Echo the exact query: "No results for 'desgin systm'"
- Spell-check suggestion if likely typo: "Did you mean 'design system'?"
- Broaden scope suggestion: "Try searching in All Workspaces"
- Remove filter suggestion if filters active: "Clear filters to search everything"
- Create CTA if applicable: "Create a document called 'design system'"

### Search result ranking signals

Design for the mental model users have of ranking, even if you don't control the backend:
- Exact title match > partial match > body match
- Recent items > old items (with decay)
- Items the user has opened before > novel items
- Items shared with the user > items they've never accessed

Show ranking signals transparently when they might surprise the user: "Sorted by date modified" when relevance would give a different order.

---

## Command Palette Pattern

A keyboard-first search overlay that unifies search, navigation, and actions.

### When to use

- Desktop-primary tools (IDEs, design tools, project management)
- Power users who prefer keyboard over mouse
- Apps with 50+ distinct destinations or actions

### Behavior spec

```
Trigger:        Cmd+K (Mac) / Ctrl+K (Windows) / explicit button
Appearance:     Centered modal, 480–640px wide, top-third of viewport
Dismiss:        Escape / click outside
Content:        Recents (on empty) → type to filter across all categories

Result types:   Actions ("Create project", "Invite teammate")
                Navigation ("Go to Settings", "Open Inbox")
                Content ("Find document: …")

Keyboard:       ↑↓ navigate; Enter execute; Tab accept suggestion
```

```
┌──────────────────────────────────────────────────┐
│ ⌘  Type a command or search…                 Esc │
├──────────────────────────────────────────────────┤
│  Recent                                          │
│  ↗  Design System                               │
│  ↗  Q3 Roadmap                                  │
├──────────────────────────────────────────────────┤
│  Actions                                         │
│  ✚  Create project                              │
│  ✉  Invite teammate                             │
│  ⚙  Open settings                              │
└──────────────────────────────────────────────────┘
```

### Command palette vs. global search

These can coexist. The distinction:
- **Command palette:** Action-first. "What do I want to do?" Keyboard-driven.
- **Global search:** Result-first. "What am I looking for?" Mouse-friendly results page.

A well-designed Cmd+K can handle both modes depending on what the user types.

---

## Search Analytics (Design Implications)

Track these metrics to improve search design:

| Metric | What it tells you | Design fix |
|---|---|---|
| Null result rate > 15% | Vocabulary mismatch or missing content | Improve synonym handling, add missing content |
| High click on 3rd+ suggestion | Ranking is poor | Retrain ranking or reorder suggestion types |
| High "Clear and retype" rate | Autocomplete suggestions are unhelpful | Reduce or improve suggestion quality |
| Low click-through on results | Result cards don't show enough context | Add excerpt/preview to result cards |
| High filter abandonment | Filters are too complex or hide results | Simplify filter UI, show result count per filter option |

Surface these insights in a search analytics dashboard for the product team — not just engineering metrics.

---

## Performance

Search feels fast when:
- **Input feels instant:** Never debounce the visual act of typing — only debounce the API call
- **Suggestions appear in < 200ms:** Cache recent queries client-side; prefetch popular queries
- **Results appear in < 500ms:** Show skeleton results after 150ms if the call is slow
- **Relevance is consistent:** Deterministic ranking for the same query — results that change arbitrarily destroy trust

```typescript
// Pattern: optimistic search with skeleton
async function search(query: string) {
  const cachedResults = queryCache.get(query)
  if (cachedResults) {
    setResults(cachedResults)      // Instant from cache
    return
  }

  // Show skeleton after 150ms — not immediately (avoids flicker for fast responses)
  const skeletonTimer = setTimeout(() => setLoading(true), 150)

  const results = await fetchSearch(query)
  clearTimeout(skeletonTimer)
  queryCache.set(query, results)
  setResults(results)
  setLoading(false)
}
```

---

## Accessibility

- **Role:** `role="combobox"` on the input; `role="listbox"` on the suggestions dropdown
- **aria-expanded:** `true` when suggestions visible; `false` when collapsed
- **aria-activedescendant:** ID of the currently highlighted suggestion
- **aria-autocomplete:** `"list"` for suggestion list; `"both"` if input updates to match
- **Live region:** Announce result count when it changes: `aria-live="polite"` on "N results"

```html
<div class="search-wrapper">
  <input
    type="search"
    role="combobox"
    aria-label="Search projects"
    aria-expanded="true"
    aria-autocomplete="list"
    aria-controls="search-suggestions"
    aria-activedescendant="suggestion-2"
  />
  <ul id="search-suggestions" role="listbox">
    <li role="option" id="suggestion-1" aria-selected="false">Design system</li>
    <li role="option" id="suggestion-2" aria-selected="true">Design tokens</li>
  </ul>
</div>
<p aria-live="polite" aria-atomic="true" class="sr-only">
  24 results found
</p>
```

---

## Related References

- `ux-empty-states.md` — No-results and error states for search
- `ux-tables-lists.md` — Table-level filtering and search patterns
- `ux-filters-patterns.md` — (if exists) Advanced filter composition
- `ux-information-architecture.md` — When search replaces navigation
- `interactive-patterns.md` — Dropdown and combobox interaction specs
