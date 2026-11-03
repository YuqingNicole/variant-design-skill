# Designing a system, not filling a template

A design system made by filling every slot of a token template looks like every other generated system: a 50–900 ramp per color, nine type sizes, three shadows, a z-index ladder, a page of swatches. That is an inventory. A system is a small set of decisions about this product, and tokens that carry them out. Read this before writing `design-system.css`, whether from a brief (`ds`) or from a picked direction (`pick B`).

## 1. Decide first

Write three to five decisions for this product before any token. Each names what it rules out, so a builder can apply it to a screen the system never showed. They go at the top of `design-system.css` and in the Overview of `variant-output/DESIGN.md`.

| Weak (fits any product) | Decision (fits this one) |
|---|---|
| Clean and modern | A permissions page changes who can see what: color marks risk, not decoration. The accent appears only on the one action per view that grants access; danger only where access is removed. |
| Consistent spacing | People are scanned in rows, not admired in cards. Members are list rows; a card only groups something the user compares side by side. |
| Clear hierarchy | Size and weight carry the hierarchy. No eyebrow labels, no decorative numbers: a heading says what the section is. |
| Friendly | Copy and empty states are friendly; color stays quiet. One neutral family, one accent, one danger. |

A decision that would fit any product is not one. When the brief or picked direction gives no basis for a decision, ask in the report rather than invent one.

## 2. Audit the source before codifying it

A picked direction mixes its point with the generator's habits. Codify the point; do not turn habits into tokens. For each item below that the source uses, either drop it (list it under normalizations as `dropped:`) or keep it as an explicit decision with a reason that is about this product. "The user picked it" covers the direction's point, not each habit in it: the reason must say what the trait does for this product's task. "Continuity with B" or "keeps the mood" is not such a reason.

- Uppercase letter-spaced eyebrow labels above headings.
- A slogan or marketing hero on a tool page ("Good work starts with your people").
- Oversized numbers as decoration (`04 members`), round fake metrics.
- Every block in a bordered, rounded, shadowed card; cards inside cards.
- A default calm palette chosen for mood rather than meaning: cream or beige paper with sage, terracotta or forest green; purple-blue gradients; glass.
- Pill-shaped buttons and inputs everywhere.
- `system-ui`, Inter, Roboto or Arial as the only face (see `references/workflow/quality-baseline.md` → Typography).
- A full shadow set when the product uses borders, or the reverse.

The audit applies to taste, not to the user's constraints: a locked brand file, a font or color the user asked for stays.

## 3. Size the system to the product

Every token must be explainable by where it is used: in the source, in a component state the product needs, or in a decision. Write no others.

- **Color.** Neutrals: the steps the product uses (page, surface, line, muted text, text, and a control border if inputs need contrast). Accent: base, hover, pressed, and a subtle fill if selection needs one. Status colors only for statuses the product has, and never identical to the accent. No computed 50–900 ramps; a ramp is justified only when the product shows a sequential scale (a heatmap, a chart).
- **Type.** Name sizes by role (`--text-page-title`, `--text-section`, `--text-body`, `--text-meta`), each pointing at a step of one ratio. A product page usually needs five or six; a 10px step needs a reason. At most two families and the weights actually used.
- **Space.** One grid (4px or 8px) and the steps the layouts use, plus named layout values the decisions rely on (row height, content width).
- **Shape, elevation, motion.** One radius per kind of thing (control, container, avatar), not a size ladder. Shadows only for things that float above the page (menu, dialog, toast). Durations and easing for the transitions the product has, each named for what it does. A z-index token only for each layer that exists.

Fewer tokens that are all used beat a complete set. `ds-check.mjs --used-by` reports tokens nothing uses.

## 4. Layer it

Mature systems separate raw values, meanings and component decisions by naming and reference rules, not by file format (Primer, Material, Carbon, Atlassian). Keep one `design-system.css` with a commented section per layer, in this order, and write a layer only when the product needs it.

| Layer | Naming | May reference | Used by | Write it when |
|---|---|---|---|---|
| Decisions | numbered, in the top comment | — | people and agents | always, three to five |
| Primitives | `--p-<hue>-<step>` (`--p-clay-600`) | raw values | semantic and component tokens only | a value is shared by several semantic tokens, or the product shows a sequential scale. Otherwise semantic tokens hold raw values |
| Semantic | `--color-<role>[-<state>]` with `--color-on-<role>` for content on that role; `--text-<role>`, `--space-<n>`, `--radius-<kind>`, `--shadow-<what>`, `--duration-<what>` | primitives or raw values | product code and components | always |
| Component | `--<component>-<variant>-<property>[-<state>]` (`--button-primary-bg-hover`) | semantic tokens only | that component's own CSS | a component the product reuses that has three or more states (button, input, select). Not for something B shows once |
| Patterns | named in `variant-output/DESIGN.md` → Components → Patterns | semantic and component tokens, components | people and agents | for each recurring situation the product has (remove-access confirmation, first-use empty state, inline error): when to use it, its structure, its copy rules, its tokens. Patterns are guidance, never tokens |

- **Pairs are named, not guessed.** Every color that carries content on a surface or fill is `--color-on-<role>` for `--color-<role>` (`--color-on-accent` on `--color-accent`), or a text token used on the page surfaces. `ds-check.mjs` pairs `on-X` with `X`.
- **Every semantic token says where it is used**, in a trailing comment: `--color-danger: #9b3024; /* use: remove-access button, removal error text */`. Name places in the product, not the layer. `ds-export.mjs` carries the note into the DTCG `$description`, and the Colors and Typography rules in `variant-output/DESIGN.md` are written from these notes.
- **Product code never references primitives** or another component's tokens. Variants, pages and components use semantic tokens; a component's CSS also uses its own component tokens.
- **Under a brand-file lock**, these rules apply to the extension only: its component tokens refer to the brand's variables.

A small product page usually ends with the decisions, about thirty semantic tokens, component tokens for two or three components, three or four patterns, and no primitives.

## 5. Show it in use

The preview proves the decisions on the product's own content, not on swatches.

- Lead with two or three compositions built only from the system's tokens and components, using real content from the project: for a members page, a member list with a role change in progress, the remove-access confirmation, an empty or error state. Under each, one line naming the decision it shows.
- Then a compact reference: tokens grouped by role, with value and where each is used. "Where" names places in the product (`member name`, `remove-access dialog`), not the layer (`shared color foundation`); a token with no place to name should not exist. Swatches are small chips in that table.
- Components in the states the product uses (default, hover, focus, disabled, loading, error, success where they apply), shown where they occur (the invite button while sending, the role select with an error) rather than as a row of isolated pills.
- The preview obeys the decisions it shows: if members are rows, not cards, the preview does not put every block in a bordered card.
- One situation per composition: an empty state, an inline error and a sending state are three moments, not one panel.
- Do not make the page a catalog: no full-width swatch grids, no "Aa — sample text" ladder for every size, no spacing bar chart.

## 6. Typography is a decision, not a default

When the source uses a default stack (`system-ui`, Inter, Arial, an unspecified sans), propose a face that serves the decisions, chosen with `references/design-system/typography.md`, and say in the report that it changes the picked direction's look, so the user accepts or declines it at `ds confirm`. Keep the default only for a stated product reason (it must match the host operating system, the user asked for it). Availability is not such a reason: name the proposed web font with a local fallback stack, and do not swap one default for another dated system face (Trebuchet MS, Verdana, Tahoma) to avoid a download.
