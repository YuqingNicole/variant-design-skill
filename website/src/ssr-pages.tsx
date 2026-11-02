// Build-time entry (see the `build` script): renders pages that have no data module of their own to static
// HTML, in Chinese, so they read without JavaScript and cannot drift from what the browser shows.
import './ssr-shim';
import type { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { GuidesPage } from './GuidesPage';
import { guides } from './guides-content';
import { InspirationPage } from './InspirationPage';
import { PaperLanding } from './PaperLanding';
import { PricingPage } from './pricing';
import { SkillsPage } from './SkillsPage';
import { SubmitPage } from './SubmitPage';

const pages: Record<string, ReactNode> = {
  '/about': <PaperLanding/>, '/pricing': <PricingPage repositoryUrl="https://github.com/YuqingNicole/variant-design-skill"/>,
  '/skills': <SkillsPage/>, '/submit': <SubmitPage/>, '/guides': <GuidesPage/>, '/inspiration': <InspirationPage/>,
  ...Object.fromEntries(guides.map(g => [`/guides/${g.slug}`, <GuidesPage slug={g.slug}/>])),
};
export const renderPages = () => Object.fromEntries(Object.entries(pages).map(([route, node]) => [route, renderToStaticMarkup(node)]));
