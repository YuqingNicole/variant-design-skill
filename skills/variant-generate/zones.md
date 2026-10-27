<!-- Part of the variant-generate route (../../SKILL.md → skills/variant-generate/SKILL.md). Read it when the user asks for a zone edit such as `B vary subtle — hero` or `zones A`. -->

# Zone edits

By default, variation actions replace the entire design. **Zone syntax** lets you target a specific section — everything outside the zone stays untouched.

### Zone Syntax

```
[variation] [action] — [zone]

Examples:
  A vary strong — hero
  B remix colors — card
  C shuffle layout — sidebar
  A vary subtle — nav
  B distill — footer
```

Zones are **semantic** — they refer to the role of the section, not a CSS class name. Recognized zone names:

| Zone | Matches |
|------|---------|
| `hero` | Top section, headline, CTA, background |
| `nav` / `header` | Navigation bar, logo, links |
| `card` | Any card component or card grid |
| `sidebar` | Side panel, filters, secondary nav |
| `footer` | Bottom section |
| `form` | Any form or input group |
| `chart` / `data` | Data visualization, metrics, stats |
| `cta` | Call-to-action button or section |
| `modal` | Overlay, dialog, drawer |
| `[custom]` | User can name any section: "pricing table", "testimonials", "team grid" |

### How to Apply Zone Variations

**Step 1: Identify the zone in the file**

Before making changes, read the current file and locate the zone by its semantic role — look for the `data-zone` attribute (if present), or identify it from the HTML structure.

**Step 2: Make sure the zone is marked**

When generating initial HTML/TSX, annotate major sections with `data-zone`:

```html
<section data-zone="hero"> ... </section>
<nav data-zone="nav"> ... </nav>
<section data-zone="cards"> ... </section>
<aside data-zone="sidebar"> ... </aside>
<section data-zone="cta"> ... </section>
<footer data-zone="footer"> ... </footer>
```

For TSX, use a `data-zone` prop on the top-level element of each section component.

For reliable local diffs, also bracket each editable zone with unique `<!-- zone:hero:start -->` / `<!-- zone:hero:end -->` markers (TSX: `{/* zone:hero:start */}` / `{/* zone:hero:end */}`). Mark the zone's styles in the same first generation: wrap its rules with `/* zone:hero:start */` / `/* zone:hero:end */` in the `<style>` block or the variant's own stylesheet. One file may contain one markup pair and one style pair for the same zone. During a zoned edit, an owned file without that zone's markers is read-only, so unmarked styles make `B vary subtle — hero` impossible without an extra revision.

If an existing artifact lacks markers, add them as a separate preparation revision (summary such as "mark hero zone, no visual change"), verify that rendering is unchanged, then apply the requested edit. Give the preparation revision and the edit the same `request` id in `change.json`, so `undo B` reverts both together, as the user expects.

**Step 3: Isolate and rewrite the zone**

Read the current file. Extract only the content inside the target `data-zone`. Apply the action (vary strong, remix colors, etc.) to that section alone. Rewrite only that section in the file — preserve everything else character-for-character.

**Step 4: Report**

```
✦ Variation A — Remix colors · hero zone only · iteration 3

  Changed: hero background oklch(15% 0.02 240) → oklch(20% 0.15 45) (warm amber)
  hero headline color, gradient, and CTA button updated to match
  Cards, nav, footer unchanged

  variant-output/variant-coffee-A.html ← updated & opened
```

### Zone Variation Rules

- **Preserve outside zones exactly.** Do not reflow, re-indent, or reformat code outside the target zone — even if it looks messy.
- **Tokens cascade.** If the zone uses CSS custom properties (`--color-accent`, `--bg`), update the token values in `:root` only if the zone exclusively uses them. If tokens are shared across zones, override inline within the zone instead.
- **Motion is zone-scoped.** Only change animation/transition properties within the target zone. Don't touch `@keyframes` or animation values used by other zones.
- **If zone not found:** Tell the user which zones are present (`data-zone` attributes found), and ask which one to target. Do not guess.

### Zone Quick Triggers

| User types | Action |
|---|---|
| `A vary strong — hero` | Vary strong applied to hero zone only |
| `B remix colors — card` | Remix colors applied to card zone only |
| `C shuffle layout — sidebar` | Shuffle layout applied to sidebar only |
| `A vary subtle — nav` | Refine nav zone only |
| `zones A` | List all `data-zone` sections found in Variation A |

Every zone edit is a history transaction: prepare a candidate, edit only inside the zone, then apply with the same `request` id as any preparation revision. Follow `references/workflow/history.md`.
