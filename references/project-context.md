# Project context

Persist confirmed choices in `variant-output/.variant-context.json` so later turns do not ask the user to repeat them.

## Start of a task

1. Read the file when it exists and is valid JSON.
2. Apply known values as constraints.
3. Let the current request override any persisted value.
4. Do not ask first-use questions when the request or repository already supplies enough context.

Use missing fields as unknowns, not an invitation to guess. Ask at most two questions when the answers would materially alter the output.

## Schema

```json
{
  "scenario": "landing-page",
  "framework": "vite-react",
  "palette": "Amber Warm",
  "fonts": ["Newsreader", "DM Sans"],
  "direction": "Editorial",
  "picked": "B",
  "iterations": 3,
  "notes": ["high contrast", "no default dark mode"],
  "designDeclaration": {
    "user_context": "...",
    "primary_job": "...",
    "success_moment": "...",
    "trust_boundary": "...",
    "hierarchy": ["..."],
    "chosen_tension": "evidence > delight",
    "non_negotiables": ["..."],
    "evidence_status": "mock-clearly-labeled"
  },
  "designSystem": {
    "confirmed": true,
    "file": "variant-output/design-system.css",
    "palette": "Amber Warm",
    "fonts": ["Newsreader", "DM Sans"],
    "confirmedAt": "ISO-8601 timestamp"
  },
  "components": {
    "button": "variant-output/component-button.html"
  }
}
```

All fields are optional. Do not write invented defaults.

## Update rules

- Scenario or framework detected → update `scenario` or `framework`.
- User confirms a palette, type pair, or direction → update those fields.
- User selects A/B/C or iterates on one direction → update `picked` and `iterations`.
- User adds a durable constraint → append it to `notes` without duplicating it.
- Design Declaration confirmed → update `designDeclaration`.
- `ds confirm` → set `designSystem.confirmed: true`, record its file and timestamp, and write `variant-output/design-contract.md` for product-critical work.
- Component built → register its exact output path.
- `ds reset` → set `designSystem.confirmed: false`; do not delete unrelated user files.

Write atomically when practical. Persistence is best-effort and must not block delivery.
