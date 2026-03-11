# Dashboard & Analytics Reference

Data dashboards, monitoring panels, analytics views, KPI trackers, financial terminals.

## Table of Contents
1. Starter Prompts
2. Color Palettes
3. Typography Pairings
4. Layout Patterns
5. Signature Details
6. Real Community Examples

---

## 1. Starter Prompts

Pick one as the content foundation, adapt to user's domain:

**Financial / Trading**
- "A real-time trading terminal showing portfolio positions, risk indicators (RISK: LOW/STABLE/HIGH), daily P&L, and an integrity score. Dark dense grid."
- "A crypto portfolio dashboard with asset allocation donut, 7-day sparklines per coin, and a transaction log."
- "A hedge fund risk monitor: VaR metrics, stress test results, position concentration heat map."

**Analytics / Business**
- "A SaaS product analytics dashboard: DAU/MAU trend, funnel drop-off, feature adoption by cohort, north star metric front-and-center."
- "An e-commerce operations panel: GMV by channel, cart abandonment rate, inventory alerts, and a live order map."
- "A content performance dashboard: top articles by traffic, avg. time on page, scroll depth heatmap summary, SEO score per piece."

**Infrastructure / DevOps**
- "A cloud infrastructure monitor: cluster health indicators (Fluid Instance / Synthetic Ri / Geo-Cluster), latency p50/p95/p99, error rate sparklines, deployment history timeline."
- "A Kubernetes pod status dashboard: node utilization rings, pod health matrix, alert log, resource quota gauges."

**Political / Research**
- "An election analytics panel: candidate probability curves, swing state breakdown table, demographic cross-tabs, live polling delta tracker."
- "A research integrity dashboard: data source credibility scores, citation network graph, anomaly flags, overall integrity score badge."

**Science / Environment**
- "An atmospheric monitoring station: CO2/NO2/PM2.5 live readings, 30-day trend charts, air quality index by city, anomaly detection alerts."

---

## 2. Color Palettes

### Dark Pro (financial/infrastructure)
```
--bg:        #0A0E1A
--surface:   #131929
--card:      #1A2235
--border:    #2A3550
--text:      #E8EDF5
--muted:     #6B7A9A
--accent:    #00D4AA   /* teal green */
--danger:    #FF4757
--warning:   #FFB900
--positive:  #00C896
```

### Terminal Green (DevOps/monitoring)
```
--bg:        #0D1117
--surface:   #161B22
--card:      #21262D
--border:    #30363D
--text:      #C9D1D9
--muted:     #8B949E
--accent:    #39D353   /* GitHub green */
--link:      #58A6FF
--danger:    #F85149
```

### Amber Finance (trading terminal)
```
--bg:        #0F0F0F
--surface:   #1A1A1A
--card:      #242424
--border:    #333333
--text:      #F5F5F5
--muted:     #888888
--accent:    #F59E0B   /* amber/gold */
--up:        #22C55E
--down:      #EF4444
```

### Data Light (business analytics)
```
--bg:        #F8FAFC
--surface:   #FFFFFF
--card:      #FFFFFF
--border:    #E2E8F0
--text:      #0F172A
--muted:     #64748B
--accent:    #6366F1   /* indigo */
--positive:  #059669
--negative:  #DC2626
```

### Election Green (political analysis)
```
--bg:        #16A34A
--surface:   #15803D
--card:      #FAFAF9
--border:    #D1FAE5
--text-dark: #1C1C1C
--text-light: #FAFAF9
--accent:    #FDE047   /* yellow */
--chart:     #1C1C1C
```

---

## 3. Typography Pairings

| Display (headings/metrics) | Body (labels/descriptions) | Character |
|---|---|---|
| `IBM Plex Mono` | `IBM Plex Sans` | Technical, trustworthy |
| `Space Mono` | `DM Sans` | Retro-tech, readable |
| `JetBrains Mono` | `Geist` | Developer-grade |
| `Bebas Neue` | `IBM Plex Sans` | Bold metrics, clean labels |
| `Rajdhani` | `Source Sans 3` | Dashboard-native feel |
| `Orbitron` | `Exo 2` | Sci-fi / futuristic data |

**Rule:** Large metric numbers (KPIs) always in monospace. Labels and descriptions in proportional.

---

## 4. Layout Patterns

### Pattern A: KPI Header + Chart Body + Table Footer
```
┌─────────────────────────────────────┐
│  [KPI]  [KPI]  [KPI]  [KPI]        │  ← metric cards row
├──────────────────┬──────────────────┤
│                  │  Sidebar         │
│  Main Chart      │  - Mini chart    │
│  (area/line)     │  - Status list   │
│                  │  - Alerts        │
├──────────────────┴──────────────────┤
│  Data Grid / Log Table              │  ← scrollable table
└─────────────────────────────────────┘
```

### Pattern B: Left Nav + Full Canvas
```
┌──────┬──────────────────────────────┐
│ Nav  │  Title + Filters             │
│      ├──────────────────────────────┤
│ Menu │  Big Chart (full width)      │
│      ├──────┬──────┬────────────────┤
│      │ KPI  │ KPI  │ Small Chart    │
└──────┴──────┴──────┴────────────────┘
```

### Pattern C: Card Masonry (analytics)
```
┌──────────┬──────────┬───────────────┐
│ Wide     │ Tall     │ Square        │
│ Chart    │ List     │ Donut         │
├──────────┤          ├───────────────┤
│ Sparkline│          │ Heatmap       │
└──────────┴──────────┴───────────────┘
```

### Pattern D: Split Terminal (trading)
```
┌─────────────────────┬───────────────┐
│ TICKER  VALUE ΔDAY  │  CHART        │
│ ─────── ─────────── │  (full-height)│
│ FOC     $14.2 +2.1% │               │
│ PGH     $8.7  -0.4% │               │
│ RISK    LOW  STABLE │               │
│ ─────────────────── │               │
│ Overall Integrity:  │               │
│ ████████░░ 89%      │               │
└─────────────────────┴───────────────┘
```

---

## 5. Signature Details

- **Integrity/health score** as a horizontal progress bar with % label
- **Status badges**: LOW · STABLE · HIGH in colored pills
- **Sparklines** inline in table rows (mini SVG paths)
- **Live indicator**: pulsing dot + "LIVE" text in accent color
- **Delta arrows**: ▲ +2.3% in green / ▼ -1.1% in red
- **Grid lines**: very subtle, 1px, 10% opacity — structure without noise
- **Monospace numbers**: all metrics in tabular-nums, fixed-width
- **Section separators**: thin horizontal rules + section label in ALL CAPS muted text

---

## 6. Real Variant Community Examples

**yuanqizhang139** (32 likes): Financial monitoring dashboard
- Dark #0A0E1A background, amber accent
- "DAILY MOST INTERESTING" header with date
- Table: ticker | FOC/PGH/RISK values | LOW/STABLE/HIGH badges
- System Event Log section at bottom
- Overall Integrity: 89% progress bar
- Right column: line chart full-height

**Political analysis card** (Featured):
- Green #16A34A background
- Large serif statement: "The incumbent's probability of winning has stabilized at 58%"
- Sub-label: "ELECTION RISK / Forecast Score / Current Timeline"
- Clean trend line chart below
- Right panel: detailed breakdown table
