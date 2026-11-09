# Motion eval: does the motion path load and keep the new rules?

Date: 2026-11-09. Agent: Claude Code (`node evals/run.mjs --agent claude --fixture motion`), skill installed from the working tree at project level.

## Question

After `motion-rules.md` was added (#197), the `harbor` eval passed but never read it, so it could not show whether a motion task loads the file or follows it. This run uses a new `motion` fixture: the `bakery` page with a brief about motion (button press, list-item hover, a confirmation that appears), three directions.

## Result

One run, one agent, one model. Cost $1.75, 27 turns, 440 seconds.

| Check | Result |
|---|---|
| generated, delivery-check, not-selected, project-untouched, quality-gate, skill-under-test | pass |
| motion-rules-read | pass |
| motion-present, motion-no-transition-all, motion-no-scale-zero, motion-hover-gated, motion-reduced | pass (all three directions) |
| generator-habits | **fail**: `decorative-number bakery.js:25` |

Skill files read (11, 16,438 words): `SKILL.md`, `skills/variant-generate/ROUTE.md`, `skills/shared/code-output.md`, `references/design-system/{micro-interactions,motion-design,motion-rules}.md`, `references/domains/food-beverage.md`, and four workflow files. The route's load map named `motion-rules.md` for a motion brief, and the agent followed it.

## What this shows and does not show

- It shows that with this brief the route loads `motion-rules.md` and that all three directions pass five static text checks: no `transition: all`, nothing started from `scale(0)`, hover movement only inside `(hover: hover)`, a `prefers-reduced-motion` rule wherever there is motion, and some motion present.
- It does not show that the rules caused this. There is no run without `motion-rules.md` to compare with, and one run cannot separate the file's effect from the model's own habits. A comparison would need the same fixture with the file removed, several runs each.
- The checks are text patterns. They do not test how the motion looks, its timing, or that it runs smoothly. Nobody opened the previews for this record.

## The one failure is a false positive

`generator-habits` reported `decorative-number` for `variant-output/shared/bakery.js:25`. That line is `function pad(n) { return String(n).padStart(2, '0'); }`, a zero-pad helper used to format a date as `YYYY-MM-DD`. It is not a decorative section number. The heuristic in the quality gate matches zero-padded digits in code as well as in markup. Not changed here; it affects any generated page that formats dates.

## Reproduce

`node evals/run.mjs --agent claude --fixture motion`. The grader tests (`node --test evals/grade.test.mjs`, no agent) cover the motion checks with good and bad CSS.
