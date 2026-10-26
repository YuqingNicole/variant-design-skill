# Canvas-to-landing acceptance — 2026-10-26

Implemented and exercised the new local `/canvas` editor, rather than claiming arbitrary HTML/React round-tripping.

## Observed workflow

1. Created A/B/C from the labeled built-in starting layouts using the browser.
2. Opened B and double-clicked the headline; saved “从三个方向，走向一个好页面。”.
3. Undid and redid that edit; original and edited strings were restored.
4. Connected a real stdio MCP client to `canvas-server.mjs` and changed the hero description, CTA, typography and feature copy. The human-edited headline remained unchanged; the browser displayed the agent result.
5. Reordered the feature/process sections and switched to a 390px preview. Measured scroll width equaled viewport width.
6. Uploaded a PNG screenshot of the actual editor, changed its alt text, and explicitly selected B for delivery.
7. Downloaded the standalone HTML via the real UI. Checked the preview: one H1, zero editor scripts, image loaded with alt text, navigation anchor worked, FAQ expanded, mobile page had no horizontal overflow.
8. Published that exact exported file through Sites as an owner-private demonstration:
   https://variant-canvas-landing-demo.nicole-chen144768.chatgpt.site

The demonstration source lives in the ignored `.canvas-delivery/` directory; editor state lives in ignored `website/.canvas-data/`. The hosted output is a static landing, not a hosted editing service.

## Limits

No model provider was configured in the website. The in-app proposal control correctly reported this; no live model-generation quality claim is made. Agent cooperation was verified through actual MCP calls. The initial three layouts are templates. This record concerns the canvas adapter, not a claim that the separately installed design skill was exercised through `codex exec` or `claude -p`.

## Regression results

- Website tests: 9 passed, including mocked generation/proposal validation and revision conflicts.
- MCP tests: 2 passed, both using real stdio clients.
- Canvas browser regression: passed, including native drag handles, upload, export and reload.
- Existing landing browser suite: 12 passed initially; the reduced-motion test exposed a duplicate global CSS import. Removed that import and reran the affected test successfully.
- Production TypeScript/Vite build passed. `git diff --check` passed.
- Exported bytes matched the shared renderer for direction B revision 10. UI language switching preserved authored page text.

The canvas now also exposes provider-backed generation of three structured documents. It is distinct from the default template action; it has mocked-provider coverage only in this environment.

## Follow-up review (PR #33)

A separate browser QA pass after this record found issues the regressions above did not catch: Esc saved text edits (the canvas spec asserted that behaviour), replacing an image duplicated it into every undo snapshot, polling refetched the full project every 2 s, a crashed save left a permanent lock, style inputs surfaced raw errors, and the three starters differed only in colour. They were fixed in PR #33, which also adds the canvas and MCP suites to CI. The test counts above predate those fixes.
