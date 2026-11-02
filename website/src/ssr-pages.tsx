// Build-time entry (see the `build` script): renders pages to static HTML so they read without JavaScript and
// cannot drift from what the browser shows. Chinese keeps its hand-written library and docs bodies in prerender.mjs.
import './ssr-shim';
import type { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ContentPages } from './ContentPages';
import { GuidesPage } from './GuidesPage';
import { guides } from './guides-content';
import { LocaleProvider } from './i18n/LocaleProvider';
import type { Locale } from './i18n/locales';
import { InspirationPage } from './InspirationPage';
import { inspirationItems } from './inspiration-data';
import { LibraryPage } from './LibraryPage';
import { categories, entries } from './library-data';
import { PaperLanding } from './PaperLanding';
import { PricingPage } from './pricing';
import { SkillsPage } from './SkillsPage';
import { SponsorPage } from './SponsorPage';
import { SubmitPage } from './SubmitPage';

const standalone: Record<string, ReactNode> = {
  '/about': <PaperLanding/>, '/pricing': <PricingPage repositoryUrl="https://github.com/YuqingNicole/variant-design-skill"/>,
  '/skills': <SkillsPage/>, '/submit': <SubmitPage/>, '/sponsor': <SponsorPage/>, '/guides': <GuidesPage/>, '/inspiration': <InspirationPage/>,
  ...Object.fromEntries(guides.map(g => [`/guides/${g.slug}`, <GuidesPage slug={g.slug}/>])),
};
const library: Record<string, ReactNode> = {
  '/': <LibraryPage view={{ kind: 'feed' }}/>, '/docs': <ContentPages page="docs"/>,
  ...Object.fromEntries(categories.filter(c => entries.some(e => e.category === c.id)).map(c => [`/c/${c.id}`, <LibraryPage view={{ kind: 'category', id: c.id }}/>])),
  ...Object.fromEntries(entries.map(e => [`/d/${e.slug}`, <LibraryPage view={{ kind: 'entry', slug: e.slug }}/>])),
  ...Object.fromEntries(inspirationItems.map(i => [`/inspiration/${i.id}`, <InspirationPage detail={i.id}/>])),
};
const render = (pages: Record<string, ReactNode>, locale: Locale) => Object.fromEntries(Object.entries(pages).map(([route, node]) =>
  [route, renderToStaticMarkup(<LocaleProvider locale={locale} route={route}>{node}</LocaleProvider>)]));
export const renderPages = () => ({ zh: render(standalone, 'zh'), en: render({ ...standalone, ...library }, 'en') });
