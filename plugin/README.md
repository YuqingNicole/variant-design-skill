# Codex release candidate

Variant Design is a local-project, skills-only plugin. It uses Codex's existing file, shell and browser tools; it does not need a hosted MCP server or a separate model key. Node.js 22+ is required for bundled helpers. Preview support depends on the project stack; browser verification depends on available tools.

Build from repository root (Python 3 standard library):

```sh
python3 scripts/build-plugin.py /absolute/output/variant-design-codex.zip
python3 scripts/plugin-package.test.py
node --test scripts/variant-loop.test.mjs
```

The ZIP contains `.codex-plugin/plugin.json`, icons, a full `skills/variant-design/` tree and a SHA-256 inventory. It excludes the website, dependencies, tests and local project state. The compatibility manifest is authored in `plugin/plugin.json`; the builder puts it at the required distribution path. Existing relative route and script paths remain intact beneath the packaged skill root. Do not install only SKILL.md.

This is a release candidate, not a published directory listing. Package smoke tests unpack into a fresh temporary project and execute comparison, scoped apply and undo from outside the repository. They do not prove plugin-manager discovery or model-generated design quality.

## Data and updates

Bundled history and preview helpers operate locally and bind preview servers to localhost. Project contents are processed by the host Codex environment and its configured tools. Variant Design has no dedicated telemetry or hosted service. User-requested update checks contact GitHub release metadata. Project dependencies/assets and tools chosen during a task may access the network; follow the host's permissions. Updates must not rewrite a cached installed plugin during design work.

## Submission reference

Checked 2026-10-07:
- https://developers.openai.com/plugins/build/plugins
- https://developers.openai.com/plugins/deploy/submission

The supported Codex compatibility format uses `.codex-plugin/plugin.json`. The public submission flow includes ZIP validation and skills scanning under a verified publisher identity. Local package tests do not replace those checks. Before submission, test installation and skill discovery in the desktop plugin manager, verify publisher/listing metadata, and complete the release gates in `release-readiness.md`. Do not claim marketplace approval or install availability until observed.

## Candidate workflow (RC2)

Before editing, run `variant-history.mjs prepare <output> B <new-candidate-directory> [project-root]`. Apply requires that baseline; legacy candidates must be reconciled into a newly prepared directory. Original bytes remain in the candidate baseline for comparison. Do not upload candidate baselines: they contain project source.
