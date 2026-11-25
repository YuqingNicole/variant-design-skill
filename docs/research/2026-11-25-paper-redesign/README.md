# Paper redesign: before and after (2026-11-25)

Screenshots for the site redesign toward the overall feel the maintainer approved on 2026-11-25 (thin serif display headings, a wider type scale, one full-bleed paper background, unframed images, white space as rhythm, a quiet header with one outlined button, outlined and text controls). The rules are in `docs/design-system.md` §2, §3, §5, §7 and §12.11.

How they were taken: Chrome through Playwright against a local production build (`node website/server.mjs`), 1440×900 at 1x and 390×844 at 2x, light and dark (`prefers-color-scheme`). "Before" is the same build at `e760e2a`; "after" is this branch. External images load from their own hosts, since the local server has no Vercel image service; X videos do not play locally.

| File | What it shows |
|---|---|
| `home-desktop.jpg` | English home, first screen |
| `home-zh-desktop.jpg` | Chinese home after: first screen and scrolled (sticky filter bar over the unframed feed) |
| `collection-desktop.jpg` | `/en/collections/dark-websites` |
| `reference-desktop.jpg` | `/en/inspiration/linear` |
| `guide-desktop.jpg` | `/en/guides/compare-design-directions` |
| `dark-desktop.jpg` | Reference detail in dark mode |
| `phones.jpg` | Home on a phone: before, after (English, Chinese, Chinese dark) |
| `phones-inner.jpg` | Reference detail on a phone, the search sheet and the page bar |

Not checked: Safari, Firefox, real devices, Windows or Android rendering of the thin Chinese weight, and every page at 320px (only the existing tests run there).
