# Variant Design — Landing System

The landing page uses one visual grammar: a disciplined editorial grid. Variation belongs inside generated direction previews, never in the surrounding product shell.

## Non-negotiable rules

1. Use the 8px spacing scale from `src/design-system.css`. No one-off spacing values for layout.
2. Use blue only for brand fields, acid yellow only for actions, red only for annotations, and black/white/paper for structure.
3. All product surfaces use square corners, a 1–2px black border, and at most one shared offset shadow.
4. Never rotate, pin, tape, or skew product components. Expressive treatments are allowed only inside `.direction-preview`.
5. Use the bilingual editorial serif stack for interface and display type—prioritizing Iowan Old Style/Baskerville for Latin and Songti/Source Han Serif for Chinese—and monospace only for metadata.
6. Content uses only four line-height tokens: display, heading, body, and metadata. Literal values are allowed only for decorative glyphs and typography inside `.direction-preview`.
7. Every section follows the same sequence: numbered eyebrow, claim, supporting evidence, action or outcome.
8. Generated direction cards must expose the same fields in the same order so users can compare them.
9. Motion must explain state. Decorative animation is not allowed; reduced-motion preferences are respected.
10. Body text is at least 16px and recurring labels are at least 14px.
11. Desktop uses a 12-column mental model within a 1240px shell; mobile collapses to one column without horizontal scrolling.
