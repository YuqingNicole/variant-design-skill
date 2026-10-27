# Isolated React preview bundler — 2026-10-27

Issue #64. `react-preview.mjs --vite-root <package-directory>` now loads Vite from an isolated package while resolving React/React DOM and public assets from the actual project. The helper does not install dependencies or alter application manifests. Missing Vite gives a concrete isolated-install command. Framework-specific APIs are not stubbed; native Next features retain an explicit adapter/unverified boundary.

## Regression and controlled Next project

- `node --test scripts/*.test.mjs`: 48 passed.
- `python3 scripts/plugin-package.test.py`: 2 passed.
- `cd tests && PLAYWRIGHT_CHANNEL=chrome npx playwright test`: 8 passed.
- Website typecheck/production build passed.

The new browser case creates a project with React/React DOM but no Vite, verifies the missing-bundler guidance, builds using the separate test toolchain, opens A/B/C through file URLs and increments every counter. The project manifest stays byte-identical and no Vite is installed into its dependencies. Its initial failure exposed macOS `/var` canonicalization mismatching Vite's resolved inputs; canonical roots fixed the emitted-path error.

Also prepared the real `ledger` Next.js 15.5.12 fixture with its normal lockfile, then wrote three portable client previews importing its existing CurrencyProvider, plan data and global CSS. `--static --vite-root tests` built all three. Chrome opened each file URL; clicking the button changed the real provider's USD state to EUR, with no page errors. This checks shared React identity; it does not demonstrate Next routing, server components, optimized images or fonts.

Controlled fixture: `/tmp/variant-issue64-ledger/ledger-codex`.

## Real Codex CLI run

`node evals/run.mjs --agent codex --fixture ledger --out /tmp/variant-issue64-eval` completed in 397 seconds. All seven grader checks passed; it recommended B without selecting, preserved the project, and read the installed skill under test. Reading: 8,417 words across ten files. Usage: 831,787 tokens including cached inputs, not a price estimate.

The agent attempted the documented isolated npm installation, which failed with ENOTFOUND inside the sandbox. It then used the project's existing Next build with an isolated static export under `.variant-work/next-preview`, fixed an initial relative-import error, and obtained static A/B/C output. It did not implement an improvised JS transpiler/bundler. Its browser tool could not connect from the sandbox; it explicitly reported visual and interaction checks as unverified. This run demonstrates the dependency failure boundary and native fallback, not successful installation or browser validation by the sandboxed agent.

Follow-up outside the sandbox: Chrome opened all three actually generated native-export pages via file URLs. Selecting EUR changed each displayed price, the first CTA displayed its explicit preview-only feedback, and no page errors occurred. Results are retained at `/tmp/variant-issue64-eval/browser-followup.json`. This is a small client/provider fixture, not proof of all Next features.
