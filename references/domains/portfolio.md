# Portfolio & Personal Site Reference

Designer portfolios, developer showcases, freelancer sites, personal brands, agency work.

> **Design system references for this domain:**
> - `references/design-system/typography.md` — expressive type scales, display font as identity, whitespace rhythm
> - `references/design-system/color-and-contrast.md` — restrained palettes as personal brand signal
> - `references/design-system/spatial-design.md` — masonry grids, asymmetric composition, full-bleed imagery
> - `references/design-system/motion-design.md` — page transitions, scroll-triggered reveals, cursor effects
> - `references/design-system/responsive-design.md` — art direction with `<picture>`, portfolio grid breakpoints

## Table of Contents
1. Starter Prompts
2. Color Palettes
3. Typography Pairings
4. Layout Patterns
5. Signature Details

---

## 1. Starter Prompts

**Designer Portfolio**
- "A graphic designer portfolio homepage: oversized project title 'KINETIC IDENTITY SYSTEMS' spanning full viewport, project thumbnail grid below with hover reveals showing role + year, dark background with one accent color, cursor changes to custom pointer on project hover."
- "A brand designer's case study page: hero image at 80vh with project title overlaid in large serif, 'Client / Year / Role' metadata bar, then alternating full-bleed images and 2-column text+image sections, white background with black type."
- "A motion designer portfolio: auto-playing video thumbnails in a masonry grid, each project card shows title on hover with a slow pan effect, minimal navigation — just a wordmark and 'About / Work / Contact'."

**Developer Showcase**
- "A fullstack developer portfolio: terminal-inspired hero — blinking cursor after 'Hi, I'm [Name]. I build things for the web.' Dark bg with green accent, below: project cards as code-block-styled tiles showing tech stack tags, GitHub stars, and a live demo link."
- "A creative developer portfolio: WebGL/3D hero section with interactive particles, project list as a horizontal scroll gallery, each project shows a browser mockup with the live site, minimal sans-serif text."
- "A developer portfolio with a blog: clean 2-column layout — left sidebar with avatar, name, bio, social links; right area with tabbed sections (Projects / Writing / Talks), each project card with a screenshot, description, and tech stack pills."

**Freelancer / Agency**
- "A freelance photographer portfolio: full-screen image slideshow with dissolve transitions, project filter by category (Portrait / Landscape / Commercial), minimal chrome — just navigation arrows and a dot indicator."
- "A design studio landing page: 'We make brands people love' in 120px serif, scrolling client logo ticker, then 6 featured projects in a 2×3 grid with hover color overlay and project name reveal."
- "A UX consultant personal site: 'I help startups find product-market fit through design' — single statement hero, testimonial carousel from 3 past clients, case study previews as numbered cards (01, 02, 03), warm neutral palette."

**Creative / Artistic**
- "An illustrator portfolio: Pinterest-style masonry grid of artwork, clicking opens a lightbox with title, medium, and year. Background is warm off-white, minimal UI — just a wordmark top-left and an 'About' link top-right."
- "A 3D artist portfolio: dark background, project thumbnails rendered as floating cards with subtle parallax on mouse move, each card glows softly on hover, project details slide in from the right."
- "A calligrapher portfolio: vertical scroll through work samples, each piece is full-viewport width with generous whitespace above and below, hand-lettered section headers, ink-black on warm cream."

---

## 2. Color Palettes

### Portfolio Ink *(designer / typographer)*
```
--bg:        #F8F6F1
--surface:   #FFFFFF
--card:      #FFFFFF
--border:    #E8E4DB
--text:      #1A1915
--muted:     #8A857A
--accent:    #2C2C2C   /* near-black as accent */
--hover:     #E8E4DB
```

### Dev Terminal *(developer showcase)*
```
--bg:        #0C0C0C
--surface:   #151515
--card:      #1C1C1C
--border:    #2A2A2A
--text:      #D4D4D4
--muted:     #6A6A6A
--accent:    #4ADE80   /* green */
--accent-2:  #FBBF24   /* amber */
--link:      #60A5FA
```

### Studio Warm *(agency / freelancer)*
```
--bg:        #FAF8F5
--surface:   #FFFFFF
--card:      #FFFFFF
--border:    #EDE8E0
--text:      #2A2520
--muted:     #9A918A
--accent:    #D4622A   /* burnt orange */
--accent-2:  #1A1815
```

### Gallery White *(photographer / artist)*
```
--bg:        #FFFFFF
--surface:   #FAFAFA
--card:      #F5F5F5
--border:    #EBEBEB
--text:      #111111
--muted:     #999999
--accent:    #111111
--overlay:   rgba(0,0,0,0.6)
```

### Creative Night *(3D / motion / creative dev)*
```
--bg:        #08080C
--surface:   #101018
--card:      #181825
--border:    #252538
--text:      #EEEEF5
--muted:     #6A6A80
--accent:    #8B5CF6   /* violet */
--accent-2:  #EC4899   /* pink */
--glow:      rgba(139,92,246,0.15)
```

---

## 3. Typography Pairings

| Display | Body | Character |
|---|---|---|
| `Clash Display` | `Satoshi` | Bold studio energy, modern portfolio |
| `Playfair Display` | `DM Sans` | Editorial elegance, designer portfolio |
| `Space Mono` | `Geist` | Developer identity, code-first |
| `Syne` | `Instrument Sans` | Creative, art-forward |
| `Cabinet Grotesk` | `General Sans` | Agency clean, professional |
| `Fraunces` | `Work Sans` | Warm freelancer, approachable |
| `Unbounded` | `Outfit` | Experimental, 3D/motion artist |

**Rule:** Your display font IS your brand. Pick one that nobody else in your field uses, then use it everywhere — nav, headings, project titles. Consistency = recognition.

---

## 4. Layout Patterns

### Pattern A: Full-Screen Hero + Grid
```
┌────────────────────────────────────────┐
│                                        │
│  [NAME]              [WORK] [ABOUT]    │
│                                        │
│                                        │
│     HEADLINE IN MASSIVE                │
│     DISPLAY TYPE                       │
│                                        │
│     Brief tagline / role               │
│                                        │
│              ↓ scroll                  │
├────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────────┐  │
│  │  Project 1  │  │   Project 2     │  │
│  │  (tall)     │  │                 │  │
│  │             │  ├─────────────────┤  │
│  ├─────────────┤  │   Project 3     │  │
│  │  Project 4  │  │   (tall)        │  │
│  └─────────────┘  └─────────────────┘  │
└────────────────────────────────────────┘
```

### Pattern B: Horizontal Scroll Gallery
```
┌────────────────────────────────────────┐
│  [NAME]     01/06                NEXT →│
├────────────────────────────────────────┤
│                                        │
│  ┌──────────┐ ┌──────────┐ ┌────────  │
│  │          │ │          │ │          │
│  │ Project  │ │ Project  │ │ Projec  │
│  │ Image    │ │ Image    │ │ Image   │
│  │          │ │          │ │          │
│  └──────────┘ └──────────┘ └────────  │
│   Title         Title         Titl    │
│   Role · Year   Role · Year          │
│                                        │
└────────────────────────────────────────┘
```

### Pattern C: Masonry / Pinterest Grid
```
┌────────────────────────────────────────┐
│  [NAME]               FILTER ▼  ABOUT  │
├──────────┬──────────┬──────────────────┤
│  ┌────┐  │ ┌──────┐ │  ┌────────────┐ │
│  │    │  │ │      │ │  │            │ │
│  │    │  │ │      │ │  │            │ │
│  │    │  │ │      │ │  └────────────┘ │
│  └────┘  │ │      │ │  ┌────┐        │
│  ┌──────┐│ └──────┘ │  │    │        │
│  │      ││ ┌────┐   │  │    │        │
│  │      ││ │    │   │  │    │        │
│  │      ││ │    │   │  │    │        │
│  └──────┘│ └────┘   │  └────┘        │
└──────────┴──────────┴──────────────────┘
```

### Pattern D: Case Study Long-Scroll
```
┌────────────────────────────────────────┐
│  ← Back to Work        [NAME]         │
├────────────────────────────────────────┤
│                                        │
│  [FULL BLEED PROJECT IMAGE]            │
│                                        │
├────────────────────────────────────────┤
│  PROJECT TITLE          Client: ___    │
│  in large display       Year: ____     │
│                         Role: ____     │
├──────────────────┬─────────────────────┤
│  Overview text   │  Key result #1      │
│  paragraph       │  Key result #2      │
│                  │  Key result #3      │
├──────────────────┴─────────────────────┤
│  [FULL WIDTH IMAGE / MOCKUP]           │
├────────────────────────────────────────┤
│  Process section with                  │
│  alternating image + text blocks       │
└────────────────────────────────────────┘
```

---

## 5. Signature Details

- **Custom cursor** — circle that scales up on hoverable elements, changes color on project thumbnails
- **Project number** — large muted "01" "02" "03" behind or beside project titles
- **Hover reveals** — project thumbnails show title, role, and year only on hover (clean default state)
- **Page transitions** — smooth cross-fade or slide when navigating between pages/projects
- **Scroll-triggered text** — headline words animate in one by one as user scrolls into view
- **Monospaced metadata** — client name, year, role in small monospace beneath project titles
- **Sticky navigation** — minimal nav that compresses on scroll (logo shrinks, bg gets subtle blur)
- **Color shift per project** — accent color changes to match each project's brand palette
- **Infinite marquee** — skills or client names scrolling horizontally in a ticker
