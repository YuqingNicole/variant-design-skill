# Direction cards

A direction card is a JSON file published by the Variant Design direction library at `https://variant-design-skill.vercel.app/d/<slug>.json`. It describes one brief and its A/B/C directions: what each optimizes, what it trades off, where it fits, and which one was recommended. Use a card when the user points to one ("use the Pulse card", a `/d/<slug>` page or a `.json` link) to shape the directions for their own project.

A card is inspiration. It never grants rights to its images, copy or code, and it never outranks the project.

## Load and convert

```sh
node <skill-root>/scripts/direction-card.mjs <card-url-or-file> [--direction A|B|C] [--targets A[,B]] [--language zh|en]
```

- `--direction` picks the card direction to borrow. The default is the card's recommendation, else A. A page link `/d/<slug>` maps to `/d/<slug>.json`. A `?direction=` in the link names the direction the user was looking at.
- `--targets` picks which of the project's directions follow the card. The default is `A`; the other two stay deliberate contrasts so the comparison still means something. If the user asks for all three to follow the card, vary density, hierarchy or interaction instead of repeating it.
- The output contains a `brief.designReferences` record (see `references/design-reference-selection.md`): `usage: "inspiration"`, `review.status: "unverified"`, and constraints stating that the project outranks the card. Add it to the task with `design-task.mjs`; do not invent fields.
- If the card cannot be fetched (for example, a sandbox without network), say so and ask the user to paste the card JSON or save it as a file, then pass the file path. Do not reconstruct a card from memory or from the page's appearance.

## Apply

1. Run project discovery first. The rule precedence is unchanged: **user constraints → product task and existing design system → accessibility → card**. In a brand-locked project, borrow the card's hierarchy, ordering and density, never its fonts or colors.
2. Borrow the decision, not the surface. The card's `optimizes` and `tradeoff` text describes a strategy, for example "anomalies first, metrics as background". Translate it to the user's data and task. Do not copy screenshots, headings, sample data or brand marks from the card.
3. Do not download the card's images into the project. You may open them to understand the layout.
4. In the comparison, name the card for the directions that follow it and explain what was adapted and what was left out. The card's recommendation is not the project's recommendation: recommend on the project's own task, and never select a winner for the user.
5. Card sources:
   - `own` with `kind: verified` came from a real skill run;
   - `kind: concept` is hand-made;
   - `permission` is licensed for display on the library site only;
   - `link-only` carries only notes about an external design.

   None of them change the reuse terms above.
