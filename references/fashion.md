# Fashion & Lifestyle Reference

Fashion brands, lookbooks, lifestyle magazines, streetwear drops, luxury retail, beauty brands, interior design.

> **Design system references for this domain:**
> - `design-system/typography.md` — high-contrast serif/sans pairs, condensed headlines, editorial scales
> - `design-system/color-and-contrast.md` — luxury neutrals, seasonal palettes, fashion photography contrast
> - `design-system/spatial-design.md` — asymmetric grids, full-bleed imagery, editorial whitespace
> - `design-system/motion-design.md` — parallax, smooth scroll reveals, lookbook transitions
> - `design-system/responsive-design.md` — mobile-first shopping, image art direction by viewport

## Table of Contents
1. Starter Prompts
2. Color Palettes
3. Typography Pairings
4. Layout Patterns
5. Signature Details

---

## 1. Starter Prompts

**Luxury & High Fashion**
- "A luxury fashion brand homepage: full-screen video hero of a runway walk, the brand name in 14px spaced caps centered, minimal nav — 'Collections / Boutiques / Monde'. Below the fold: two asymmetric editorial images from the latest collection with season label 'AUTUMN/WINTER 2026'. Palette: ivory, black, one gold accent."
- "A designer collection lookbook: sequential full-bleed images with model name and look number ('Look 14 · ARIA') in small text bottom-right, gentle parallax scroll between looks, no navigation visible — just the scroll experience. Black background between images."
- "A fashion editorial spread: 'THE NEW MINIMALISM' in 120px condensed sans, two-column text wrapping around a central fashion photograph, pull quote in large italic: 'Less is not nothing — it is everything that remains after you remove what doesn't matter.' Cream on black."

**Streetwear & Contemporary**
- "A streetwear brand drop page: the drop number and title in bold condensed caps, countdown timer to release (00:14:32:07), product grid showing hoodie, tee, cap, and cargo pants with hover-to-rotate effect. Black and white with one electric accent color. 'NOTIFY ME' button if sold out."
- "A sneaker product page: hero image of shoe at 45° angle on solid color background matching the shoe, shoe name 'AIR STRATUM' in large condensed type, colorway selector as circles, size grid, 'ADD TO BAG' button. Below: material breakdown, sustainability info, styling suggestions grid."
- "A vintage clothing marketplace: Pinterest-style masonry grid of garment photos with era tags (70s / 80s / Y2K), price overlay bottom-left, seller rating stars. Filter bar: Era, Size, Category, Price range. Warm off-white background with retro typography."

**Beauty & Cosmetics**
- "A luxury skincare brand product page: clean white background, product bottle centered at 50% viewport height, product name 'HYDRA LUMINANCE SERUM' in spaced caps, ingredient highlights as minimal icons (Hyaluronic Acid · Vitamin C · Niacinamide), 'SHOP NOW — $85' CTA. Below: before/after comparison slider, reviews with star ratings."
- "A makeup brand color collection: 'AUTUMN PALETTE' header, lipstick shades displayed as color circles in a row with shade names below, clicking a shade shows the lipstick product image and swatch on different skin tones. Rose gold accent throughout."
- "A perfume brand page: dark moody background, perfume bottle with dramatic lighting, fragrance name 'NOIR ABSOLU' in elegant serif, scent pyramid (Top: Bergamot · Saffron / Heart: Oud · Rose / Base: Amber · Musk) as a visual triangle diagram."

**Interior & Lifestyle**
- "A furniture brand homepage: 'DESIGNED FOR LIVING' in large serif over a lifestyle room photo, below: featured collection in a 2×2 grid (sofa, table, lamp, shelf) with clean product photography on white, price and material info. Warm palette — sand, sage, walnut tones."
- "A home decor e-commerce: curated room vignettes at top ('Living Room / Bedroom / Kitchen'), then 'Shop The Look' — each item from the vignette photo is tagged and purchasable. Scandinavian-inspired: white background, light wood tones, minimal UI."
- "An interior design portfolio: full-bleed room photography, project details as overlay — 'Tribeca Loft · 2,400 sq ft · Completed 2025'. Each project scrolls through 6-8 photographs with a fixed sidebar showing materials palette and color swatches."

---

## 2. Color Palettes

### Atelier Ivory *(luxury fashion / haute couture)*
```
--bg:        #F5F0EA
--surface:   #FEFCF8
--card:      #FFFFFF
--border:    #E0D8CC
--text:      #1A1714
--muted:     #8A8078
--accent:    #1A1714   /* black as accent */
--accent-2:  #C4A872   /* gold */
```

### Noir Editorial *(fashion editorial / lookbook)*
```
--bg:        #0A0A08
--surface:   #141412
--card:      #1E1E1A
--border:    #2A2A26
--text:      #F0EDE6
--muted:     #7A7770
--accent:    #F0EDE6   /* off-white as accent */
--accent-2:  #C9A96E   /* gold */
```

### Streetwear Concrete *(urban / contemporary)*
```
--bg:        #F0F0F0
--surface:   #FFFFFF
--card:      #FFFFFF
--border:    #D0D0D0
--text:      #111111
--muted:     #777777
--accent:    #FF2D20   /* electric red */
--accent-2:  #111111
--shadow:    2px 2px 0px #111111
```

### Blush Beauty *(cosmetics / skincare)*
```
--bg:        #FBF5F3
--surface:   #FFFFFF
--card:      #FFFFFF
--border:    #F0DDD8
--text:      #3A2A28
--muted:     #A08A85
--accent:    #C07060   /* dusty rose */
--accent-2:  #D4A87A   /* rose gold */
```

### Scandinavian Home *(furniture / interior)*
```
--bg:        #F8F6F2
--surface:   #FFFFFF
--card:      #FFFFFF
--border:    #E5E0D8
--text:      #2A2820
--muted:     #8A8578
--accent:    #5A7A5A   /* sage */
--accent-2:  #C4A882   /* walnut */
--warm:      #E8D8C8   /* sand */
```

### Y2K Revival *(retro / vintage / playful)*
```
--bg:        #F5F0FF
--surface:   #FFFFFF
--card:      #FFFFFF
--border:    #E0D5F0
--text:      #2A1A40
--muted:     #8A7AA0
--accent:    #C850C0   /* magenta-pink */
--accent-2:  #6366F1   /* periwinkle */
--accent-3:  #FF6B9D   /* bubblegum */
```

### Mediterranean Coast *(resort / vacation / lifestyle)*
```
--bg:        #F8FBFE
--surface:   #FFFFFF
--card:      #FFFFFF
--border:    #D0E4F0
--text:      #1A2A35
--muted:     #6A8A9A
--accent:    #1E6CA0   /* ocean blue */
--accent-2:  #E8A855   /* sun gold */
--warm:      #F0E0C8   /* sand */
```

---

## 3. Typography Pairings

| Display | Body | Character |
|---|---|---|
| `Bodoni Moda` | `DM Sans` | High fashion, luxury editorial |
| `Clash Display` | `General Sans` | Streetwear energy, bold drops |
| `Cormorant Garamond` | `Lora` | French elegance, timeless luxury |
| `Abril Fatface` | `Source Sans 3` | Statement beauty, cosmetics |
| `Instrument Serif` | `Instrument Sans` | Modern lifestyle, interior design |
| `Syne` | `Outfit` | Contemporary art-fashion crossover |
| `DM Serif Display` | `Plus Jakarta Sans` | Accessible luxury, modern warmth |

**Rule:** Fashion typography is about tension. The highest-performing fashion sites pair one extremely expressive display font with one extremely neutral body font. The contrast between the two creates the visual equivalent of a model in haute couture walking through a white room — the plainness amplifies the statement.

---

## 4. Layout Patterns

### Pattern A: Full-Screen Lookbook
```
┌────────────────────────────────────────┐
│  [BRAND]                     MENU ☰    │
├────────────────────────────────────────┤
│                                        │
│  [FULL BLEED HERO — video or image]    │
│                                        │
│                                        │
│                                        │
│         COLLECTION NAME                │
│         Season / Year                  │
│                                        │
│              ↓                         │
├────────────────────────────────────────┤
│  ┌──────────────────┐ ┌──────────────┐│
│  │                  │ │              ││
│  │  Editorial       │ │  Product     ││
│  │  Image           │ │  Image       ││
│  │  (tall)          │ │              ││
│  │                  │ ├──────────────┤│
│  │                  │ │  Product     ││
│  │                  │ │  Image       ││
│  └──────────────────┘ └──────────────┘│
└────────────────────────────────────────┘
```

### Pattern B: Product Detail Page
```
┌────────────────────────────────────────┐
│  [BRAND]   Women  Men  Sale    🛒 ♡    │
├──────────────────┬─────────────────────┤
│                  │  BRAND NAME         │
│  [Product        │  Product Title      │
│   Image          │  $XXX               │
│   Gallery]       │                     │
│                  │  Color: ○ ○ ● ○     │
│  ○ ○ ○ ○        │  Size:  [S][M][L]   │
│  (thumbnails)    │                     │
│                  │  [ADD TO BAG]       │
│                  │  [WISHLIST ♡]       │
│                  │                     │
│                  │  Details ▼          │
│                  │  Size Guide ▼       │
│                  │  Shipping ▼         │
├──────────────────┴─────────────────────┤
│  YOU MAY ALSO LIKE                     │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐     │
│  │     │ │     │ │     │ │     │     │
│  └─────┘ └─────┘ └─────┘ └─────┘     │
└────────────────────────────────────────┘
```

### Pattern C: Editorial Fashion Feature
```
┌────────────────────────────────────────┐
│  MAGAZINE NAME        Issue 47 · SS26  │
├────────────────────────────────────────┤
│                                        │
│     THE NEW                            │
│     MINIMALISM                         │
│     in 120px condensed                │
│                                        │
├───────────┬────────────────────────────┤
│           │                            │
│  Fashion  │  "Less is not nothing —    │
│  photo    │   it is everything that    │
│  (large)  │   remains after you        │
│           │   remove what doesn't      │
│           │   matter."                 │
│           │                            │
│           │  Body text in two          │
│           │  columns continues...      │
├───────────┴────────────────────────────┤
│  [FULL BLEED SECONDARY IMAGE]          │
└────────────────────────────────────────┘
```

### Pattern D: Drop / Release Page
```
┌────────────────────────────────────────┐
│  [BRAND]                    NOTIFY ME  │
├────────────────────────────────────────┤
│                                        │
│  DROP NUMBER                           │
│  DROP TITLE                            │
│                                        │
│  RELEASES IN  00 : 14 : 32 : 07       │
│               DAY  HR   MIN   SEC      │
│                                        │
├────────────────────────────────────────┤
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ │
│  │      │ │      │ │      │ │      │ │
│  │Hoodie│ │ Tee  │ │ Cap  │ │Cargo │ │
│  │      │ │      │ │      │ │      │ │
│  │ $180 │ │ $65  │ │ $45  │ │ $150 │ │
│  │[SHOP]│ │[SHOP]│ │[WAIT]│ │[SHOP]│ │
│  └──────┘ └──────┘ └──────┘ └──────┘ │
├────────────────────────────────────────┤
│  LOOKBOOK  → [Editorial images grid]   │
└────────────────────────────────────────┘
```

---

## 5. Signature Details

- **Season label** — "AW26" or "SPRING/SUMMER 2026" in small spaced caps, used consistently as a collection identifier
- **Look number** — "Look 01" "Look 14" in monospace or small caps next to editorial images
- **Hover zoom** — product images scale 1.05× on hover with subtle ease-out, revealing detail
- **Color swatches as circles** — small filled circles for color selection, active state has a ring
- **Size guide modal** — measurements table with body diagram, convert between CM/IN
- **"New" / "Sold Out" / "Last Few" badges** — pills on product thumbnails in brand accent color
- **Editorial pull quotes** — large italic text breaking the column grid in fashion editorial layouts
- **Infinite scroll product grid** — products load continuously, no pagination — mimics the endless browse of fashion
- **Video hero** — silent autoplay video of models/product in motion, sets mood before any text is read
- **Dot leader navigation** — collection sections connected by dots in a vertical timeline on scroll
- **Material texture close-ups** — small circular detail shots showing fabric weave, leather grain, stitching
