// The A/B/C cases are not public yet (maintainer, 2026-11-15). Production builds leave out their pages and every link to them;
// local builds, previews and the dev deployment (behind Vercel Authentication) keep them. scripts/prerender.mjs uses the same switch.
declare const __SHOW_CASES__: boolean | undefined;
export const showCases = typeof __SHOW_CASES__ === 'undefined' || __SHOW_CASES__;
// Same test as isCaseRoute in scripts/prerender.mjs: a link to a case page, which production must not show.
export const linkShown = (href: string) => showCases || !/^\/(?:cases$|c\/|d\/)/.test(href);
