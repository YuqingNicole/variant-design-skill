# Search Console readiness — 2026-11-07

## Current decision

The maintainer chose to keep `https://variant-design-skill.vercel.app/` and not buy a custom domain for now. The distribution task was adjusted to use a URL-prefix Search Console property for this Vercel URL.

## Live site checks

- `https://variant-design-skill.vercel.app/robots.txt` returned `200` and points crawlers to `https://variant-design-skill.vercel.app/sitemap.xml`.
- `https://variant-design-skill.vercel.app/sitemap.xml` returned `200` and contains 239 URL entries. It uses the expected `zh-CN`, `en`, and `x-default` alternates on translated routes.
- `/en`, `/en/cases`, and `/en/guides` returned `200`. Each had a self-referencing canonical and alternate links to the matching Chinese page, English page, and Chinese `x-default`.

These checks confirm the deployed files and page metadata only. They do not establish Google's indexing state or the Search Console hreflang report.

## Search Console access

The connected Google account (`yuqingchen02@gmail.com`) has existing properties for other sites, but no property for `variant-design-skill.vercel.app`. The OpenSEO property list also has no project for this site. No sitemap was submitted and no indexing or international-targeting report was available.

Adding a URL-prefix property still requires a Google verification method. The existing account does not own the `vercel.app` DNS zone, so domain-level DNS verification is unavailable. A URL-prefix HTML verification token must be created in Search Console and added to the site before verification can complete. No verification token was obtained in this run.

## Next step

Create the URL-prefix property for `https://variant-design-skill.vercel.app/`, complete its offered HTML verification method, then submit `/sitemap.xml` and inspect the indexed `/en/...` URLs and hreflang report. Keep this TODO open until those Search Console checks are complete.
