# Variant loop regression fixtures

From the repository root:

```bash
node --test scripts/variant-loop.test.mjs
cd tests
npm ci
npx playwright install chromium
npm test
npm run typecheck
```

The browser suite starts the bundled React preview on an available localhost port, renders all three generated TSX fixtures, checks working controls, brand font preservation, keyboard focus, a hero patch and undo, and the real coffee example under reduced motion (including a preference change). It leaves `.generated/` for the subsequent TypeScript check. The fixture is intentionally small and does not validate Next adapters, arbitrary plugins, or future model-generated product layouts.

If Google Chrome is already installed, use `PLAYWRIGHT_CHANNEL=chrome npm test` instead of downloading Chromium.

## Real landing-page production regression

After `npm ci --prefix website` and `npm run build --prefix website`, run `npm run test:landing` here. This suite starts the actual production server, loads all three real landing variants, checks viewport comparison and the integrated B export, then checks mobile navigation, language-switch retention, visible keyboard focus, and reduced motion. No provider calls are made. The separate `landing` CI job builds and tests this path on every PR.
