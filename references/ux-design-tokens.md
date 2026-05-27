# UX Design Tokens Reference

Token architecture, naming conventions, semantic layering, and multi-brand/multi-theme systems. Based on W3C Design Token spec, Figma tokens, and Theo/Style Dictionary conventions.

---

## What Design Tokens Are

Design tokens are named design decisions. A token gives a design value (color, size, duration) a name that carries meaning.

```
Without tokens:
  button background: #1D4ED8
  link color: #1D4ED8
  icon color on dark: #1D4ED8

With tokens:
  button background: {color.brand.primary}
  link color: {color.brand.primary}
  icon color on dark: {color.brand.primary}
  → Change one value, updates everywhere
```

**Tokens are not just variables.** CSS custom properties are variables. Tokens are named design decisions organized in a system with defined tiers, ownership, and semantic meaning.

---

## Token Tiers (Three-Layer Architecture)

The standard architecture has three tiers. Each tier references the tier above it.

### Tier 1: Primitive Tokens (Raw Values)

The complete set of raw values available in the system. No semantic meaning — just the full palette.

```json
{
  "color": {
    "blue": {
      "100": "#DBEAFE",
      "200": "#BFDBFE",
      "300": "#93C5FD",
      "400": "#60A5FA",
      "500": "#3B82F6",
      "600": "#2563EB",
      "700": "#1D4ED8",
      "800": "#1E40AF",
      "900": "#1E3A8A"
    },
    "gray": { ... },
    "red": { ... }
  },
  "space": {
    "1": "4px",
    "2": "8px",
    "3": "12px",
    "4": "16px",
    "6": "24px",
    "8": "32px",
    "12": "48px",
    "16": "64px"
  },
  "font-size": {
    "xs": "12px",
    "sm": "14px",
    "base": "16px",
    "lg": "18px",
    "xl": "20px",
    "2xl": "24px",
    "3xl": "30px",
    "4xl": "36px"
  }
}
```

**Rule:** Primitive tokens are never used directly in components. They are only referenced by semantic tokens.

### Tier 2: Semantic Tokens (Meaning Layer)

Tokens with names that describe their purpose. They reference primitive tokens. This layer is where theming happens.

```json
{
  "color": {
    "background": {
      "default": "{color.white}",
      "subtle": "{color.gray.50}",
      "inverse": "{color.gray.900}"
    },
    "text": {
      "default": "{color.gray.900}",
      "subtle": "{color.gray.500}",
      "disabled": "{color.gray.300}",
      "inverse": "{color.white}",
      "brand": "{color.blue.600}"
    },
    "border": {
      "default": "{color.gray.200}",
      "strong": "{color.gray.400}",
      "focus": "{color.blue.500}",
      "error": "{color.red.500}"
    },
    "status": {
      "success": "{color.green.500}",
      "warning": "{color.yellow.500}",
      "error": "{color.red.500}",
      "info": "{color.blue.500}"
    }
  }
}
```

For dark mode, semantic tokens change their references — primitives stay the same:
```json
{
  "dark": {
    "color": {
      "background": {
        "default": "{color.gray.900}",
        "subtle": "{color.gray.800}"
      },
      "text": {
        "default": "{color.gray.100}",
        "subtle": "{color.gray.400}"
      }
    }
  }
}
```

### Tier 3: Component Tokens (Component-Specific)

Tokens scoped to a specific component. Reference semantic tokens. Allow per-component overrides without breaking the system.

```json
{
  "button": {
    "primary": {
      "background": "{color.brand.primary}",
      "background-hover": "{color.brand.primary-hover}",
      "text": "{color.text.on-brand}",
      "border": "transparent",
      "border-radius": "{radius.md}",
      "padding-x": "{space.4}",
      "padding-y": "{space.2}",
      "font-weight": "{font-weight.semibold}"
    },
    "secondary": {
      "background": "transparent",
      "background-hover": "{color.background.subtle}",
      "text": "{color.text.brand}",
      "border": "{color.border.brand}"
    },
    "destructive": {
      "background": "{color.status.error}",
      "text": "{color.text.inverse}"
    }
  }
}
```

---

## Token Naming Conventions

### The Naming Formula

```
[category]-[property]-[variant]-[state]
```

| Part | Examples | Required |
|---|---|---|
| Category | `color`, `space`, `font-size`, `radius`, `shadow`, `duration` | Yes |
| Property | `background`, `text`, `border`, `fill`, `stroke` | For color tokens |
| Variant | `primary`, `secondary`, `destructive`, `brand`, `subtle` | When multiple variants exist |
| State | `default`, `hover`, `active`, `disabled`, `focus` | When state-specific |

**Examples:**
```
color-background-primary-default
color-text-subtle
color-border-focus
space-component-padding-md
font-size-heading-xl
radius-button-md
duration-animation-fast
```

### Naming Anti-Patterns

| Anti-pattern | Problem | Fix |
|---|---|---|
| `blue-500` as a semantic token | Name describes the value, not the use | `color-brand-primary` |
| `primary-color` | Too vague — primary what? | `color-background-brand` or `color-text-brand` |
| `button-blue` | Hardcodes the color in the name | `button-background-primary` |
| `spacing-10px` | Value in the name — breaks when value changes | `spacing-xs` or `space-1` |
| `$myBrandRed` | Camel case mixed with hyphens, no tier | Consistent casing, tiered naming |

### Casing Conventions

Pick one and be consistent across all tools:
- **kebab-case:** `color-brand-primary` — recommended for CSS custom properties
- **camelCase:** `colorBrandPrimary` — common in JavaScript / React Native
- **dot.notation:** `color.brand.primary` — common in Figma tokens and JSON

---

## Token Categories

### Color Tokens

The most important token category. Beyond background/text/border, include:

```
color-background-*      → Page, section, card backgrounds
color-surface-*         → Elevated surfaces (modals, dropdowns, tooltips)
color-text-*            → All text variants
color-border-*          → Borders, dividers, outlines
color-icon-*            → Icon fill colors
color-status-*          → Success, warning, error, info
color-brand-*           → Brand color and its interactive states
color-interactive-*     → Focus rings, selection highlights
```

### Spacing Tokens

Use a defined scale, not arbitrary values:

```
Base unit: 4px (most systems) or 8px

space-0:  0px
space-1:  4px
space-2:  8px
space-3:  12px
space-4:  16px
space-5:  20px
space-6:  24px
space-8:  32px
space-10: 40px
space-12: 48px
space-16: 64px
space-20: 80px
space-24: 96px
```

**Component spacing vs. layout spacing:** Some systems separate these into `component-space-*` (used inside components) and `layout-space-*` (used between components and sections).

### Typography Tokens

```
font-family-sans:      "Inter", system-ui, sans-serif
font-family-mono:      "JetBrains Mono", monospace
font-size-*:           (see primitives above)
font-weight-regular:   400
font-weight-medium:    500
font-weight-semibold:  600
font-weight-bold:      700
line-height-tight:     1.2
line-height-normal:    1.5
line-height-relaxed:   1.75
letter-spacing-tight:  -0.02em
letter-spacing-normal: 0
letter-spacing-wide:   0.05em
```

### Motion Tokens

```
duration-instant:    0ms       (for changes that should feel immediate)
duration-fast:       100ms     (micro-interactions: hover, focus)
duration-normal:     200ms     (most transitions)
duration-slow:       300ms     (modals, panels entering)
duration-slower:     500ms     (page transitions)

easing-default:      cubic-bezier(0.4, 0, 0.2, 1)   (Material standard)
easing-decelerate:   cubic-bezier(0, 0, 0.2, 1)      (elements entering)
easing-accelerate:   cubic-bezier(0.4, 0, 1, 1)      (elements leaving)
easing-spring:       cubic-bezier(0.175, 0.885, 0.32, 1.275)
```

### Border Radius Tokens

```
radius-none:   0px
radius-sm:     2px
radius-md:     4px
radius-lg:     8px
radius-xl:     12px
radius-2xl:    16px
radius-full:   9999px   (pill / fully rounded)
```

---

## Multi-Brand and Theming

### Brand Theming Architecture

When one codebase serves multiple brands, override at the semantic tier:

```
Brand A theme:               Brand B theme:
color.brand.primary          color.brand.primary
= {color.blue.600}           = {color.purple.600}

Components reference:        Components reference:
color.brand.primary          color.brand.primary (same token)
```

**Implementation:** Each brand provides a theme file that overrides semantic tokens. Components never change — only the theme file changes.

### Dark Mode

Dark mode overrides semantic tokens, not component tokens:

```css
/* Light (default) */
:root {
  --color-background-default: #FFFFFF;
  --color-text-default: #111827;
}

/* Dark mode override */
[data-theme="dark"],
@media (prefers-color-scheme: dark) {
  --color-background-default: #111827;
  --color-text-default: #F9FAFB;
}
```

**Don't invert primitives — override semantics.** Components using semantic tokens get dark mode for free.

---

## Tooling

### Style Dictionary (Theo / Amazon)

Converts a JSON token definition into any format: CSS custom properties, Sass variables, Swift constants, Kotlin, JavaScript objects.

```bash
npx style-dictionary build --config style-dictionary.config.json
```

Output for CSS:
```css
:root {
  --color-brand-primary: #2563EB;
  --color-text-default: #111827;
  --space-4: 16px;
}
```

Output for JavaScript:
```js
export const tokens = {
  color: { brand: { primary: '#2563EB' } },
  space: { 4: '16px' }
}
```

### Figma Tokens / Figma Variables

- **Figma Variables** (native, 2023+): Supports primitive and semantic tiers, modes (light/dark), and direct output to CSS
- **Tokens Studio plugin**: Full three-tier support, syncs with GitHub, supports Style Dictionary export

**Best practice:** Design tokens should be the single source of truth. Figma variables should be generated from or synced with the code token definitions — not maintained independently.

---

## Design Token Audit Checklist

When reviewing a design system's token implementation:

- [ ] Three tiers exist: primitive → semantic → component
- [ ] Components reference only semantic tokens (no primitive token references in components)
- [ ] Token names describe use, not value (no `blue-500` as semantic token)
- [ ] All interactive states tokenized (hover, focus, active, disabled)
- [ ] Dark mode overrides semantic tier (not component tier)
- [ ] Motion tokens used for all transitions (no hardcoded `200ms`)
- [ ] Spacing uses the token scale (no magic numbers like `17px` outside the scale)
- [ ] Tokens are documented with intended use, not just value
- [ ] Single source of truth: tokens defined once, exported to all platforms
