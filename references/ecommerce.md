# E-commerce & Consumer Apps Reference

Product pages, shopping apps, wellness/lifestyle, fintech cards, premium consumer experiences.

## 1. Starter Prompts

**Premium / Fintech**
- "A premium black credit card product showcase: card front (number, holder name, expiry, VISA logo), dark background, metal texture, minimal layout."
- "A private banking app home screen: net worth summary, portfolio allocation donut, recent transactions, investment performance sparkline."
- "A luxury watch product page: hero photography, technical specifications table, heritage story section, reserve CTA."

**Wellness / Lifestyle**
- "A Chinese wellness e-commerce app: crystal bracelet product page, today's energy configuration (今日能量配置), element classification (金属/木/水/火/土), ¥802.00 pricing, 加入购物车 / 立即购买 buttons."
- "A supplement/nutrition product page: ingredient breakdown with dosage, efficacy claims with study citations, before/after testimonials, subscription vs. one-time pricing."
- "A yoga/meditation app home: today's practice recommendation, streak counter, energy/mood tracker, session history."

**Fashion / Streetwear**
- "A sneaker product page: 3D rotation placeholder, colorway selector (6 options), size chart, hype/stock indicator, add-to-cart with size selection."
- "A streetwear brand homepage: OAKLEY-style — bold gradient logo treatment, campaign photography, drop calendar, newsletter signup."
- "A luxury fashion e-commerce: editorial-style product photography, material details, size & fit guide, complementary items."

**Food & Beverage**
- "A specialty coffee subscription page: origin story, tasting notes wheel, roast level selector, grind preference, subscription frequency picker."
- "A restaurant reservation app: weekly availability calendar, party size selector, special occasion note, dietary preferences."

---

## 2. Color Palettes

### Premium Black (luxury/fintech)
```
--bg:        #000000
--surface:   #0A0A0A
--card:      #141414
--border:    #2A2A2A
--text:      #FFFFFF
--muted:     #888888
--accent:    #C9A96E   /* gold */
--visa:      #1A1F71
```

### Wellness Sage (health/lifestyle)
```
--bg:        #F0F4F0
--surface:   #FFFFFF
--card:      #FFFFFF
--border:    #D4DDD4
--text:      #1A2A1A
--muted:     #6A7A6A
--accent:    #4A7A4A   /* forest green */
--accent-2:  #C8A882   /* warm tan */
```

### Chinese Warm (East Asian consumer)
```
--bg:        #FBF7F0
--surface:   #FFFFFF
--card:      #FFFFFF
--border:    #EDE0D0
--text:      #2C1810
--muted:     #8C7060
--accent:    #C8472A   /* Chinese red */
--accent-2:  #D4A843   /* gold */
--element-metal: #C0C0C0
--element-wood:  #4A7A4A
--element-water: #4A6FA5
--element-fire:  #C8472A
--element-earth: #D4A843
```

### Streetwear Bold (fashion/youth)
```
--bg:        #FFFFFF
--surface:   #F5F5F5
--card:      #FFFFFF
--border:    #E0E0E0
--text:      #000000
--muted:     #666666
--accent:    #FF3A00   /* red-orange */
--accent-2:  #00D4FF   /* electric blue */
```

### Minimal Luxury (fashion/premium)
```
--bg:        #FAF9F7
--surface:   #FFFFFF
--card:      #FFFFFF
--border:    #E8E4DE
--text:      #1A1714
--muted:     #9A9490
--accent:    #2C2C2C
--accent-2:  #C4A882
```

---

## 3. Typography Pairings

| Display | Body | Character |
|---|---|---|
| `Cormorant Garamond` | `Lato` | Luxury, fashion |
| `Didact Gothic` | `Nunito` | Clean consumer |
| `Noto Serif SC` | `Noto Sans SC` | Chinese/CJK products |
| `Tenor Sans` | `Source Sans 3` | Premium minimalist |
| `Oswald` | `Open Sans` | Streetwear, bold |
| `Bodoni Moda` | `Jost` | High fashion |

---

## 4. Layout Patterns

### Pattern A: Product Hero (standard e-commerce)
```
┌──────────────────────┬───────────────────┐
│                      │  Product Name     │
│   [Product Image]    │  Subtitle         │
│   (large, centered)  │  ─────────────    │
│                      │  ¥802.00          │
│                      │  ─────────────    │
│                      │  Variant select   │
│                      │  Size / Color     │
│                      │  ─────────────    │
│                      │  [Add to Cart]    │
│                      │  [Buy Now]        │
└──────────────────────┴───────────────────┘
│  Product details / Description / Reviews  │
```

### Pattern B: Premium Card Showcase
```
┌──────────────────────────────────────────┐
│  [FULL DARK BACKGROUND]                  │
│                                          │
│      ┌─────────────────────────────┐     │
│      │  4921  8834  9012  6558     │     │
│      │                             │     │
│      │  ALEXANDER PIERCE  09/28   │     │
│      │                    VISA    │     │
│      └─────────────────────────────┘     │
│                                          │
│  Card Name  ·  Benefits  ·  Apply Now    │
└──────────────────────────────────────────┘
```

### Pattern C: Wellness App (Chinese-style)
```
┌──────────────────────────────────────────┐
│  AI能量推荐    本月节气: [节气名]          │
├──────────────────────────────────────────┤
│  [Product image — bracelet/crystal]       │
│  今日能量配置                             │
│  适合: 清肝 / 镇静 / 防水逆 / 提升气场   │
├──────────┬───────────────────────────────┤
│  全部     │ 金属性  木属性  水属性  火属性 │
├──────────┴───────────────────────────────┤
│  [Crystal grid — 4 per row]               │
│  白水晶  薰衣草  青金石  紫水晶           │
├──────────────────────────────────────────┤
│  [加入购物车]    [立即购买]               │
└──────────────────────────────────────────┘
```

### Cart & Checkout

A multi-step checkout flow with a persistent order summary panel. The progress indicator keeps users oriented, while the side-by-side layout lets them review their order without leaving the form.

```
┌─────────────────────────────────────────────┐
│  ← Back    Checkout (2/3)    [====--] 66%   │
├───────────────────┬─────────────────────────┤
│                   │  Order Summary          │
│  Shipping Info    │  ─────────────────────  │
│  ─────────────    │  Product A    $120.00   │
│  Name             │  Product B     $48.00   │
│  [____________]   │  ─────────────────────  │
│                   │  Subtotal     $168.00   │
│  Address          │  Shipping       $0.00   │
│  [____________]   │  Tax           $13.44   │
│                   │  ─────────────────────  │
│  City / ZIP       │  Total        $181.44   │
│  [______][_____]  │                         │
│                   │  [  Place Order  →  ]   │
└───────────────────┴─────────────────────────┘
```

---

## 5. Signature Details

- **Price display**: large primary price, strikethrough original, savings badge
- **Stock urgency**: "Only 3 left" / "23 people viewing" in small muted text
- **Rating stars** with review count: ★★★★☆ (4.2) · 847 reviews
- **Element/attribute tags**: color-coded pill tags (Chinese wellness: 金/木/水/火/土)
- **Card number formatting**: spaced groups with monospace font
- **Add to cart animation**: button state change on click
- **Free shipping threshold**: progress bar "Add ¥xx more for free shipping"
- **Product story section**: brand heritage, craftsmanship details below fold

---

## 6. Real Variant Community Examples

**Chinese Crystal App**:
- Warm cream background `#FBF7F0`
- Pearl bracelet product photography
- "AI能量推荐" badge, seasonal node indicator
- Energy configuration: 适合清肝·镇静·防水逆·提升气场
- Element tabs: 全部 / 金属性 / 木属性 / 水属性 / 火属性 / 土属性
- Crystal grid: 白水晶 / 薰衣草 / 青金石 / 紫水晶
- ¥802.00 price, dual CTA buttons

**Black VISA Credit Card**:
- Pure black background
- Card centered with subtle perspective tilt
- Embossed card number: 4921 8834 9012 6558
- Cardholder: ALEXANDER PIERCE
- Expiry: 09/28, VISA logo
- Zero decoration — card as the only design element
