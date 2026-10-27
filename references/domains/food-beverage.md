# Food & Beverage Reference

Restaurant sites, recipe apps, coffee brands, meal delivery, food blogs, cocktail menus, bakery storefronts.

> **Design system references for this domain:**
> - `references/design-system/typography.md` — warm serif pairings, menu hierarchy, recipe step formatting
> - `references/design-system/color-and-contrast.md` — appetite-friendly palettes, warm tones, food photography contrast
> - `references/design-system/spatial-design.md` — menu card grids, recipe step spacing, image-heavy layouts
> - `references/design-system/responsive-design.md` — mobile menu ordering, responsive food photography
> - `references/design-system/ux-writing.md` — menu descriptions, allergen callouts, ordering microcopy

## Table of Contents
1. Starter Prompts
2. Color Palettes
3. Typography Pairings
4. Layout Patterns
5. Signature Details

---

## 1. Starter Prompts

**Restaurant & Café**
- "A farm-to-table restaurant homepage: hero image of seasonal dish at 80vh, restaurant name 'TERROIR' in 96px warm serif centered, 'SEASONAL AMERICAN · EST. 2019 · BROOKLYN' below in small caps, then a 3-section scroll — Menu Highlights / Our Story / Reservations. Warm cream background, dark green accent."
- "A specialty coffee shop website: 'ORIGIN MATTERS' headline over a slow-panning coffee bean close-up, below: three featured single-origin beans as cards with country flag, tasting notes, and roast level indicator. Earthy palette — deep brown, warm cream, terracotta accent."
- "A Japanese izakaya menu page: vertical scroll of menu sections (Appetizers / Sashimi / Grilled / Rice / Drinks), each dish with Japanese name in larger text + English translation below + price right-aligned. Dark background with warm wood texture borders, red accent for specials."

**Recipe & Food Blog**
- "A recipe app detail page: hero food photo at 50vh, recipe title 'MISO-GLAZED SALMON WITH PICKLED RADISH' in bold serif, metadata bar (Prep 15min · Cook 25min · Serves 4 · Difficulty: Easy), ingredient list with checkboxes on left, numbered steps with inline photos on right."
- "A food blog homepage: 'SALT & TIME' masthead in display serif, featured recipe at full width, then a 3-column grid of recent recipes. Each card: overhead food photo, recipe title, cooking time badge, category tag. Warm white background, handwritten-style category labels."
- "A meal planning app: weekly calendar view with draggable recipe cards, each showing a small food thumbnail + recipe name + calorie count. Sidebar: shopping list auto-generated from selected recipes. Clean, light UI with green accent for vegetarian tags."

**Beverage & Bar**
- "A craft cocktail bar menu: dark background #1A1510, cocktails organized by spirit base (Gin / Whiskey / Rum / Vodka / Non-Alcoholic). Each drink: name in display type, ingredients list in italic, price. Decorative gold line dividers between sections. Featured cocktail of the month in a highlighted card."
- "A natural wine shop e-commerce page: wine bottles displayed in a 3-column grid, each with label close-up, wine name, region, grape variety, and tasting notes preview. Filter sidebar: Type (Red / White / Orange / Rosé), Region, Price. Warm off-white background, burgundy accent."
- "A tea brand product page: single tea product hero — package photo left, product name 'JADE MOUNTAIN OOLONG' right with origin, elevation, harvest date, tasting notes (Floral · Creamy · Light Roast), brewing instructions as icon steps (temp / amount / time / steeps)."

**Bakery & Patisserie**
- "A French bakery storefront site: 'MAISON BLANC' in elegant serif on a pale pink background, hero image of croissants in morning light, daily specials section with 4 items (photo + name + price), hours and location at bottom with a small embedded map."
- "A custom cake ordering page: gallery of past creations in masonry grid, order form with flavor picker, size selector (6-inch / 8-inch / 10-inch / Tiered), date picker, and special instructions textarea. Pastel palette with gold accent."

---

## 2. Color Palettes

### Terroir Warm *(farm-to-table / organic)*
```
--bg:        #FAF6F0
--surface:   #FFFFFF
--card:      #FFFFFF
--border:    #E8DFD2
--text:      #2A2218
--muted:     #8A7E6E
--accent:    #3D5A3A   /* forest green */
--accent-2:  #C4742A   /* terracotta */
```

### Espresso Dark *(coffee shop / roastery)*
```
--bg:        #1A1510
--surface:   #241E18
--card:      #2E2720
--border:    #3D352C
--text:      #EDE6DC
--muted:     #8A7E6E
--accent:    #C4742A   /* copper */
--accent-2:  #D4A96A   /* gold */
```

### Patisserie Rose *(bakery / dessert)*
```
--bg:        #FDF5F3
--surface:   #FFFFFF
--card:      #FFFFFF
--border:    #F0D8D2
--text:      #3A2028
--muted:     #A08890
--accent:    #C0626A   /* rose */
--accent-2:  #D4A96A   /* gold foil */
```

### Bar Noir *(cocktail bar / speakeasy)*
```
--bg:        #0E0C0A
--surface:   #181410
--card:      #221E18
--border:    #332E26
--text:      #EDE6DC
--muted:     #7A7268
--accent:    #C9A96E   /* gold */
--accent-2:  #8B4A2E   /* bourbon */
```

### Fresh Market *(healthy / salad / juice)*
```
--bg:        #F5FAF0
--surface:   #FFFFFF
--card:      #FFFFFF
--border:    #D8E8D0
--text:      #1A2818
--muted:     #6A7A62
--accent:    #4A8A3A   /* leaf green */
--accent-2:  #E8A020   /* citrus */
--badge:     #FF6B35   /* spicy/hot tag */
```

### Ceramic White *(Japanese / minimal / tea)*
```
--bg:        #F8F5F0
--surface:   #FEFCF8
--card:      #FFFFFF
--border:    #E5DFD5
--text:      #2A2520
--muted:     #9A928A
--accent:    #6A7A5A   /* matcha */
--accent-2:  #C84A32   /* vermillion */
```

---

## 3. Typography Pairings

| Display | Body | Character |
|---|---|---|
| `Cormorant Garamond` | `Lora` | Classic French restaurant, elegant |
| `Playfair Display` | `Source Serif 4` | Food editorial, cookbook feel |
| `DM Serif Display` | `DM Sans` | Modern café, friendly warmth |
| `Fraunces` | `Instrument Sans` | Craft coffee, artisanal feel |
| `Bodoni Moda` | `Work Sans` | High-end bar, luxury menu |
| `Newsreader` | `Newsreader` (italic) | Recipe blog, editorial food writing |
| `Crimson Pro` | `Plus Jakarta Sans` | Healthy food, approachable modern |

**Rule:** Food design is about appetite. Serifs feel warm, crafted, editorial — they make food feel intentional. Reserve geometric sans-serifs for health/tech food brands. Let the photography do the heavy visual lifting; type should frame it, not compete.

---

## 4. Layout Patterns

### Pattern A: Restaurant Homepage
```
┌────────────────────────────────────────┐
│  [LOGO]              MENU  RESERVE  ☰  │
├────────────────────────────────────────┤
│                                        │
│  [HERO IMAGE — seasonal dish, 80vh]    │
│                                        │
│         RESTAURANT NAME                │
│    cuisine · est. year · location      │
│                                        │
├────────────────────────────────────────┤
│  MENU HIGHLIGHTS                       │
│  ┌──────┐  ┌──────┐  ┌──────┐        │
│  │ dish │  │ dish │  │ dish │        │
│  │ photo│  │ photo│  │ photo│        │
│  │ name │  │ name │  │ name │        │
│  │ $$$  │  │ $$$  │  │ $$$  │        │
│  └──────┘  └──────┘  └──────┘        │
├────────────────────────────────────────┤
│  OUR STORY    │    HOURS & LOCATION    │
│  paragraph    │    Mon-Fri 11am-10pm   │
│  + photo      │    [Map embed]         │
└───────────────┴────────────────────────┘
```

### Pattern B: Recipe Detail
```
┌────────────────────────────────────────┐
│  ← Back       SALT & TIME       🔖 ♡  │
├────────────────────────────────────────┤
│  [HERO FOOD PHOTO — overhead shot]     │
│                                        │
│  RECIPE TITLE IN LARGE SERIF           │
│  ⏱ 15min prep · 25min cook · 4 serves │
├──────────────────┬─────────────────────┤
│  INGREDIENTS     │  INSTRUCTIONS       │
│  ☐ 2 salmon     │  1. Preheat oven    │
│    fillets      │     to 400°F        │
│  ☐ 3 tbsp       │                     │
│    white miso   │  2. Mix miso,       │
│  ☐ 1 tbsp       │     mirin, and      │
│    mirin        │     sugar...        │
│  ☐ 1 tsp sugar  │                     │
│  ☐ 4 radishes   │  [Step photo]       │
│  ☐ rice vinegar │                     │
│                  │  3. Brush onto      │
│  NUTRITION       │     salmon...       │
│  Cal: 380        │                     │
│  Protein: 34g   │  4. Bake 12-15      │
│  Fat: 18g       │     minutes...      │
└──────────────────┴─────────────────────┘
```

### Pattern C: Menu Page (Scrolling Sections)
```
┌────────────────────────────────────────┐
│  [RESTAURANT]    APPETIZERS ←active    │
│                  MAINS                 │
│                  DESSERTS              │
│                  DRINKS                │
├────────────────────────────────────────┤
│  A P P E T I Z E R S                  │
│  ─────────────────────────────────────│
│  Burrata                       $18    │
│  heirloom tomato, basil oil,          │
│  grilled sourdough                    │
│                                        │
│  Tuna Tartare                  $22    │
│  avocado, sesame, crispy wonton,      │
│  ponzu                                │
│  ─────────────────────────────────────│
│  ★ CHEF'S SELECTION                   │
│  Seasonal Ceviche              $24    │
│  market fish, tiger's milk,           │
│  sweet potato, corn                   │
│  ─────────────────────────────────────│
└────────────────────────────────────────┘
```

### Pattern D: Food Product Grid
```
┌────────────────────────────────────────┐
│  [BRAND]   Shop  About  ☰    🛒 (3)   │
├──────┬─────────────────────────────────┤
│ TYPE │  ┌──────┐  ┌──────┐  ┌──────┐  │
│ ☐ Red│  │ img  │  │ img  │  │ img  │  │
│ ☐ Wht│  │      │  │      │  │      │  │
│ ☐ Ros│  │ Name │  │ Name │  │ Name │  │
│      │  │ Desc │  │ Desc │  │ Desc │  │
│REGION│  │ $$$  │  │ $$$  │  │ $$$  │  │
│ ☐ FR │  └──────┘  └──────┘  └──────┘  │
│ ☐ IT │  ┌──────┐  ┌──────┐  ┌──────┐  │
│ ☐ ES │  │ img  │  │ img  │  │ img  │  │
│      │  │      │  │      │  │      │  │
│PRICE │  │ Name │  │ Name │  │ Name │  │
│ ○-○  │  │ Desc │  │ Desc │  │ Desc │  │
│$─────$│ │ $$$  │  │ $$$  │  │ $$$  │  │
└──────┴──└──────┘──└──────┘──└──────┘──┘
```

---

## 5. Signature Details

- **Ingredient tags as pills** — allergen warnings (🌾 Gluten / 🥜 Nuts / 🥛 Dairy) in muted colored pills
- **Price right-aligned with dot leader** — `Dish Name ........... $24` classic menu formatting
- **Chef's pick / seasonal badge** — small star or leaf icon with "Chef's Selection" or "Seasonal" label
- **Overhead food photography** — flat-lay shots with ingredients scattered around the dish for context
- **Handwritten-style accents** — category labels or special notes in a script/handwriting typeface
- **Warm gradient overlays on hero** — subtle warm tone over food photography to unify lighting
- **Tasting notes as flavor wheel** — visual radar chart for coffee/wine/tea flavor profiles
- **Cooking timer UI element** — step-by-step with time indicators and checkable steps
- **Spice level indicator** — 🌶️ icons (1-3) or a small heat meter next to spicy dishes
- **"Pairs with" suggestion** — wine or drink pairing note in italics below select dishes
