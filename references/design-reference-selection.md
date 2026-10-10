# Selecting design references for a real project

Use after project discovery and task definition, before generating A/B/C, when references would improve the requested design. Skip external browsing when the existing design system or user-supplied material is sufficient. Do not make network access mandatory for ordinary work.

## Discover, inspect, then decide

[Designeer](https://www.designeer.xyz/) is a discovery directory, not a source of verified implementation or reuse rights. Its [components](https://www.designeer.xyz/components) and [visuals](https://www.designeer.xyz/visuals) sections can help find implementation materials; its homepage lists galleries and interface references. Visit relevant original sources before claiming compatibility, availability or license terms. Sponsor placement is not a quality signal.

Choose a small set around the task: for pricing, references might support quick comparison, value explanation, or usage estimation. Describe a concrete decision to borrow—information hierarchy, interaction feedback, layout or type scale. Keep the same core task/data/actions across A/B/C. Existing brand and project constraints outrank reference styles.

Do not automatically install a component library or copy assets because they appear in a directory. Inspect the actual API, dependencies, license and accessibility/performance implications before reuse. Unverified references may remain inspiration leads; unknown/restricted reuse rights mean do not copy code/assets until resolved. Borrowing a visual principle is different from copying its implementation.

## Task contract

Optional `brief.designReferences` is an array (absence remains compatible with existing tasks). Each record contains:

```json
{
  "id": "pricing-comparison",
  "title": "Reference title",
  "url": "https://example.com/pricing",
  "usage": "inspiration",
  "borrow": "Compare feature differences beside each plan",
  "rationale": "Supports the task of choosing a suitable plan",
  "constraints": "Retain existing brand tokens and checkout action",
  "directions": ["A"],
  "review": { "status": "unverified" }
}
```

`usage` is inspiration, code or asset. `review.status` is unverified or verified; verified requires `evidence` and ISO `checkedAt` from actual source review. Code/asset records additionally require `license: {status, evidence}`, with status unknown, permitted or restricted. Record unknown honestly. Schema validation checks recording completeness, not legal rights, package compatibility or permission to install. It does not fetch URLs or execute downloaded code.

Unresolved implementation dependencies belong in task `unknowns`; mark blocking when candidate work depends on them, or choose an existing-project alternative. Include specific dependency costs and reduced-motion behavior in constraints where relevant. Store no credential-bearing URLs or private tokens.

Explain which reference supports each direction's tradeoff. Reference records are included in the task digest, so changing them invalidates task-bound observations. External pages can change independently; a task digest does not certify the live source. Recheck relevant original sources before reuse.

The website inspiration gallery can later pass these records into task creation. This contract does not yet implement that UI handoff, automatic resource retrieval or a new paid resource library.
