# Project context

Read `variant-output/.variant-context.json` before work. Current user instructions override saved choices. Missing fields are unknown; do not invent them. The whole request has a maximum of two material clarification questions.

## Schema version 2

Paths in `variants.*.files` and `entry` are relative to `variant-output/`. `designSystem.file` is relative to the target project root, so an existing system can remain in `src/`. List every file owned by that variant, including local CSS and assets. Shared assets and the locked DS are read-only during variant edits. Each variant has independent files, tokens, comparison, monotonically increasing version, audit history, and undo stack.

```json
{
  "schemaVersion": 2,
  "scenario": "dashboard",
  "framework": "vite-react",
  "activeVariant": "B",
  "selectedVariant": null,
  "taskContract": {
    "primaryJob": "Find and investigate failed jobs",
    "data": "shared jobs fixture",
    "requiredFunctions": ["filter", "compare", "inspect evidence"]
  },
  "recommendation": {"variant": "A", "reason": "Alert triage is the stated priority; speed remains a hypothesis until tested."},
  "variants": {
    "A": {
      "entry": "VariantA.tsx",
      "files": ["VariantA.tsx", "VariantA.css"],
      "tokens": {"palette": "Amber Warm", "fonts": ["Newsreader", "DM Sans"]},
      "comparison": {"optimizes": "Anomaly detection", "tradeoff": "Less simultaneous detail", "bestFor": "On-call triage"},
      "version": 1,
      "history": [],
      "undo": []
    }
  },
  "notes": ["high contrast"],
  "designSystem": {"confirmed": true, "file": "variant-output/design-system.css", "fonts": ["Newsreader", "DM Sans"], "confirmedAt": "ISO-8601 timestamp"},
  "components": {"button": "variant-output/component-button.html"}
}
```

The abbreviated example shows A only; register B and C with the same structure before building comparison. Tokens should contain actual values or exact token-file references as well as palette/font names. Preserve `designDeclaration`, `designSystem`, `components`, and unrelated context fields when updating.

## Selection, editing, and migration

- Initial generation: register all three directions, version 1, empty history/undo. No winner yet.
- Editing B: update only B, set `activeVariant: "B"`, leave `selectedVariant` unchanged.
- Explicit `pick B`: set `selectedVariant: "B"`; retain A/C and histories.
- Export: use the named variant or selected winner. Do not turn export into selection.
- Recommendation is advice, not a selection.
- Legacy context: back up the original JSON first. Move ambiguous `picked` into `activeVariant`; populate `selectedVariant` only with evidence of explicit selection. Read each artifact to recover per-variant tokens and paths; do not copy the old global palette/fonts to all three. Retain old iteration count under `legacy`, start version 1 at the current recovered state, and do not fabricate missing history.
- `ds confirm` / `ds reset`, declaration and component registry updates retain their existing semantics. Explicit DS edits are a separate operation, not a variation action.

Preference persistence is best-effort. Overwriting an artifact requires a successful snapshot; otherwise keep the original and deliver a separate candidate. See [preview-and-history.md](preview-and-history.md) for apply/undo commands. Run one writer at a time per output directory. Multi-file replacement rolls back ordinary failures; after a process crash recover files from the last snapshot before continuing.
