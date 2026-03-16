# Universal Color Palettes

A cross-domain palette library. Use when scenario is unclear or to supplement domain-specific references.
Each palette maps to one of the seven aesthetic directions in SKILL.md.

---

## Dark / Premium

Deep backgrounds, atmospheric depth, subtle glows. Default for trading terminals, AI tools, premium apps.

### Dark Pro *(Dashboard → financial/infrastructure)*
```
--bg:        #0A0E1A   /* oklch(8% 0.03 260) */
--surface:   #131929   /* oklch(13% 0.03 260) */
--card:      #1A2235   /* oklch(17% 0.03 255) */
--border:    #2A3550   /* oklch(26% 0.04 250) */
--text:      #E8EDF5   /* oklch(94% 0.01 260) */
--muted:     #6B7A9A   /* oklch(55% 0.05 255) */
--accent:    #00D4AA   /* oklch(76% 0.15 170) */
--danger:    #FF4757   /* oklch(62% 0.22 20) */
--warning:   #FFB900   /* oklch(82% 0.17 85) */
--positive:  #00C896   /* oklch(73% 0.14 168) */
```

> 💡 OKLCH values shown above. Convert other palettes using: `oklch(lightness% chroma hue)` — see `design-system/color-and-contrast.md` for OKLCH principles.

### Terminal Green *(DevOps / monitoring)*
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

### Deep Purple *(AI / ML products)*
```
--bg:        #09090B
--surface:   #18181B
--card:      #27272A
--border:    #3F3F46
--text:      #FAFAFA
--muted:     #A1A1AA
--accent:    #A855F7   /* purple */
--accent-2:  #EC4899   /* pink */
```

### Dark Lab *(generative / creative tools)*
```
--bg:        #0A0A0F
--surface:   #12121A
--card:      #1A1A28
--border:    #2A2A40
--text:      #E8E8FF
--muted:     #6060A0
--accent:    #6C63FF   /* violet */
--accent-2:  #00FFB2   /* neon mint */
--live:      #FF3A6E
```

### Night Sky *(astronomy / space apps)*
```
--bg:        #050A18
--surface:   #0D1525
--card:      #131E35
--border:    #1E2E4A
--text:      #E8F0FF
--muted:     #4A5A7A
--accent:    #4A9EFF   /* sky blue */
--accent-2:  #A78BFA   /* lavender */
--star:      #FFFFFF
```

### Luxury Black *(editorial / fashion)*
```
--bg:        #0A0A0A
--surface:   #141414
--card:      #1E1E1E
--border:    #2A2A2A
--text:      #F0EDE8
--muted:     #888888
--accent:    #C9A96E   /* warm gold */
--accent-2:  #8B7355
```

---

## Light / Clean

White and near-white backgrounds, structured hierarchy. Enterprise software, productivity tools.

### Minimal White *(SaaS / enterprise)*
```
--bg:        #FFFFFF   /* oklch(100% 0 0) */
--surface:   #F8FAFC   /* oklch(98% 0.005 250) */
--card:      #FFFFFF   /* oklch(100% 0 0) */
--border:    #E2E8F0   /* oklch(92% 0.01 250) */
--text:      #0F172A   /* oklch(15% 0.03 260) */
--muted:     #64748B   /* oklch(52% 0.03 250) */
--accent:    #0EA5E9   /* oklch(68% 0.16 230) */
--cta:       #0F172A   /* oklch(15% 0.03 260) */
```

> 💡 OKLCH values shown above. Convert other palettes using: `oklch(lightness% chroma hue)` — see `design-system/color-and-contrast.md` for OKLCH principles.

### Data Light *(analytics / business)*
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

### Study Light *(education / learning)*
```
--bg:        #F0F9FF
--card:      #FFFFFF
--border:    #BAE6FD
--text:      #0C4A6E
--muted:     #64748B
--accent:    #0EA5E9   /* sky */
--correct:   #16A34A
--wrong:     #DC2626
```

### Wellness Soft *(health / lifestyle apps)*
```
--bg:        #F8F5F2
--surface:   #FFFFFF
--card:      #FFFFFF
--border:    #E8E0D8
--text:      #2D2840
--muted:     #9B8FA8
--accent:    #7C6BC4   /* soft purple */
--positive:  #4CAF7D
```

---

## Warm / Human

Earthy tones, organic warmth. Consumer apps, food, wellness, East Asian markets.

### Warm Startup *(consumer SaaS / productivity)*
```
--bg:        #FAFAF9   /* oklch(98% 0.003 80) */
--surface:   #F5F5F4   /* oklch(97% 0.003 80) */
--card:      #FFFFFF   /* oklch(100% 0 0) */
--border:    #E7E5E4   /* oklch(92% 0.005 60) */
--text:      #1C1917   /* oklch(15% 0.01 60) */
--muted:     #78716C   /* oklch(52% 0.01 60) */
--accent:    #EA580C   /* oklch(60% 0.2 40) */
--cta:       #EA580C   /* oklch(60% 0.2 40) */
```

> 💡 OKLCH values shown above. Convert other palettes using: `oklch(lightness% chroma hue)` — see `design-system/color-and-contrast.md` for OKLCH principles.

### Academic Cream *(long-form / culture)*
```
--bg:        #FEFCE8
--surface:   #FFFBEB
--card:      #FFFFFF
--border:    #E7E5E4
--text:      #1C1917
--muted:     #78716C
--accent:    #92400E   /* amber brown */
--link:      #1D4ED8
```

### Wellness Sage *(health / nature e-commerce)*
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

### Chinese Warm *(East Asian consumer)*
```
--bg:        #FBF7F0
--surface:   #FFFFFF
--card:      #FFFFFF
--border:    #EDE0D0
--text:      #2C1810
--muted:     #8C7060
--accent:    #C8472A   /* Chinese red */
--accent-2:  #D4A843   /* gold */
```

### Minimal Luxury *(fashion / premium retail)*
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

## Bold / Expressive

High contrast, vivid accents, dominant color blocks. Consumer products, youth brands.

### Structural Black *(engineering / infra)*
```
--bg:        #111111   /* oklch(12% 0 0) */
--surface:   #1A1A1A   /* oklch(15% 0 0) */
--card:      #222222   /* oklch(19% 0 0) */
--border:    #333333   /* oklch(27% 0 0) */
--text:      #FFFFFF   /* oklch(100% 0 0) */
--muted:     #888888   /* oklch(62% 0 0) */
--accent:    #FF6B35   /* oklch(66% 0.2 35) */
--accent-2:  #FFFFFF   /* oklch(100% 0 0) */
```

> 💡 OKLCH values shown above. Convert other palettes using: `oklch(lightness% chroma hue)` — see `design-system/color-and-contrast.md` for OKLCH principles.

### Streetwear Bold *(fashion / youth)*
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

### Election Green *(political / civic)*
```
--bg:        #16A34A
--surface:   #15803D
--card:      #FAFAF9
--border:    #D1FAE5
--text-dark: #1C1C1C
--text-light:#FAFAF9
--accent:    #FDE047   /* yellow */
```

### Amber Finance *(trading / crypto)*
```
--bg:        #0F0F0F
--surface:   #1A1A1A
--card:      #242424
--border:    #333333
--text:      #F5F5F5
--muted:     #888888
--accent:    #F59E0B   /* amber */
--up:        #22C55E
--down:      #EF4444
```

---

## Neo-Brutalist

Raw, unconventional, broken grid. Portfolios, startups that want to stand out.

### Brutalist Mono
```
--bg:        #F5F5F0   /* oklch(97% 0.005 95) */
--surface:   #FFFFFF   /* oklch(100% 0 0) */
--card:      #FFFFFF   /* oklch(100% 0 0) */
--border:    #000000   /* oklch(0% 0 0) */
--text:      #000000   /* oklch(0% 0 0) */
--muted:     #555555   /* oklch(42% 0 0) */
--accent:    #FFD700   /* oklch(87% 0.17 95) */
--accent-2:  #FF0050   /* oklch(58% 0.26 15) */
--shadow:    4px 4px 0px #000000
```

> 💡 OKLCH values shown above. Convert other palettes using: `oklch(lightness% chroma hue)` — see `design-system/color-and-contrast.md` for OKLCH principles.

### Brutalist Dark
```
--bg:        #111111
--surface:   #1C1C1C
--card:      #222222
--border:    #FFFFFF   /* white outlines */
--text:      #FFFFFF
--muted:     #888888
--accent:    #00FF00   /* terminal green */
--accent-2:  #FF00FF   /* magenta */
--shadow:    4px 4px 0px #FFFFFF
```

### Synth Neon *(music / creative tools)*
```
--bg:        #0D0D0D
--surface:   #1A1A1A
--card:      #1A1A1A
--border:    #333333
--text:      #FFFFFF
--muted:     #666666
--accent:    #FF2D78   /* hot pink */
--accent-2:  #00E5FF   /* electric cyan */
--accent-3:  #7FFF00   /* chartreuse */
```

---

## Data / Technical

Dense, systematic. Monospace fonts, tight grids, information-first.

### Dark Indigo *(modern SaaS / data products)*
```
--bg:        #0F172A   /* oklch(15% 0.04 260) */
--surface:   #1E293B   /* oklch(22% 0.04 255) */
--card:      #1E293B   /* oklch(22% 0.04 255) */
--border:    #334155   /* oklch(32% 0.04 250) */
--text:      #F1F5F9   /* oklch(97% 0.005 250) */
--muted:     #94A3B8   /* oklch(70% 0.025 250) */
--accent:    #6366F1   /* oklch(55% 0.22 275) */
--accent-2:  #38BDF8   /* oklch(76% 0.13 230) */
--cta:       #6366F1   /* oklch(55% 0.22 275) */
```

> 💡 OKLCH values shown above. Convert other palettes using: `oklch(lightness% chroma hue)` — see `design-system/color-and-contrast.md` for OKLCH principles.

### Deep Ocean *(science / research)*
```
--bg:        #0C1B33
--surface:   #132642
--card:      #1A3354
--border:    #1E3A5F
--text:      #E8F4FD
--muted:     #5A7A9A
--accent:    #00B4D8   /* cyan */
--accent-2:  #90E0EF
```

### Mars Red *(editorial science)*
```
--bg:        #7B1E1E
--surface:   #9B2C2C
--card:      #FDF5E6
--border:    #C4461A
--text-dark: #1A0A00
--text-light:#FDF5E6
--accent:    #E55A00   /* burnt orange */
```

---

## Luxury / Silence

Maximum negative space, one hero image, sparse text. High-end real estate, watches, perfume.

### Premium Black *(luxury / fintech)*
```
--bg:        #000000   /* oklch(0% 0 0) */
--surface:   #0A0A0A   /* oklch(6% 0 0) */
--card:      #141414   /* oklch(12% 0 0) */
--border:    #2A2A2A   /* oklch(22% 0 0) */
--text:      #FFFFFF   /* oklch(100% 0 0) */
--muted:     #888888   /* oklch(62% 0 0) */
--accent:    #C9A96E   /* oklch(74% 0.1 80) */
```

> 💡 OKLCH values shown above. Convert other palettes using: `oklch(lightness% chroma hue)` — see `design-system/color-and-contrast.md` for OKLCH principles.

### Ivory Silence *(luxury goods / cosmetics)*
```
--bg:        #F7F5F0
--surface:   #FAFAF8
--card:      #FFFFFF
--border:    #E5E0D8
--text:      #1A1714
--muted:     #A09A94
--accent:    #2C2620   /* near black */
--accent-2:  #C8B8A0   /* sand */
```

### French Gray *(architecture / interior)*
```
--bg:        #EFEFEC
--surface:   #F8F8F6
--card:      #FFFFFF
--border:    #DCDCD8
--text:      #1A1A18
--muted:     #888884
--accent:    #3A3A36
--accent-2:  #A8A89E
```

---

## Pinterest-Popular / Trending

Aesthetic palettes frequently seen on Pinterest mood boards, design inspiration pins, and trending visual styles.

### Scandinavian Hygge *(Nordic / minimalist home)*
```
--bg:        #F7F4EF
--surface:   #FEFCF8
--card:      #FFFFFF
--border:    #E5DFD5
--text:      #2C2822
--muted:     #9A9488
--accent:    #8A7A60   /* warm wood */
--accent-2:  #3A3630   /* charcoal */
--warm:      #E8DCC8   /* linen */
```

### Wabi-Sabi *(Japanese / imperfection aesthetic)*
```
--bg:        #EDE8E0
--surface:   #F5F0E8
--card:      #FAF6F0
--border:    #D8D0C4
--text:      #2E2A24
--muted:     #8A8478
--accent:    #7A6A52   /* clay */
--accent-2:  #B8A890   /* stone */
--ink:       #3A3430   /* sumi ink */
```

### Cottagecore *(pastoral / botanical)*
```
--bg:        #FAF8F2
--surface:   #FFFFFF
--card:      #FFFFFF
--border:    #E0DCC8
--text:      #2A3020
--muted:     #7A8068
--accent:    #5A7A48   /* meadow green */
--accent-2:  #C87A5A   /* terracotta pot */
--bloom:     #D4848A   /* dried rose */
```

### Y2K Nostalgia *(retro-futurism / early 2000s)*
```
--bg:        #F0ECFA
--surface:   #FAFAFF
--card:      #FFFFFF
--border:    #DDD5F0
--text:      #1A1030
--muted:     #8878A8
--accent:    #C050C0   /* hot pink-purple */
--accent-2:  #50B0FF   /* baby blue */
--chrome:    #D0D0E0   /* silver */
```

### Coastal Mediterranean *(seaside / resort)*
```
--bg:        #F5F9FC
--surface:   #FFFFFF
--card:      #FFFFFF
--border:    #C8DDE8
--text:      #1A2E3A
--muted:     #5A7A8A
--accent:    #1E6CA0   /* deep sea */
--accent-2:  #E8A855   /* sun gold */
--sand:      #F0E0C8
```

### Kinfolk Neutral *(editorial / lifestyle)*
```
--bg:        #F0ECE4
--surface:   #F8F4EE
--card:      #FEFCF8
--border:    #DDD6CA
--text:      #262220
--muted:     #8A847A
--accent:    #3A3632   /* near-black */
--accent-2:  #A09484   /* taupe */
```

### Art Deco Revival *(1920s / gatsby / luxury)*
```
--bg:        #0E0E14
--surface:   #16161E
--card:      #1E1E28
--border:    #2E2E3A
--text:      #F0EDDE
--muted:     #6A687A
--accent:    #C9A44A   /* gold */
--accent-2:  #1A5A5A   /* emerald teal */
--line:      #C9A44A   /* geometric line details */
```

### Earthy Ceramic *(pottery / craft / handmade)*
```
--bg:        #F5EEE6
--surface:   #FAF6F0
--card:      #FFFFFF
--border:    #E0D4C4
--text:      #2E241C
--muted:     #8A7A68
--accent:    #B85C38   /* terracotta */
--accent-2:  #6A8A5A   /* glaze green */
--clay:      #D4B8A0
```

### Moody Botanical *(dark floral / plant aesthetic)*
```
--bg:        #0C1410
--surface:   #141E18
--card:      #1A2820
--border:    #283830
--text:      #E4EDE6
--muted:     #5A7A60
--accent:    #8AB880   /* sage */
--accent-2:  #D4848A   /* dusty pink */
--gold:      #C4A86A
```

### Soft Gradient *(glassmorphism-adjacent / aurora)*
```
--bg:        #F0F0FA
--surface:   #FFFFFF
--card:      rgba(255,255,255,0.7)
--border:    rgba(200,200,230,0.3)
--text:      #1A1A30
--muted:     #7A7A98
--accent:    #7C5CFC   /* purple */
--accent-2:  #F472B6   /* pink */
--accent-3:  #38BDF8   /* sky */
```

### Japandi *(Japanese + Scandinavian fusion)*
```
--bg:        #F2EDE5
--surface:   #F8F4EE
--card:      #FEFCF8
--border:    #DDD4C6
--text:      #2A2620
--muted:     #8A847A
--accent:    #4A5A40   /* moss */
--accent-2:  #1A1815   /* ink */
--paper:     #F0E8DA   /* washi */
```

### Lavender Dream *(gentle / feminine / wellness)*
```
--bg:        #F5F0FA
--surface:   #FEFCFF
--card:      #FFFFFF
--border:    #E0D8F0
--text:      #2A1E40
--muted:     #8A7EA8
--accent:    #8B6CC4   /* lavender */
--accent-2:  #E8B0C0   /* blush */
--soft:      #C8B8E0
```

---

## Picking a Palette

| Scenario | Recommended |
|---|---|
| Financial / trading | Dark Pro, Amber Finance |
| SaaS / startup | Dark Indigo, Minimal White, Warm Startup |
| AI / ML product | Deep Purple, Dark Lab |
| E-commerce (premium) | Premium Black, Ivory Silence |
| E-commerce (consumer) | Wellness Sage, Streetwear Bold, Chinese Warm |
| Editorial / journalism | Mars Red, Academic Cream, Luxury Black |
| Dashboard / analytics | Data Light, Terminal Green, Deep Ocean |
| Mobile app | Night Sky, Wellness Soft |
| Creative / music tool | Dark Lab, Synth Neon |
| Education | Study Light, French Green, Duolingo Green (see education.md) |
| Portfolio / personal | Brutalist Mono, Brutalist Dark, Portfolio Ink (see portfolio.md) |
| Luxury / fashion | Ivory Silence, French Gray, Minimal Luxury, Atelier Ivory, Noir Editorial (see fashion.md) |
| Food / restaurant | Terroir Warm, Espresso Dark, Patisserie Rose, Bar Noir (see food-beverage.md) |
| Streetwear / contemporary | Streetwear Bold, Streetwear Concrete (see fashion.md), Y2K Revival |
| Beauty / cosmetics | Blush Beauty, Lavender Dream (see fashion.md) |
| Interior / home | Scandinavian Hygge, Japandi, French Gray, Scandinavian Home (see fashion.md) |
| Pinterest aesthetic | Wabi-Sabi, Cottagecore, Kinfolk Neutral, Moody Botanical, Coastal Mediterranean |
