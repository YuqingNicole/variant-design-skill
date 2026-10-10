---
name: variant-design
description: Create, vary, review, or extend product interfaces. Routes design generation, design systems, components, existing-site analysis, UX review, presentations, WeChat layouts, brand color, and anti-AI copywriting to focused references while preserving project context and producing runnable code when requested.
---

# Variant Design

Turn one brief into deliberate design options, compare them on shared criteria, and carry the strongest direction into working code.

In commands below, `<skill-root>` means the directory containing this `SKILL.md`. Resolve it before running bundled scripts; do not assume the user's project contains this skill's `scripts/` directory.

## Runtime and first use

Use the current code workspace as the target project, not the installed plugin directory. Keep generated output, history, and preview adapters in the target project. The installed skill is read-only during product work.

Bundled scripts require Node.js 22 or later. Before executing them, check the available runtime and the project's package manager. If unavailable, explain the missing runtime and preserve any generated candidate; do not claim that snapshots or preview verification ran. Use the existing framework and dependencies; do not replace the project's stack to fit a helper.

When the user asks about updates, run `node <skill-root>/scripts/check-update.mjs --quiet`. This optional check contacts GitHub for release metadata; ordinary design work does not require it. Plugin updates should use the plugin manager rather than editing its cached files.

## Route first

Choose one primary route. Read that file completely, then load only the references it requires. Do not load every sub-skill or reference by default.

| Request | Read |
|---|---|
| Three directions, a new page, variation actions, or export | `skills/variant-generate/SKILL.md` |
| Tokens, `ds`, design-system confirmation, or page composition | `skills/variant-design-system/SKILL.md` |
| A button, form, card, modal, navigation, or component library | `skills/variant-component/SKILL.md` |
| Audit existing code, extract tokens, match a site, or plan migration | `skills/variant-analyze/SKILL.md` |
| UX, accessibility, cognitive load, heuristics, research, or conversion review | `skills/variant-ux/SKILL.md` |
| Pitch deck or slides | `references/presentation.md` |
| WeChat article layout | `references/wechat.md` |
| Chinese cultural or Wu Xing brand color | `references/wuxing-colors.md` |
| Copywriting or removing AI tone | `references/voice.md` |

If a request spans routes, select the route that produces the requested deliverable and load a second route only when its workflow is actually needed. For example, an accessibility review of a generated page uses UX Review first; generating the fixed page then adds Generate.

## Rule precedence

Across every route and reference: **user constraints → product task and existing/confirmed design system → accessibility → style suggestions**. This order resolves design choices; do not silently hide accessibility problems when a higher constraint prevents a fix—report the conflict and an accessible alternative. Font bans, motion examples, and visual novelty are suggestions subordinate to the existing brand.

Use two acceptance modes: **exploration** compares task strategies plus fitting visual directions; **brand-locked** preserves fonts, colors, component language, and token scales while varying hierarchy, layout, density, and permitted interactions. Both preserve the same core task, data, and necessary functions. A static interface is valid when animation adds no information.

The two-question budget applies to the whole request, including sub-skills. Infer known answers; do not restart intake after routing.

## Fast path

Do not force a confirmation round when the brief or existing project already answers the important questions.

1. Infer product type, audience, tone, constraints, and framework from the request and repository.
2. State important assumptions in one concise line and proceed.
3. Ask at most two questions only when the answers would materially change the deliverable.
4. If the user says “surprise me,” choose three maximally different directions and proceed immediately.

Use a short Design Read only when it helps expose a consequential assumption:

```text
Design Read: [page or flow] for [audience] — [tone] · [constraints]
```

An explicit request to execute, build, generate, or continue authorizes the fast path. Do not make the user confirm information they already supplied.

## Existing project discovery

Before generating or changing interfaces in an existing code project, read `references/project-discovery.md`. Establish the target entry, brand and behavior constraints, related dependencies and unknowns. The bundled read-only scanner assists this review; it does not prove complete understanding or runtime support.

## Shared context

Before design work, read `variant-output/.variant-context.json` when it exists. For the schema and update rules, read `references/project-context.md`.

- User instructions override persisted preferences.
- A confirmed design system locks visual tokens, not content hierarchy or product judgment.
- Preference writes are best-effort. Before generating an edit, use `variant-history.mjs prepare` to create a new candidate with its original baseline; never retrofit a baseline onto an old candidate. Before replacing existing output, a successful durable snapshot is required; on failure keep the original and deliver a separate candidate.
- `reset context` may remove only `variant-output/.variant-context.json` after resolving that exact path.

## Product-critical work

For money, privacy, permissions, deletion, health, safety, or AI-generated conclusions, read:

- `references/design-declaration.md`
- `references/product-integrity-gate.md`

Infer the declaration from available product evidence. Ask only about unknowns that change the primary job, trust boundary, or irreversible consequence. Label mock and inferred evidence explicitly. Product integrity outranks aesthetic preference.

Exploratory posters, moodboards, and explicitly speculative visual studies may skip the declaration; label them `exploratory — no product decision locked`.

## Code output

Whenever the deliverable includes code, read `skills/shared/code-output.md` before writing it. That file is the single source of truth for:

- framework detection and user overrides;
- output paths and file naming;
- preview, iteration, comparison, and export;
- completeness, responsive behavior, performance, and production hardening.

Write complete runnable output. Never use `TODO`, omitted-code comments, or prose in place of implementation. Preserve the user's stack and existing conventions.

## Quality gate

Before presenting generated or materially changed interface code:

1. Read `references/quality-baseline.md`.
2. Run the deterministic scanner:

   ```bash
   node <skill-root>/scripts/quality-gate.mjs <file-or-directory> --strict
   ```

3. Inspect every finding in context; fix confirmed errors and relevant warnings.
4. Preview the result and check the actual rendered interface at desktop and mobile widths when browser control is available.
5. For product-critical work, run the Product Integrity Gate separately. Do not average it into a visual score.

The scanner is evidence, not a substitute for visual judgment. Do not claim WCAG compliance, cross-browser support, or a quality score unless it was actually tested.

## Reference routing

Load one domain reference that best matches the request:

| Domain | Reference |
|---|---|
| Dashboard, analytics, admin, CRM | `references/dashboard.md` |
| Landing page, SaaS, B2B, product site | `references/saas.md` |
| Editorial, report, article, newsletter | `references/editorial.md` |
| E-commerce, marketplace, checkout | `references/ecommerce.md` |
| Education, course, quiz, training | `references/education.md` |
| Creative tool, music, 3D, generative art | `references/creative.md` |
| Mobile app or mobile-first flow | `references/mobile.md` |
| Portfolio or case study | `references/portfolio.md` |
| Food, beverage, restaurant, recipe | `references/food-beverage.md` |
| Fashion, beauty, furniture, lifestyle | `references/fashion.md` |

Then load only the design-system references needed for the task:

- type hierarchy → `references/design-system/typography.md`
- palette and contrast → `references/design-system/color-and-contrast.md`
- layout and spacing → `references/design-system/spatial-design.md`
- motion → `references/design-system/motion-design.md`
- micro-interactions → `references/design-system/micro-interactions.md`
- forms and states → `references/design-system/interaction-design.md`
- responsive behavior → `references/design-system/responsive-design.md`
- interface copy → `references/design-system/ux-writing.md`
- functional prototypes → `references/interactive-patterns.md`

## Non-negotiable invariants

- Three generated directions must differ in design position, not just color.
- Confirmed tokens constrain all downstream visual output until reset.
- Existing-site work extracts and respects current patterns before inventing new ones.
- Generated UI includes meaningful content and relevant loading, empty, error, and success behavior.
- Accessibility, reduced motion, keyboard use, and visible focus are baseline requirements.
- Report what was verified and what remains an assumption.
