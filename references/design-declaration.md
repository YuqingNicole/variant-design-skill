# Design Declaration

This is the human judgment layer before generation, not a PRD. It says who the page is for, what one job it must complete, and what aesthetics are not allowed to obscure.

```yaml
design_declaration:
  user_context:
  primary_job:
  success_moment:
  trust_boundary:
  hierarchy:
  chosen_tension:
  non_negotiables:
  evidence_status: real | mock-clearly-labeled | unknown
```

## Example — investment-research dashboard

```yaml
design_declaration:
  user_context: Buy-side analyst deciding before market open whether a stock merits deeper research
  primary_job: Separate evidence-backed signals from noise requiring verification
  success_moment: The analyst opens the source and records a next research action, rather than acting on an AI score alone
  trust_boundary: Forecasts, live quotes, historical data, and AI summaries must be distinguished and timestamped
  hierarchy: [evidence and freshness, key signal, next research action]
  chosen_tension: evidence > delight
  non_negotiables: [never show AI inference as fact, never hide data cut-off time, never use red/green alone as meaning]
  evidence_status: mock-clearly-labeled
```

Infer from the existing project before asking. Ask only about unknowns that would change the primary job, trust boundary, or trade-off. Explicit visual exploration may skip this file, but must be labelled exploratory.
