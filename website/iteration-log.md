# Landing-page dogfood — 2026-10-05

## Brief and decision

Use the actual Variant Design landing page to exercise the skill's generate → compare → refine → undo → export → project integration path. Preserve its monochrome serif brand, bilingual content, palette library, model workflow, pricing link, and installation path.

A prioritizes understanding; B prioritizes examining real output; C prioritizes installation. B is the agent-recommended working baseline because the user asked to make the loop tangible. It was exported by name, not recorded as a user-selected winner; `selectedVariant` remains null. This recommendation is product judgment, not a measured conversion result.

## Round 1 — actual product friction

Observed the original page in a browser. The large hero pushed the operative UI below the first viewport. `/api/status` returned `configured: false` while the page said ready and displayed rule-based example directions.

Changes: three complete React variants sharing the live site; a visible comparison action; separate labels for the built-in site variants, example contracts, and model output; disabled unavailable generation/build actions; a complete-folder install command. The default page now uses B's exported hero configuration.

## Round 2 — comparison and navigation

Observed that three narrow comparison iframes all rendered at 441px, concealing desktop structural differences. Added matching 1200px desktop / 390px mobile iframe viewports with scaling, Chinese comparison labels, and an optional dark comparison shell. Browser verification found the same computed brand font in all three real outputs, with A's single-column desktop structure and B/C's two-column structures.

The existing mobile CSS hid every navigation link. Added a native details menu and verified it opens the real pricing route. Switching language previously reset the user's work; a custom brief now survives the switch. Keyboard testing retained a 2px solid indicator on the language control after removing its outline suppression.

## Round 3 — real local edit and rollback

Applied a staged B hero-only copy update through `scripts/variant-history.mjs`, explaining that preview needs no provider setup and edits continue in agent chat. Compared the rendered DOM hashes of six other sections (`palettes`, `directions`, `workspace`, `method`, `install`, footer) and the computed font: unchanged by this local operation.

Ran `undo B` and observed the original copy return. Reapplied the candidate, bringing B to revision 4; A/C remained at revision 1. The committed `.history/B/` snapshots preserve the actual local revisions. Later shared product-shell fixes are separate from this scoped hero transaction.

Exported the named B configuration through `npm run export:landing -- B`, which verified a backup before updating `src/landing-config.ts`. This is a real React integration, not a detached snippet. The build typechecks the source and preview TSX and emits all five HTML entrypoints (main, comparison, A/B/C).

## Observed production checks

Using the built production server and a real browser:

- Main route renders B revision 4's content; A/B/C direct routes render their own headings.
- Comparison uses three 1200px frames; switching to mobile changes all three to 390px.
- Shared computed font families match across all three outputs.
- At 390×844 the page has no horizontal overflow and the primary action ends around 480px, inside the first viewport.
- Mobile navigation reaches pricing; the install control successfully copies the full command.
- A typed brief survives a language switch.
- Keyboard focus is visible; under reduced motion, computed scroll behavior is `auto` and there are no running animations in the idle landing view.
- Server/workspace tests, the real-file edit/undo/export test, TypeScript/Vite build, and the strict scanner on new landing/preview files pass.

Two additional browser regressions run against the built production website in CI. They complement the existing mechanics fixtures.

## Boundaries and next useful iteration

No provider credentials were configured in this run. The built-in variants were authored through the skill in Codex; no live `/api/generate`, build, or iterate model call is claimed. Comparison is read-only and routes further edits through the agent. Its commands do not silently mutate local files from a public web page. Automated server tests use controlled responses.

The built-in site variants use the same required features and content below the hero. Their generation is a real repository artifact, not evidence that every future prompt will produce a good result. The unrelated online workspace's richer per-direction persistence still needs a dedicated product pass before claiming a fully self-service browser loop.

Next: run one provider-backed brief when the service is configured, inspect actual generated behavior, and address independent online-workspace histories and durable recovery using that evidence. Keep the existing A/B/C case as a regression project.
