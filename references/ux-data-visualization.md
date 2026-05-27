# UX Data Visualization Reference

Chart selection, dashboard information density, color encoding, and interactive data patterns. Distinct from aesthetic dashboard design (see `references/dashboard.md`) — this is the analytical layer.

---

## Chart Selection Framework

The most important decision in data visualization: choosing the right chart type for the data relationship being shown.

### By Data Relationship

| Relationship | Best charts | Avoid |
|---|---|---|
| **Comparison** (A vs B vs C) | Bar chart, grouped bar, dot plot | Pie chart (hard to compare segments) |
| **Composition** (parts of a whole) | Stacked bar, pie (≤5 segments), treemap | 3D pie (distorts perception) |
| **Distribution** (spread of values) | Histogram, box plot, violin plot | Bar chart (bins, not values) |
| **Trend over time** | Line chart, area chart | Bar chart (works but line is clearer for trends) |
| **Correlation** (two variables) | Scatter plot, bubble chart | Line chart (implies sequence, not correlation) |
| **Geospatial** | Choropleth map, point map | — |
| **Flow / process** | Sankey, funnel chart | — |
| **Ranking** | Sorted bar chart, slope chart | Pie chart, unsorted bars |

### The Pie Chart Problem

Pie charts require users to compare angles — a task humans are poor at. Use a bar chart instead when:
- More than 5 segments
- Values are close to each other (hard to distinguish slices)
- Exact values matter
- There's a "none of the above" catch-all segment

**When pie charts work:** 2–3 segments where one overwhelmingly dominates (e.g., "80% of revenue from top 3 customers").

---

## Visual Encoding Hierarchy

Cleveland & McGill's research on how accurately humans decode different visual encodings (most to least accurate):

1. **Position on a common scale** — most accurate (bar chart, dot plot)
2. **Position on identical but nonaligned scales**
3. **Length** (bar chart without baseline)
4. **Angle** (pie chart) — poor accuracy
5. **Area** (bubble chart, treemap) — poor accuracy
6. **Color saturation / hue** — weakest encoding

**Implication:** Use position (bar charts, line charts) for analytical tasks where accuracy matters. Use area and color for overview and pattern recognition.

---

## Axes and Scales

### Always Start Bar Charts at Zero

A bar chart's length encodes value. Cutting the axis makes small differences look enormous.

```
✗ Y-axis starts at 90:           ✓ Y-axis starts at 0:
  |                                 |
95|  ██                           100|
  |  ██  ██                         |   ██  ██
93|  ██  ██  ██                    50|   ██  ██  ██
  |  ██  ██  ██                     |   ██  ██  ██
90+──────────────                   0+──────────────
    A   B   C                           A   B   C
  Looks like A >> C               A is ~5% more than C
```

**Exception:** Line charts can start above zero when the range of change is the story (e.g., temperature variation, stock trends). Always label the axis clearly.

### Log Scale

Use when data spans multiple orders of magnitude. Label clearly — most users won't know it's log scale.

### Dual Axes

Two Y-axes on one chart creates the impression of correlation and allows misleading comparisons by adjusting scale. **Avoid dual Y-axis charts.** Use small multiples (two separate charts) instead.

---

## Color in Data Visualization

### Categorical Color (Distinct Groups)

Use visually distinct colors to differentiate groups that have no inherent order.

**Rules:**
- Maximum 7–8 colors before discrimination becomes unreliable
- Use pre-built categorical palettes (ColorBrewer, D3 schemeCategory10, Tableau)
- Colors should differ in hue, not just saturation or lightness
- Always test in grayscale (for printing and color blindness)

**Color blindness:** ~8% of men have red-green color blindness. Never encode information in red vs. green alone.

```
✓ Use: blue, orange, purple, teal, brown
✗ Avoid: red + green as primary differentiators
```

### Sequential Color (Ordered / Continuous Data)

For values along a spectrum (e.g., density, intensity, percentage).

**Rules:**
- Single hue (light to dark) or multi-hue (light yellow → dark blue)
- Higher value = darker color (universal convention)
- Perceptually uniform — equal visual steps for equal data steps

**Good palettes:** ColorBrewer Blues/Reds/Greens, Viridis, Plasma (perceptually uniform).

**Bad:** Rainbow (jet) colormap — creates false visual boundaries, not perceptually uniform, misleads pattern recognition.

### Diverging Color (Values Relative to a Midpoint)

For data that goes positive and negative from a meaningful center (e.g., profit/loss, above/below average, sentiment score).

**Format:** Two contrasting hues meeting at a neutral center.
**Example:** Red ← neutral gray → Blue for loss/profit.

**Rule:** The neutral midpoint should be visually neutral (gray or near-white), not a third contrasting hue.

---

## Dashboard Design

### Information Density

Dashboards must balance density (show enough to be useful) vs. cognitive load (don't overwhelm).

**Density guidelines by audience:**
| Audience | Density | Pattern |
|---|---|---|
| Executive / C-level | Low — 3–5 KPIs | One big number per card |
| Operations / daily users | Medium — 8–12 metrics | Grid of charts |
| Analysts | High — 15+ metrics | Dense tables + small multiples |

**The F-pattern applies to dashboards:** Most important metric top-left. Eye tracks left-to-right, then down. Put your most-actioned chart where the eye lands first.

### KPI Cards

The building block of most dashboards.

```
┌───────────────────────┐
│  Revenue this month   │  ← Label (what this measures)
│                       │
│  $1,284,000          │  ← Primary value (large, readable)
│                       │
│  ▲ 12% vs last month  │  ← Comparison (with direction indicator)
└───────────────────────┘
```

**Rules:**
- Label above the number (not below — users scan top to bottom)
- Comparison is required — a number without context is meaningless
- Use color for direction: green/up = positive, red/down = negative (but don't rely on color alone — use ▲/▼ symbols)
- Negative change in a cost metric can be positive — be careful with color logic

### Chart Grid Layout

- Group related charts spatially (charts that answer the same question together)
- Most important chart gets the most space
- Use consistent visual weight — don't mix sparklines and full charts on the same level
- Time period filter applies to all charts simultaneously (single date range selector, not per-chart)

---

## Interaction Patterns

### Tooltips on Hover

Required for all charts — especially bar charts, line charts, and scatter plots where individual data point values aren't labeled.

**Tooltip content:**
- The data point's exact value(s)
- The label/dimension (date, category name)
- If multiple series: show all series values at that point (crosshair tooltip)

**Formatting:**
- Consistent number formatting (same decimal places as axis labels)
- Currency symbols where relevant
- Date format matching user locale

### Filtering and Drill-Down

**Cross-filtering:** Clicking a segment in one chart filters all other charts on the dashboard. Powerful but requires clear visual feedback on what's filtered.

**Drill-down:** Clicking a high-level category expands to show its breakdown. Always provide a "Back" or breadcrumb to return to the overview level.

**Filter state visibility:** Applied filters must always be visible and removable.
```
Filters: [Region: West ×] [Date: Last 30 days ×] [Clear all]
```

### Zoom and Pan

For time series charts with dense data:
- Default view shows the summary period (30 days, 12 months)
- Allow zoom into specific periods via brush selection or presets (7d / 30d / 90d / 1y / Custom)
- Show the zoomed range visually (mini overview chart with selection handle)

---

## Data Loading States

### Skeleton for Charts

Chart skeletons should match the shape of the chart:
- Bar chart skeleton: gray bars of varying heights
- Line chart skeleton: gray wavy line
- KPI card skeleton: gray blocks in the layout of label + number + comparison

### Error and Empty States in Charts

```
Data loading error:
┌────────────────────────────────┐
│  ⚠ Could not load Revenue      │
│  data. Last updated 3 hrs ago. │
│  [Retry]                       │
└────────────────────────────────┘

No data in date range:
┌────────────────────────────────┐
│  No activity in this period    │
│  Try extending the date range  │
│  [Last 90 days] [Last year]    │
└────────────────────────────────┘
```

Never show an empty chart with no explanation — users don't know if it's a loading error or genuinely empty.

---

## Tables in Dashboards

Tables are underrated. For data where exact values matter (not just patterns), a well-designed table beats a chart.

### When to Use a Table vs. Chart

| Use table when | Use chart when |
|---|---|
| Exact values matter (financial data) | Pattern / trend is the insight |
| Many dimensions to compare | Few dimensions |
| Users need to export or copy | Users need quick overview |
| Data is sparse or irregular | Data is continuous or dense |

### Table Design Rules

- Numerical columns: right-aligned (decimal points align)
- Text columns: left-aligned
- Sticky header on scroll (never let the header scroll away)
- Alternating row shading or sufficient row spacing (not both)
- Sortable columns: indicate sort direction with ▲/▼
- Default sort: most relevant (not alphabetical, not insertion order)
- Inline sparklines: add a mini trend chart in a column for temporal context

---

## Accessibility in Data Visualization

### Beyond Color

Every chart must convey information without relying on color alone:
- Bar charts: labels on bars or clear axis labels
- Line charts: labels at end of lines, different line patterns (solid/dashed/dotted)
- Pie charts: labels directly on slices + legend
- Heatmaps: include numeric values in cells

### Screen Reader Access

Charts are images to screen readers without additional markup. Provide:
- A text summary of the chart's key insight: `aria-label="Bar chart showing monthly revenue. September was highest at $1.2M"`
- A data table alternative (hidden visually, accessible to screen readers)
- Interactive charts: keyboard navigation through data points with announced values

### Text Size

Chart labels, axis tick labels, legends: minimum 12px. 14px preferred. Don't sacrifice readability for density.

---

## Data Visualization Anti-Patterns

| Pattern | Problem | Fix |
|---|---|---|
| 3D charts | Distorts perception, adds nothing | Remove all 3D |
| Truncated Y-axis on bar chart | Exaggerates differences | Start at zero |
| Dual Y-axis | Implies false correlation | Two separate charts |
| Too many colors | Color discrimination fails at 8+ | Aggregate small categories into "Other" |
| Rainbow colormap | Not perceptually uniform, creates false boundaries | Use Viridis or ColorBrewer |
| Pie chart with 8+ slices | Angles unreadable | Bar chart, sorted by value |
| Chart without a title | User doesn't know what they're looking at | Always label what a chart shows |
| Unlabeled Y-axis | Units unknown (is this thousands? millions?) | Label units clearly |
| Auto-updating without user action | Page refreshes confuse users mid-read | Show "Updated X seconds ago" + manual refresh |
| Stacked bar for comparison | Hard to compare non-baseline segments | Grouped bar or small multiples |
