# Paper redesign, inner pages: before and after (2026-11-26)

The second half of the paper redesign (`2026-11-25-paper-redesign/`): pricing, about, skills, submissions, changelog, cases and a case page, and sponsor now follow the paper rules inside, not only in the shell. Rules: `docs/design-system.md` §12.12.

How they were taken: Chrome through Playwright against a local production build (`node website/server.mjs`), full-page captures cut at 4200px (desktop) and 5200px (phone), 1440×900 at 1x and 390×844 at 2x, light and dark (`prefers-color-scheme`). "Before" is `origin/master` at `48934e6`; "after" is this branch. Each image has five columns: before at 1440 light, then after at 1440 light, 1440 dark, 390 light and 390 dark. In the phone columns, the bottom tab bar appears partway down the page; that is how full-page captures draw fixed elements, not a layout bug.

| File | Page |
|---|---|
| `pricing.jpg` | `/pricing` |
| `about.jpg` | `/about` |
| `skills.jpg` | `/skills` |
| `submit.jpg` | `/submit` |
| `changelog.jpg` | `/changelog` |
| `cases.jpg` | `/cases` |
| `case.jpg` | `/d/bakery` |
| `sponsor.jpg` | `/sponsor` (before: the filled primary buttons showed no text) |

Also captured but not kept here: `/c/landing`, `/privacy`, `/docs/install`, and the Chinese `/zh/pricing`, `/zh/submit` and `/zh/changelog`. None of the captured pages scrolled sideways at either width.

Not checked: Safari, Firefox, real devices, and each page at 320px (only the existing tests run there).
