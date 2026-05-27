# UX Tables & Lists Reference

Tables and lists are among the most interaction-dense components in data-heavy products. This reference covers complex table interaction design: column behavior, sorting/filtering/pagination, row-level actions, and bulk selection — with concrete specs and decision rules.

---

## Table vs. List: When to Use Which

```
Table                          List
─────────────────────────────────────────────────────────────
Multi-column structured data   Single primary attribute + metadata
Comparison across rows         Browsing / sequential reading
Sortable properties            Feeds, activity logs, search results
Numeric data                   Content-heavy items (articles, cards)
Dense data, many attributes    Mobile-primary contexts
Admin / power user contexts    Items with unequal attribute sets
```

**Hybrid: Data list.** For mobile or when items have 2–4 key attributes, a card-style list with structured internal layout bridges both worlds. Avoid full tables on mobile — they require horizontal scroll and collapse badly.

---

## Column Design

### Column width strategy

| Column type | Width approach |
|---|---|
| Fixed ID / code | Fixed px (80–100px) |
| Name / title (primary) | Flexible (min 160px, grows to fill) |
| Short status / category | Fixed px (100–140px) |
| Date / time | Fixed px (140–160px) |
| Numeric amounts | Fixed px, right-aligned |
| Description / notes | Flexible, truncate with ellipsis |
| Actions column | Fixed px (60–120px), always last, no label |

**Column minimum widths:** Never let a column collapse below the point where content becomes unreadable. Set `min-width` on all columns and let the table scroll horizontally if total exceeds viewport.

### Text alignment rules

```
Left-align:   Text content, names, categories, status
Right-align:  Numbers, currency, percentages (align decimal points)
Center-align: Icons, short codes, boolean indicators only
```

Right-aligning numbers is a hard rule, not a preference — it enables at-a-glance magnitude comparison across rows.

### Truncation

```css
.cell-truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: var(--col-max-width);
}
```

Always pair truncation with a tooltip showing the full value on hover. Never truncate numbers, dates, or status labels — these must be readable in full.

---

## Sorting

### Visual indicators

```
Unsorted column:    No indicator (or neutral ↕ icon — optional)
Sorted ascending:   ↑ icon, colored to indicate active
Sorted descending:  ↓ icon, colored to indicate active

Active sort column: Bold or colored header text to reinforce which column is sorted
```

### Interaction behavior

- Click column header to sort ascending; click again for descending; third click resets to default (optional — some products omit reset)
- Only one sort active at a time unless multi-sort is explicitly supported
- Cursor: `pointer` on sortable headers; default on non-sortable headers
- On sort, preserve row selection and scroll position if possible
- Show a subtle loading state if sort triggers a server-side call

### Multi-sort (advanced)

Rarely justified. Use only when users need to sort by e.g. "Status, then Date." If multi-sort is supported:
- Indicate sort order with numbered badges: ①↑ ②↓
- Provide explicit UI to add/remove sort levels (don't rely on Shift+Click alone)
- Show a "Clear sort" affordance

### Default sort

Define a meaningful default — don't leave tables sorted by internal ID. Common defaults:
- Newest first (creation date desc) for content/activity tables
- Alphabetical (name asc) for settings/people tables
- Status priority (active first) for task/issue tables

---

## Filtering

### Filter placement

```
Top of table (header row):    Inline column filters — fast access, always visible
Above table (toolbar):        Global filters — date range, status, category
Sidebar panel (complex):      Many filter dimensions; analytics-style filtering
```

For most product tables, a toolbar with 2–4 key filters covers 80% of use cases.

### Filter component selection

| Filter type | Component |
|---|---|
| Discrete set (status, type) | Segmented control (≤4 options) / dropdown (5+) |
| Multi-select tags/categories | Multi-select dropdown with checkboxes |
| Date range | Date range picker (not two separate date fields) |
| Numeric range (price, amount) | Range slider or min/max fields |
| Free text within column | Inline search input, filter-as-you-type |
| Boolean (active/archived) | Toggle or segmented: "Active / All / Archived" |

### Active filter display

Always show active filters visibly — users forget what filters are active and think the table has no data.

```
[Status: Active ✕]  [Date: Last 30 days ✕]  [Clear all filters]
```

- Show each active filter as a dismissible chip/tag
- "Clear all" only when 2+ filters are active
- When filters are active, show count: "Showing 24 of 156 items"

### Empty state on over-filtering

See `ux-empty-states.md` — no-results type. Always offer "Clear filters" as primary action.

---

## Pagination

### Pagination strategy decision

| Pattern | When to use |
|---|---|
| **Page-based** | Fixed data sets, analytics, export workflows |
| **Load more** | Feeds, browsing, content discovery |
| **Infinite scroll** | Social feeds, image grids — avoid for data tables |
| **Cursor-based** (API) | Large datasets where offset pagination is slow |

**Never use infinite scroll for data tables.** Users need to navigate back to specific rows, reference page numbers in communication, and reach the end of the data set. Infinite scroll breaks all of these.

### Page-based pagination UI

```
[← Prev]  [1] [2] [3] ... [8] [9]  [Next →]   Showing 21–40 of 156 items
```

- Show current page range ("21–40 of 156") — more informative than page number alone
- Show ellipsis if pages > 7; always show first and last pages
- Disable Prev/Next at boundaries (don't hide — hide causes layout shift)
- Allow page size selection: 10 / 25 / 50 / 100 items per page

### Load more pattern

```
[Content items...]
[Content items...]

────────────────────
[Load 25 more items]         ← explicit count, not "Load more"
────────────────────
```

- Show count of additional items to be loaded
- Disable button while loading; show spinner inside button
- Preserve scroll position and loaded items when user navigates away and returns (sessionStorage)

---

## Row Actions

### Action placement by frequency

| Frequency | Placement |
|---|---|
| Primary (most frequent) | Inline button in row — always visible |
| Secondary (occasional) | Visible on row hover |
| Tertiary / destructive | Three-dot overflow menu |

Never put a "Delete" action as an always-visible inline button — accidental deletion risk is too high.

### Hover actions pattern

```css
.table-row .row-actions {
  opacity: 0;
  transition: opacity 150ms ease;
}
.table-row:hover .row-actions,
.table-row:focus-within .row-actions {
  opacity: 1;
}
```

**Critical:** `:focus-within` ensures keyboard-navigated rows also show actions. Never make actions keyboard-inaccessible by relying only on hover.

### Overflow menu

Use when a row has 3+ secondary actions. A three-dot (⋯) or vertical kebab (⋮) menu:
- Always place as the last column
- Keyboard accessible: Enter/Space opens menu; arrow keys navigate; Escape closes
- Group destructive actions at the bottom, separated by a divider
- Destructive items in red

### Inline editing

For tables where rows are directly editable (not in a separate detail view):
- Click cell to enter edit mode; show input field in-place
- Escape cancels; Enter or Tab confirms and moves to next cell
- Show save state: "Saving…" indicator in row while pending
- On error: restore previous value, show inline error toast

---

## Bulk Selection

Bulk selection is power-user territory. Design it to be discoverable but not in the way.

### Selection anatomy

```
┌─────────────────────────────────────────────────────────────────┐
│ [✓] (12 selected)   [Archive]  [Move to...]  [Delete]  [✕ Clear] │  ← Selection toolbar (replaces or overlays header)
├─────────────────────────────────────────────────────────────────┤
│ [✓] Row 1 data                                                   │
│ [✓] Row 2 data                                                   │
│ [ ] Row 3 data                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Checkbox behavior

| Interaction | Result |
|---|---|
| Click row checkbox | Select/deselect that row |
| Click header checkbox (empty) | Select all on current page |
| Click header checkbox (some) | Select all on current page (indeterminate → checked) |
| Click header checkbox (all) | Deselect all |
| Shift+click | Range select from last-selected to current |
| Click outside selected rows | Deselect all (optional — some products preserve selection) |

**Indeterminate state:** When some (not all) rows are selected, the header checkbox shows an indeterminate state (−) — a distinct third visual state.

```css
.checkbox-header:indeterminate {
  /* Most browsers render this natively; verify cross-browser */
  background-image: url("dash-icon.svg");
}
```

### "Select all across pages"

For paginated tables, selecting all on the current page may not cover all matching rows. Offer:

```
[✓] All 25 items on this page are selected.
[Select all 156 items that match your filters]
```

Show this affordance only when:
1. All visible rows are selected
2. More rows exist beyond the current page

The secondary prompt must be explicit about what "select all" means in terms of count and filter scope.

### Bulk action toolbar

- Replace or overlay the table header when selection is active
- Show selection count prominently: "12 selected"
- Show only actions valid for the current selection (disable or hide irrelevant ones)
- "Delete" always requires a confirmation dialog when applied to 2+ items
- "Clear selection" (✕) always available

### Selection with filtering

When filters are active during bulk operations, be explicit:
- "Delete 12 selected items" — affects only selected rows
- "Delete all 156 items matching current filters" — affects unloaded rows too

The second pattern requires an extra confirmation step with the full count visible.

---

## Responsive Behavior

Tables don't translate to mobile. Options in priority order:

**Option 1: Card list** — Most data tables should become card lists on mobile. Each card shows the 2–3 most important attributes; secondary attributes hide or move to a detail view.

**Option 2: Priority columns** — Hide low-priority columns on small viewports. Add a "More" expand per row to see hidden values.

**Option 3: Horizontal scroll** — Last resort for truly data-dense tables (financials, spreadsheet-style). Use `overflow-x: auto` on a wrapper, not on the table itself. Add a scroll shadow to indicate scrollable content.

```css
.table-wrapper {
  overflow-x: auto;
  /* Scroll shadow — indicates more content to the right */
  background: linear-gradient(to right, white 30%, transparent),
              linear-gradient(to left, white 30%, transparent) 100%,
              linear-gradient(to right, rgba(0,0,0,0.08), transparent) 0,
              linear-gradient(to left, rgba(0,0,0,0.08), transparent) 100%;
  background-attachment: local, local, scroll, scroll;
}
```

**Never** force a data table into mobile without an adaptive strategy — pinch-to-zoom on a table is not a usable interface.

---

## Performance Considerations

For tables with hundreds or thousands of rows:

**Virtualization** — Render only visible rows plus a buffer. Libraries: `react-window`, `@tanstack/virtual`. Required when row count > 500.

**Server-side operations** — Sort, filter, and paginate on the server for large data sets. Avoid loading 10,000 rows to sort them client-side.

**Skeleton loading** — Show skeleton rows matching the expected row count during load. Prevents layout shift and communicates structure.

```jsx
// Show skeleton rows while data loads
{isLoading
  ? Array.from({ length: pageSize }).map((_, i) => <SkeletonRow key={i} />)
  : rows.map(row => <DataRow key={row.id} data={row} />)
}
```

---

## Accessibility Checklist

- [ ] `<table>` with proper `<thead>`, `<tbody>`, `<th scope="col">` markup
- [ ] Sortable headers: `aria-sort="ascending"` / `"descending"` / `"none"`
- [ ] Checkboxes: visible label or `aria-label="Select [row name]"`
- [ ] Header checkbox: `aria-label="Select all"` with `aria-checked="mixed"` for indeterminate
- [ ] Keyboard navigation: Tab through interactive elements; arrow keys for grid navigation if applicable
- [ ] Focus visible on all interactive cells
- [ ] Column resizing (if supported): keyboard-accessible resize handles
- [ ] Action overflow menu: keyboard open/navigate/close with arrow keys + Escape

---

## Related References

- `ux-search-patterns.md` — Table-level search, filter-as-search patterns
- `ux-empty-states.md` — Empty tables (first use, filtered empty, error)
- `ux-notifications.md` — Toast feedback for bulk actions
- `ux-error-design.md` — Inline row errors, bulk operation failure states
- `ux-data-visualization.md` — When a chart is better than a table
