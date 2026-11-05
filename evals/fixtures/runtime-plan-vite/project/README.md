# Original Progress Review (React/Vite)

Self-authored, local-only fixture. Preserve original source, dependencies and configuration. The original ReviewProvider/useReview supplies the data title, workspace roles, per-workspace progress and independent activity counts. Keep its behavior and imports rather than copying it.

Studio is owner: Animate progress runs a real RAF loop at 50. Initial/switched reduced motion cancels it and settles at 100. Archive is viewer: the Animate progress button remains in the DOM but is hidden, and the provider refuses animation. Inspect activity increases only the current workspace count; workspace changes retain independent counts.

Original Vite resolves @ to src and defines __REVIEW_LABEL__. All candidates must display its value with data-testid=configuration, use h1 for the original provider title, and retain the accessible control names/test IDs. Original global.css is the brand. Typechecking includes src, registered candidate TSX and isolated .variant-work/preview TSX; temporary history candidates and integration staging stay outside that path. Place simple isolated HTML/TSX preview entries there and use the existing original config. The host handles ports and build output. No network assets, backend, payment or external accounts.
