---
name: variant-design
description: Create, vary, review, or extend product interfaces. Routes design generation, design systems, components, existing-site analysis, UX review, presentations, WeChat layouts, brand color, and anti-AI copywriting to focused references while preserving project context and producing runnable code when requested.
---

# Variant Design

Turn one brief into deliberate design options, compare them on shared criteria, and carry the strongest direction into working code.

`<skill-root>` means the directory containing this `SKILL.md`. Run bundled scripts from there; the user's project does not contain them. Work in the user's project, keep all output there, and treat the installed skill as read-only. The scripts need Node.js 22 or later: if it is missing, say so, keep any generated candidate, and do not claim snapshots or preview checks ran. Use the project's existing stack.

## Route, then load as you go

Choose one route and read its file. Each route file has a load map: read the other files it names at the step that needs them, not before. Load a second route only when its workflow is actually needed.

| Request | Read |
|---|---|
| Three directions, a new page, variation actions, undo, pick, or export | `skills/variant-generate/SKILL.md` |
| Tokens, `ds`, design-system confirmation, or page composition | `skills/variant-design-system/SKILL.md` |
| A button, form, card, modal, navigation, or component library | `skills/variant-component/SKILL.md` |
| Audit existing code, extract tokens, match a site, or plan migration | `skills/variant-analyze/SKILL.md` |
| UX, accessibility, cognitive load, heuristics, research, or conversion review | `skills/variant-ux/SKILL.md` |
| Pitch deck or slides | `references/tasks/presentation.md` |
| WeChat article layout | `references/tasks/wechat.md` |
| Chinese cultural or Wu Xing brand color | `references/tasks/wuxing-colors.md` |
| Copywriting or removing AI tone | `references/tasks/voice.md` |
| Checking for skill updates | run `node <skill-root>/scripts/check-update.mjs --quiet` (contacts GitHub) and give the command it prints; a Codex plugin install updates through the plugin manager. Never edit the installed files |

## Rules for every route

- **Precedence:** user constraints → product task and existing or confirmed design system → accessibility → style suggestions. When a higher rule blocks an accessibility fix, report the conflict and an accessible alternative.
- **Two modes:** exploration varies strategy and visual direction; brand-locked keeps fonts, colors, components and token scales and varies hierarchy, layout and density. Both keep the same core task, data and functions. A confirmed design system constrains all later visual output until `ds reset`; it locks tokens, not content hierarchy or product judgment. In an existing site, extract and respect its patterns before inventing new ones.
- **Fast path:** infer what the brief and repository already answer, state consequential assumptions in one line, and proceed. At most two clarifying questions for the whole request, only when the answer changes the deliverable.
- **Existing project:** before changing its interfaces, follow `references/workflow/project-discovery.md`.
- **Saved context:** read `variant-output/.variant-context.json` when it exists; the current request overrides it. Its rules are in `references/workflow/project-context.md`.
- **Never overwrite unseen work:** change existing output only through the history helper, which snapshots first. Editing is not selecting; only the user's explicit pick selects a direction.
- **Product-critical work** (money, privacy, permissions, deletion, health, safety, AI-derived conclusions): follow `references/workflow/design-declaration.md` and `references/workflow/product-integrity-gate.md`, and report integrity separately from visual quality.
- **Code:** read `skills/shared/code-output.md` before writing interface code. Write complete, runnable files with real content and the relevant loading, empty, error and success states; no `TODO` or omitted code. Keyboard use, visible focus and reduced motion are baseline. A static interface is valid when animation adds no information.
- **Before presenting UI:** run `node <skill-root>/scripts/quality-gate.mjs <files> --strict`, inspect findings in context, and check the rendered result at desktop and mobile widths when a browser is available (`references/workflow/quality-baseline.md`).
- **Honesty:** report only checks that ran, and separate what was verified from what is assumed. Never claim WCAG compliance, cross-browser support or a quality score from inspection alone.
