# Variant Design website

The website includes three complete versions of its own landing page plus an optional server-side model generation workflow. Built-in site variants need no model credentials and are clearly separate from example design contracts or live model output.

## Run locally

```bash
npm ci
npm run dev
# Optional live generation: copy .env.example to .env and configure one provider.
```

The homepage uses B as an agent-recommended working baseline; it does not mark a user-selected winner. Open `/variant-output/_compare.html` to compare A/B/C at matching desktop or mobile widths, or `/variant-output/_preview/B.html` to use a full version.

```bash
# Export a named configuration to the real site; backs up the previous integration.
npm run export:landing -- B
npm test
npm run build
npm start
```

`build` checks `src` and all preview TSX, then includes the comparison and three HTML entries in the production output. See [iteration-log.md](iteration-log.md) for the actual edit/undo/export run and remaining boundaries.

The development server exposes:

- `GET /api/status` — reports whether a provider is configured.
- `POST /api/generate` — returns three comparable design contracts without blocking on three long HTML generations.
- `POST /api/build` — builds the selected direction, audits the HTML, and repairs it once if needed.
- `POST /api/iterate` — replans and rebuilds the selected direction, then runs the same quality gate.

For a production-style local run:

```bash
npm run build
npm start
```

Generated HTML is rendered inside a sandboxed iframe. The server separates creative direction from implementation: users compare three lightweight design contracts first, then spend the long generation call only on the selected direction. Model output is sanitized and checked for a complete document, language, responsive structure, semantic landmarks, keyboard focus, reduced motion, implementation depth, and embedded active content. A failed direction gets one focused repair pass before the request fails.

## Model routing

`ANTHROPIC_MODEL` or `OPENAI_MODEL` remains the default for every stage. For production, each stage can use a different model without changing the client:

```bash
ANTHROPIC_PLANNER_MODEL=your-planning-model
ANTHROPIC_BUILDER_MODEL=your-page-generation-model
ANTHROPIC_REVIEWER_MODEL=your-review-model
```

The equivalent `OPENAI_PLANNER_MODEL`, `OPENAI_BUILDER_MODEL`, and `OPENAI_REVIEWER_MODEL` variables are also supported. `GET /api/status` reports the resolved workflow models without exposing credentials.

For latency-sensitive Claude gateways, a practical starting point is Haiku for schema-constrained planning and Sonnet for page building and repair. Reserve Opus for an asynchronous premium polish pass rather than the blocking generation path.

Anthropic-compatible gateways can be connected by setting `ANTHROPIC_BASE_URL`; the server appends `/v1/messages`. For gateways with a non-standard route, `ANTHROPIC_API_URL` can instead specify the complete Messages endpoint. The official Anthropic base URL remains the default.

Upstream requests time out after 120 seconds by default and retry once for transient network, rate-limit, or 5xx failures. Override the timeout with `MODEL_TIMEOUT_MS`.

### Guided homepage case

Open `/#guided-demo` to inspect the three real site directions, compare tradeoffs, and copy prompts for installation/generation, scoped editing, undo, and integration into your project. The selected viewing card only changes the prompts; it does not select a final winner or execute file operations. Follow these prompts in an agent chat with your project open. The optional online generator remains separate and requires a configured model provider.
