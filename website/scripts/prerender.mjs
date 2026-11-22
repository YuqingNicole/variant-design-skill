#!/usr/bin/env node
// After `vite build`: write one HTML file per library route with its own title, description,
// canonical link, share card, structured data and readable content, plus sitemap.xml, feed.xml
// (RFC-002 §7) and llms.txt / llms-full.txt for AI search.
// The browser still renders with React; createRoot replaces the static content on load.
import { importTs } from './ts-module.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {referenceRecords} from './reference-records.mjs';
import { contentRoot, loadEntries, toCard } from './content.mjs';
const here = path.dirname(fileURLToPath(import.meta.url));
const repository = 'https://github.com/YuqingNicole/variant-design-skill';
export const defaultSite = 'https://variantdesign.xyz';
const categoryNames = { landing: '落地页', product: '产品界面', data: '数据展示', brand: '品牌', component: '组件' };
const kindLabel = e => e.source === 'own' ? (e.kind === 'verified' ? '技能产出 · 已验证' : '概念作品') : e.source === 'permission' ? '授权投稿' : '外部参考';
export const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const cover = e => { const d = e.directions.find(x => x.id === e.recommendation?.variant) ?? e.directions[0]; return { direction: d, image: d.media[0] }; };
const order = entries => [...entries].sort((a, b) => Number(b.featured) - Number(a.featured) || b.publishedAt.localeCompare(a.publishedAt) || a.slug.localeCompare(b.slug));
// Pages outside the library only get their own title and description.
const staticPages = {
  '/about': ['关于 Variant Design', '一份需求，在你的项目里做出三个能运行的方向：任务、数据和功能相同，取舍不同。局部修改先存快照，可以撤回，不会覆盖你没看过的改动。'],
  '/docs': ['文档 — Variant Design', '怎样用 AI 做出高质量的界面：安装技能，比较方向，检查结果，定动效规则，测量页面。每篇都来自实际跑过的记录。'],
  '/docs/install': ['在 Claude Code 和 Codex 里安装设计技能 — Variant Design', '安装技能，确认可用，然后在你的项目里走完一次：生成、比较、试改、撤回、接入。'],
  '/submit': ['投稿与授权 — Variant Design', 'Variant Design 方向库的收录、授权与撤下规则。'],
  '/pricing': ['价格 — Variant Design', '本地开源技能免费可用；托管专业版和团队版仍是计划，尚未开放。'],
  '/sponsor': ['赞助 — Variant Design', '品牌赞助 Variant Design 的方式与规则：明确标注，与编辑精选分开。'],
  '/privacy': ['隐私说明 — Variant Design', 'Variant Design 网站收集什么、存在哪里、用来做什么，以及怎样删除账号。'],
  '/lab': ['实验室 — Variant Design', '工作台和画布等实验功能。'],
  '/guides': ['指南 — Variant Design', '用 AI 做界面时常见问题的回答：怎么比较方向、怎么撤回修改、怎么避免千篇一律。'],
  '/changelog': ['更新记录 — Variant Design', 'Variant Design 技能每个版本的改动，来自仓库里的 CHANGELOG.md。'],
  '/skills': ['Claude Code 和 Codex 的前端设计技能 — Variant Design', 'Claude Code 和 Codex 里能用的前端设计技能，只收录我们在一次性项目里实际跑过、并公开了记录的。'],
};

const staticPagesEn = references => ({
  '/about': ['About Variant Design', 'One brief becomes three runnable directions in your own project: the same task, data and functions, different tradeoffs. Scoped edits are snapshotted first, can be undone and never overwrite changes you have not seen.'],
  '/docs': ['Docs — Variant Design', 'How to make good interfaces with AI: install the skill, compare directions, check the result, set motion rules and measure the page. Each article comes from runs we actually did.'],
  '/docs/install': ['Install the design skill in Claude Code and Codex — Variant Design', 'Install the skill, confirm it works, then go through one full loop in your project: generate, compare, refine, undo, integrate.'],
  '/submit': ['Submissions & permissions — Variant Design', 'How the Variant Design direction library handles submissions, permissions and takedowns.'],
  '/sponsor': ['Sponsor Variant Design', 'How brands can sponsor Variant Design: clearly labeled and kept separate from editorial picks.'],
  '/privacy': ['Privacy — Variant Design', 'What the Variant Design site collects, where it is kept, what it is used for and how to delete your account.'],
  '/pricing': ['Pricing — Variant Design', 'The local open-source skill is available; hosted Pro and Team plans are proposals, not available subscriptions.'],
  '/changelog': ['Changelog — Variant Design', 'What changed in each version of the Variant Design skill, from CHANGELOG.md in the repository.'],
  '/skills': ['Frontend design skills for Claude Code and Codex — Variant Design', 'Frontend design skills for Claude Code and Codex: only the ones we ran in throwaway projects, with public records.'],
  '/guides': ['Guides — Variant Design', 'Answers to common questions about designing interfaces with AI: comparing directions, undoing changes and avoiding generic results.'],
});

// Experiments stay reachable but out of search results (RFC-005 §3.3).
const unlisted = new Set(['/lab']);
const noindexTag = '<meta name="robots" content="noindex">';
// Served with status 404 for any path that has no page (vercel.json rewrites only the client-only routes to the app shell).
// No canonical and no share card: this is not a page to index or to share. The app still boots and shows its own "not found" view.
export function notFoundPage(template) {
  const title = 'Not found — Variant Design', description = 'No page lives at this address.';
  const html = template.replace(/<html[^>]*>/, () => '<html lang="en">').replace(/<title>[\s\S]*?<\/title>/, () => `<title>${title}</title>`)
    .replace(/<meta\s+name="description"\s+content="[^"]*"\s*\/?>/, () => `<meta name="description" content="${description}" />`)
    .replace('<div id="root"></div>', () => `<div id="root"><main><h1>Not found</h1><p>${description} <a href="/">Back to the home page</a></p></main></div>`);
  if (!html.includes(`<title>${title}</title>`) || !html.includes(`content="${description}"`) || !html.includes('<h1>Not found</h1>')) throw new Error('Could not place the not-found page');
  return withNoindex(html);
}
export const withNoindex = html => html.includes(noindexTag) ? html : html.replace('</head>', () => `    ${noindexTag}\n  </head>`);

// RFC-005 §3.5: routes whose English is marked draft. Production leaves them out of the English pages,
// hreflang, sitemap and llms.txt; local and preview builds keep them so reviewers can read them.
// A guide lives under /guides unless it says otherwise: the longer articles are under /docs.
export const guideRoute = g => `${g.base ?? '/guides'}/${g.slug}`;
export const draftRoutes = ({ guides = [], entries = [], references = [] }, locale = 'en') => [
  ...guides.filter(g => g.translations?.[locale]?.status === 'draft').map(guideRoute),
  ...entries.filter(e => e.translations?.[locale]?.status === 'draft').map(e => `/d/${e.slug}`),
  ...references.filter(r=>r.translations?.[locale]?.status==='draft').map(r=>`/inspiration/${r.id}`)];
// The A/B/C cases are not public yet (maintainer, 2026-11-15): production leaves out /cases, /c/* and /d/* in both languages, with their
// sitemap, feed and llms.txt lines; previews and dev keep them (src/case-visibility.ts). The /d/<slug>.json cards stay, because the skill reads them.
export const isCaseRoute = route => /^(?:\/zh)?\/(?:cases$|c\/|d\/)/.test(route);
export function withoutCases(pages) {
  for (const route of [...pages.keys()]) if (isCaseRoute(route)) pages.delete(route);
  return pages;
}
export function withoutDrafts(english, drafts) {
  const kept = { ...english };
  for (const route of drafts) delete kept[route];
  return kept;
}

// The reference library lives in a TS module of plain JSON literals; read it without a TS loader.
// Sections that have at least one reference, with how many each language lists (draft English is left out of production).
const sectionModule = await importTs(path.join(here, '../src/inspiration-sections.ts'));
// The home (Inspiration) lists everything except an own-page section such as Videos, so its counts leave those out.
const onHome = references => references.filter(r => !sectionModule.pageOf(r));
export const sectionPages = (references, englishReferences = references) => sectionModule.activeSections(references).map(c => ({ ...c, count: { zh: references.filter(r => sectionModule.sectionOf(r) === c.id).length, en: englishReferences.filter(r => sectionModule.sectionOf(r) === c.id).length } }));
export const loadReferences=()=>referenceRecords().published;
export const loadWithdrawnReferences=()=>referenceRecords().withdrawn;
// Without JavaScript the inspiration page shows only its first tab; this index links every reference page.
export function referenceIndex(references, lang = 'zh') {
  const en = lang === 'en', href = id => pathIn(`/inspiration/${id}`, lang);
  return `<nav aria-label="${en ? 'All references' : '全部参考'}"><h2>${en ? `All ${references.length} references` : `全部 ${references.length} 个参考`}</h2><ul>${references.map(r => `<li><a href="${href(escape(r.id))}">${escape(r.name)}</a></li>`).join('')}</ul></nav>`;
}
const zhText = {
  crumbs: '路径', home: '灵感', related: '同类参考', seeAll: '浏览这一类的所有条目', yours: '做出你的版本', installSkill: '安装技能',
  bd: { breakdown: '拆解', checked: '核对于', structure: '页面怎么搭', measured: '实测', learn: '最值得学的一个细节', avoid: '不建议照搬的一点', unchecked: '只在桌面宽屏上看了页面结构和样式，没有在手机上看，也没有测交互、速度和无障碍。网站随时会改，以上是核对当天的样子；「我们的判断」没有经过实测。' },
  yoursNote: '把这条参考写进指令，让 variant-design 技能在你自己的项目里生成 A/B/C 三个方向。',
};
function referenceBody(r, references = [], sections = []) {
  const permission=r.source==='permission'?`<aside><p>作者授权 · 仅限本站展示，不含下载、复用、MCP、再分发或商业使用。</p><p><a href="${escape(r.credit.url)}">${escape(r.credit.name)}</a> · <a href="${escape(r.permission.record)}">授权记录</a></p></aside>`:'';
  const section = sections.find(c => c.id === sectionModule.sectionOf(r)), { list, total } = sectionModule.relatedReferences(r, references);
  const crumbs = section ? `<nav aria-label="${zhText.crumbs}"><a href="/zh">${zhText.home}</a> / <a href="/zh/browse/${section.id}">${escape(section.title.zh)}</a></nav>` : `<p><a href="/zh">${zhText.home}</a></p>`;
  const a = r.analysis, bd = zhText.bd;
  const analysis = a ? `<section><h2>${bd.breakdown} <small>${bd.checked} ${escape(a.checkedAt)}</small></h2><h3>${bd.structure}</h3><p>${escape(a.structure.zh)}</p><h3>${bd.measured}</h3><ul>${a.measured.zh.map(v => `<li>${escape(v)}</li>`).join('')}</ul><h3>${bd.learn}</h3><p>${escape(a.learn.zh)}</p><h3>${bd.avoid}</h3><p>${escape(a.avoid.zh)}</p><p>${bd.unchecked}</p></section>` : '';
  const more = list.length ? `<section><h2>${zhText.related}</h2><ul>${list.map(x => `<li><a href="/zh/inspiration/${escape(x.id)}">${escape(x.name)}</a> <small>${escape(x.tag)}</small></li>`).join('')}</ul>${section ? `<a href="/zh/browse/${section.id}">${zhText.seeAll} (${total})</a>` : ''}</section>` : '';
  return `<main>${crumbs}<h1>${escape(r.name)}</h1><p>${escape(new URL(r.url).hostname)}</p><dl><dt>研究什么</dt><dd>${escape(r.focus.zh)}</dd><dt>用在哪里</dt><dd>${escape(r.application.zh)}</dd><dt>出处</dt><dd>${escape(r.publisher)} · ${escape(r.checkedAt)}${r.via ? ` · <a href="${escape(r.via)}">经 ${escape(new URL(r.via).hostname)} 发现</a>` : ''}</dd></dl>${permission}<p><a href="${escape(r.url)}">访问原站</a></p>${analysis}${more}<section><h2>${zhText.yours}</h2><p>${zhText.yoursNote}</p><a href="/zh/docs/install">${zhText.installSkill}</a></section></main>`;
}
// The install guide (src/docs-content.ts) as static HTML, so /docs reads without JavaScript.
function docsBody(d, lang = 'zh') {
  const list = rows => `<ul>${rows.map(r => `<li>${escape(r[lang])}</li>`).join('')}</ul>`, code = c => `<pre><code>${escape(c)}</code></pre>`;
  const commands = rows => `<dl>${rows.map(([c, t]) => `<dt><code>${escape(typeof c === 'string' ? c : c[lang])}</code></dt><dd>${escape(t[lang])}</dd>`).join('')}</dl>`;
  const x = k => escape(d.text[k][lang]);
  return `<main><h1>${lang === 'en' ? 'Install and get started' : '安装与开始使用'}</h1><p>${x('pitch')}</p><p>${x('pitchNote')}</p>`
    + `<section id="before"><h2>${x('before')}</h2>${list(d.prerequisites)}</section>`
    + `<section id="install"><h2>${x('install')}</h2><p>${x('installIntro')}</p>${d.agents.map(a => `<h3>${escape(a.label || (lang === 'en' ? 'Other agents' : '其他 Agent'))}</h3>${code(a.id === 'codex' ? d.installCommand : d.clone(a.path))}<p>${escape(a.note[lang])}</p>`).join('')}`
    + `<h3>${x('confirm')}</h3><p>${x('confirmNode')}</p>${d.agents.map(a => code(d.verify(a.path, lang === 'zh'))).join('')}<p>${x('confirmPrompt')}</p>${code(d.prompts.check[lang])}</section>`
    + `<section id="first-project"><h2>${x('firstProject')}</h2><p>${x('firstIntro')}</p>${code(d.prompts.first[lang])}<h3>${x('outcomes')}</h3>${list(d.outcomes)}</section>`
    + `<section id="refine"><h2>${x('refine')}</h2><p>${x('refineIntro')}</p>${commands(d.refine)}</section>`
    + `<section id="deliver"><h2>${x('deliver')}</h2>${commands(d.deliver)}<p>${escape(d.systemChecks[lang])}</p><p>${x('integrate')}</p>${code(d.prompts.integrate[lang])}<h3>${x('handoff')}</h3>${list(d.handoff)}</section>`
    + `<section id="more"><h2>${x('more')}</h2><p>${x('moreIntro')}</p>${commands(d.otherUses)}</section>`
    + `<section id="faq"><h2>${x('faq')}</h2>${d.faq.map(([q, a]) => `<h3>${escape(q[lang])}</h3><p>${escape(a[lang])}</p>`).join('')}</section></main>`;
}
// English is the default and keeps unprefixed addresses; Chinese lives under /zh (maintainer, 2026-11-17).
const pathIn = (route, lang) => lang === 'en' ? route : (route === '/' ? '/zh' : `/zh${route}`);
// renderSite builds both languages under one key space first (English under /en), then remaps them to the public addresses.
// Experiments and previews have one address (src/i18n/locale-route.ts).
const oneAddress = /^\/(lab|directions|showcase|variant-output|api)(\/|$)/;
const enKey = route => route === '/' ? '/en' : `/en${route}`;
const skillData = (site, version, lang = 'zh') => ({ '@type': 'SoftwareSourceCode', '@id': `${site}/#skill`, name: 'variant-design', version,
  description: lang === 'en' ? 'Open-source agent skill that turns one design brief into three comparable directions (A/B/C) inside your own project, with scoped edits, snapshot undo and an integration you can roll back. For Codex, Claude Code and other local agents.' : '开源 Agent 技能：在你自己的项目里把一个设计任务做成 A/B/C 三个可比较的方向，支持局部修改、快照撤回和可回滚的接入。适用于 Codex、Claude Code 等本地 Agent。',
  codeRepository: repository, url: site + pathIn('/docs/install', lang), programmingLanguage: 'JavaScript', runtimePlatform: 'Node.js 22+', license: 'https://opensource.org/licenses/MIT' });
function docsData(d, site, lang = 'zh') {
  const url = site + pathIn('/docs/install', lang);
  return { '@graph': [
    { '@type': 'HowTo', name: lang === 'en' ? 'Install Variant Design and generate A/B/C directions in your project' : '安装 Variant Design 并在项目里生成 A/B/C 三个方向', url, inLanguage: lang === 'en' ? 'en' : 'zh-CN',
      supply: d.prerequisites.map(p => ({ '@type': 'HowToSupply', name: p[lang] })),
      step: [['install', 'installIntro', d.installCommand], ['confirm', 'confirmPrompt', d.prompts.check[lang]], ['firstProject', 'firstIntro', d.prompts.first[lang]], ['refine', 'refineIntro'], ['deliver', 'integrate', d.prompts.integrate[lang]]]
        .map(([h, p, c], i) => ({ '@type': 'HowToStep', position: i + 1, name: d.text[h][lang], text: [d.text[p][lang], c].filter(Boolean).join('\n'), url: `${url}#${['install', 'install', 'first-project', 'refine', 'deliver'][i]}` })) },
    { '@type': 'FAQPage', mainEntity: d.faq.map(([q, a]) => ({ '@type': 'Question', name: q[lang], acceptedAnswer: { '@type': 'Answer', text: a[lang] } })) }] };
}

function card(e) {
  const { image } = cover(e);
  return `<article><a href="/zh/d/${e.slug}"><img src="/media/${e.slug}/${escape(image.file)}" width="${image.width}" height="${image.height}" alt="${escape(image.alt[0])}"><p>${escape(categoryNames[e.category] ?? e.category)} · ${escape(kindLabel(e))}</p><h2>${escape(e.title[0])}</h2><p>${escape(e.summary[0])}</p></a></article>`;
}
function entryBody(e) {
  const directions = e.directions.map(d => `<section><h2>${d.id} · ${escape(d.name[0])}</h2><img src="/media/${e.slug}/${escape(d.media[0].file)}" width="${d.media[0].width}" height="${d.media[0].height}" alt="${escape(d.media[0].alt[0])}"><dl><dt>优化</dt><dd>${escape(d.comparison.optimizes[0])}</dd><dt>取舍</dt><dd>${escape(d.comparison.tradeoff[0])}</dd><dt>适合</dt><dd>${escape(d.comparison.bestFor[0])}</dd></dl></section>`).join('');
  const recommendation = e.recommendation ? `<aside><h2>推荐 ${e.recommendation.variant}</h2><p>${escape(e.recommendation.reason[0])}</p></aside>` : '';
  // How a verified case was made, the same facts the client renders (LibraryPage HowItWasMade).
  const r = e.run, facts = r ? [['运行环境', r.model ? `${r.agent} · ${r.model}` : r.agent], ['日期', r.date], ['用时', r.durationSec === undefined ? null : `${Math.floor(r.durationSec / 60)} min ${r.durationSec % 60} s`], ['费用', r.costUsd === undefined ? null : `$${r.costUsd.toFixed(2)}`], ['轮次', r.turns === undefined ? null : String(r.turns)]].filter(f => f[1] !== null) : [];
  const run = r ? `<section><h2>怎么做出来的</h2><dl>${facts.map(([k, v]) => `<dt>${k}</dt><dd>${escape(v)}</dd>`).join('')}</dl>${r.prompt ? `<p>给 agent 的原话，一次无人值守运行：</p><pre>${escape(r.prompt[0])}</pre>` : ''}${r.commands?.length ? `<p>运行中调用的技能命令，按先后：</p><ol>${r.commands.map(c => `<li><code>${escape(c)}</code></li>`).join('')}</ol>` : ''}<p>数字来自运行记录；截图取自 agent 自己生成的预览文件。${r.record ? ` <a href="${repository}/blob/master/${escape(r.record)}">阅读运行记录</a>` : ''}</p></section>` : '';
  return `<main><p><a href="/zh/cases">案例</a> / <a href="/zh/c/${e.category}">${escape(categoryNames[e.category] ?? e.category)}</a></p><h1>${escape(e.title[0])}</h1><p>${escape(e.summary[0])}</p><p>${escape(kindLabel(e))} · ${escape(e.credit.name)} · ${e.publishedAt}</p><p>任务：${escape(e.brief[0])}</p>${directions}${recommendation}${run}</main>`;
}

function guideData(g, site, lang = 'zh') {
  return { '@type': 'Article', ...(g.image ? { image: site + g.image.src } : {}), headline: g.title[lang], description: g.answer[lang], datePublished: g.publishedAt, inLanguage: lang === 'en' ? 'en' : 'zh-CN', url: site + pathIn(guideRoute(g), lang), author: { '@type': 'Person', name: 'Yuqing Nicole' }, about: { '@id': `${site}/#skill` } };
}

// Every page without a picture of its own shares this one: our mark and words, never someone else's screenshot (the repository stores none).
export const shareCard = { src: '/share-card.png', width: 1200, height: 630 };
// The card's own text is English, so the alt text is too in both languages.
const shareAlt = { zh: 'Variant Design: the best design inspiration. Every reference comes with its source and our notes.', en: 'Variant Design: the best design inspiration. Every reference comes with its source and our notes.' };
function page(template, { site, route, title, description, image: own, type = 'website', body = '', data, lang = 'zh', translated = false }) {
  const url = site + pathIn(route, lang), image = own ?? { ...shareCard, alt: shareAlt[lang === 'en' ? 'en' : 'zh'] };
  // Every version names all versions including itself; x-default is the unprefixed address (RFC-005 §3.4).
  const versions = translated ? [['zh-CN', 'zh'], ['en', 'en'], ['x-default', 'en']].map(([tag, l]) => `<link rel="alternate" hreflang="${tag}" href="${escape(site + pathIn(route, l))}">`) : [];
  const meta = [`<link rel="canonical" href="${escape(url)}">`, ...versions, `<meta property="og:locale" content="${lang === 'en' ? 'en_US' : 'zh_CN'}">`, `<meta property="og:type" content="${type}">`, `<meta property="og:site_name" content="Variant Design">`,
    `<meta property="og:title" content="${escape(title)}">`, `<meta property="og:description" content="${escape(description)}">`, `<meta property="og:url" content="${escape(url)}">`,
    `<meta property="og:image" content="${escape(site + image.src)}">`, `<meta property="og:image:width" content="${image.width}">`, `<meta property="og:image:height" content="${image.height}">`, `<meta property="og:image:alt" content="${escape(image.alt)}">`,
    `<meta name="twitter:card" content="summary_large_image">`, `<meta name="twitter:image" content="${escape(site + image.src)}">`,
    `<link rel="alternate" type="application/rss+xml" title="Variant Design 灵感与方向库" href="${site}/feed.xml">`,
    ...(data ? [`<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', ...data }).replace(/</g, '\\u003c')}</script>`] : [])].join('\n    ');
  const html = template
    .replace(/<html[^>]*>/, () => `<html lang="${lang === 'en' ? 'en' : 'zh-CN'}">`)
    .replace(/<title>[\s\S]*?<\/title>/, () => `<title>${escape(title)}</title>`)
    .replace(/<meta\s+name="description"\s+content="[^"]*"\s*\/?>/, () => `<meta name="description" content="${escape(description)}" />`)
    .replace('</head>', () => `    ${meta}\n  </head>`)
    .replace('<div id="root"></div>', () => `<div id="root">${body}</div>`);
  if (!html.includes(`<title>${escape(title)}</title>`) || !html.includes(`content="${escape(description)}"`)) throw new Error(`Could not place metadata for ${route}`);
  return unlisted.has(route) ? withNoindex(html) : html;
}

// Structured data for a reference page: where it sits (BreadcrumbList) and what it is (CreativeWork pointing at its source).
export function referenceData(r, site, lang, sections) {
  const en = lang === 'en', section = sections.find(c => c.id === sectionModule.sectionOf(r)), url = site + pathIn(`/inspiration/${r.id}`, lang);
  return { '@graph': [
    { '@type': 'BreadcrumbList', itemListElement: [[en ? 'Inspiration' : '灵感', site + pathIn('/', lang)], [section?.title[lang], site + pathIn(`/browse/${section?.id}`, lang)], [r.name, url]].filter(([n]) => n).map(([name, item], i) => ({ '@type': 'ListItem', position: i + 1, name, item })) },
    { '@type': 'CreativeWork', name: r.name, description: `${r.focus[lang]}`, url, inLanguage: en ? 'en' : 'zh-CN', keywords: r.tag, dateModified: r.checkedAt, isBasedOn: r.url, isPartOf: { '@id': `${site}/#website` } }] };
}
export function listData(section, references, site, lang) {
  const en = lang === 'en', url = site + pathIn(`/browse/${section.id}`, lang), items = references.filter(r => sectionModule.sectionOf(r) === section.id);
  return { '@type': 'CollectionPage', name: section.title[lang], description: section.intro[lang], url, inLanguage: en ? 'en' : 'zh-CN', mainEntity: { '@type': 'ItemList', numberOfItems: items.length, itemListElement: items.map((r, i) => ({ '@type': 'ListItem', position: i + 1, url: site + pathIn(`/inspiration/${r.id}`, lang), name: r.name })) } };
}
// A collection page: where it sits (BreadcrumbList) and what it lists (CollectionPage with an ItemList of reference pages).
export function collectionData(c, names, site, lang) {
  const en = lang === 'en', url = site + pathIn(`/collections/${c.slug}`, lang);
  return { '@graph': [
    { '@type': 'BreadcrumbList', itemListElement: [[en ? 'Inspiration' : '灵感', site + pathIn('/', lang)], [en ? 'Design collections' : '设计合集', site + pathIn('/collections', lang)], [c.title[lang], url]].map(([name, item], i) => ({ '@type': 'ListItem', position: i + 1, name, item })) },
    { '@type': 'CollectionPage', name: c.title[lang], description: c.intro[lang], url, inLanguage: en ? 'en' : 'zh-CN', isPartOf: { '@id': `${site}/#website` },
      mainEntity: { '@type': 'ItemList', numberOfItems: c.items.length, itemListElement: c.items.map((id, i) => ({ '@type': 'ListItem', position: i + 1, url: site + pathIn(`/inspiration/${id}`, lang), name: names.get(id) ?? id })) } }] };
}
export function collectionIndexData(list, site, lang) {
  const en = lang === 'en';
  return { '@type': 'CollectionPage', name: en ? 'Design collections' : '设计合集', url: site + pathIn('/collections', lang), inLanguage: en ? 'en' : 'zh-CN',
    mainEntity: { '@type': 'ItemList', numberOfItems: list.length, itemListElement: list.map((c, i) => ({ '@type': 'ListItem', position: i + 1, url: site + pathIn(`/collections/${c.slug}`, lang), name: c.title[lang] })) } };
}
export function renderSite(entries, template, site = defaultSite, references = [], { docs, version = '', guides = [], rendered = {}, english = {}, withdrawn = [], sections = [], collections = [] } = {}) {
  const sorted = order(entries), pages = new Map();
  const zhPage = options => page(template, { site, translated: !!english[options.route], ...options });
  const enPage = options => { if (english[options.route]) pages.set(enKey(options.route), page(template, { site, lang: 'en', translated: true, body: english[options.route], ...options })); };
  const library = 'Variant Design 方向库';
  const homeTitle = 'Variant Design — AI 时代最好的设计灵感', homeDescription = `精选网站、界面和动效作品，每条都附出处和我们写的笔记：研究什么、用在哪里。目前 ${onHome(references).length} 条。`;
  pages.set('/', zhPage({ route: '/', data: { '@type': 'WebSite', '@id': `${site}/#website`, url: `${site}/zh`, name: 'Variant Design', description: homeDescription, inLanguage: ['zh-CN', 'en'] }, title: homeTitle, description: homeDescription, body: rendered['/'] ?? '' }));
  // One page per section: its own address, title, description and only its own references.
  for (const c of sections) pages.set(`/browse/${c.id}`, zhPage({ route: `/browse/${c.id}`, title: `${c.title.zh} — Variant Design`, description: `${c.intro.zh}目前 ${c.count.zh} 条。`, body: rendered[`/browse/${c.id}`] ?? '', data: listData(c, references, site, 'zh') }));
  pages.set('/cases', zhPage({ route: '/cases', title: `A/B/C 案例 — ${library}`, description: '同一个任务的三个方向：每个方向说明优化什么、牺牲什么、适合什么场景。技能产出和概念作品分别标注。', body: rendered['/cases'] ?? '' }));
  for (const category of [...new Set(sorted.map(e => e.category))]) {
    const name = categoryNames[category] ?? category, list = sorted.filter(e => e.category === category);
    pages.set(`/c/${category}`, zhPage({ route: `/c/${category}`, title: `${name} — ${library}`, description: `${name}：${list.length} 件作品，每件包含同一个任务的三个方向。`, body: `<main><h1>${escape(name)}</h1>${list.map(card).join('')}</main>` }));
  }
  for (const e of sorted) {
    const { image } = cover(e);
    pages.set(`/d/${e.slug}`, zhPage({ route: `/d/${e.slug}`, type: 'article', data: { '@type': 'CreativeWork', name: e.title[0], alternateName: e.title[1], description: e.summary[0], datePublished: e.publishedAt, url: `${site}/zh/d/${e.slug}`, image: site + `/media/${e.slug}/${image.file}`, isPartOf: { '@id': `${site}/#website` } }, title: `${e.title[0]} — ${library}`, description: e.summary[0],
      image: { src: `/media/${e.slug}/${image.file}`, width: image.width, height: image.height, alt: image.alt[0] }, body: entryBody(e) }));
  }
  for (const r of references) pages.set(`/inspiration/${r.id}`, zhPage({ route: `/inspiration/${r.id}`, title: sectionModule.detailTitle(r, 'zh'), description: `${r.name}：${r.focus.zh}。用在${r.application.zh}。`, body: rendered[`/inspiration/${r.id}`]??referenceBody(r, references, sections), data: referenceData(r, site, 'zh', sections) }));
  for (const [route, [title, description]] of Object.entries(staticPages)) pages.set(route, zhPage({ route, title, description, body: rendered[route] ?? '', ...(route === '/docs/install' && docs ? { body: docsBody(docs), data: docsData(docs, site) } : {}), ...(route === '/skills' ? { data: skillData(site, version) } : {}) }));
  const guideImage = (g, lang) => g.image ? { src: g.image.src, width: g.image.width, height: g.image.height, alt: g.image.alt[lang] } : undefined;
  for (const g of guides) pages.set(guideRoute(g), zhPage({ route: guideRoute(g), type: 'article', title: `${g.title.zh} — Variant Design`, description: g.answer.zh, data: guideData(g, site), image: guideImage(g, 'zh'), body: rendered[guideRoute(g)] ?? '' }));
  // Collections: only what this build publishes is passed in; one that is not ready yet (a preview build) is noindex.
  const names = new Map(references.map(r => [r.id, r.name])), anyReady = collections.some(c => c.ready);
  const collectionPage = (lang, route, title, description, data, ready) => { const options = { site, route, lang, title, description, data, translated: !!english[route], body: (lang === 'en' ? english : rendered)[route] ?? '' };
    if (lang === 'en' && !english[route]) return; const html = page(template, options); pages.set(lang === 'en' ? enKey(route) : route, ready ? html : withNoindex(html)); };
  if (collections.length) for (const lang of ['zh', 'en']) {
    collectionPage(lang, '/collections', lang === 'en' ? 'Design collections — Variant Design' : '设计合集 — Variant Design', lang === 'en' ? 'References grouped by industry, page pattern, interaction technique and visual style, each with its source and our notes.' : '按行业、页面模式、交互技法和视觉风格整理的参考合集，每一条都附出处和我们的笔记。', collectionIndexData(collections, site, lang), anyReady);
    for (const c of collections) collectionPage(lang, `/collections/${c.slug}`, `${c.title[lang]} — Variant Design`, c.intro[lang], collectionData(c, names, site, lang), c.ready);
  }

  // English exists only where it rendered in full; a page without it stays Chinese-only and unlisted in hreflang.
  const enLibrary = 'Variant Design direction library', enCategories = { landing: 'Landing pages', product: 'Product UI', data: 'Data', brand: 'Brand', component: 'Components' };
  const englishReferences=references.filter(r=>english[`/inspiration/${r.id}`]);
  const enHomeDescription = `Curated websites, interfaces and motion work, each with its source and our own notes on what to study and where to use it. ${englishReferences.length} so far.`;
  enPage({ route: '/', title: 'Variant Design — The best design inspiration in the AI era', description: enHomeDescription, data: { '@type': 'WebSite', '@id': `${site}/#website`, url: `${site}/`, name: 'Variant Design', description: enHomeDescription, inLanguage: ['zh-CN', 'en'] } });
  enPage({ route: '/cases', title: `A/B/C cases — ${enLibrary}`, description: 'Three directions for one brief: what each optimizes, what it gives up and where it fits. Skill outputs and concept studies are labeled separately.' });
  for (const category of new Set(sorted.map(e => e.category))) { const name = enCategories[category] ?? category, count = sorted.filter(e => e.category === category).length; enPage({ route: `/c/${category}`, title: `${name} — ${enLibrary}`, description: `${name}: ${count} ${count === 1 ? 'entry' : 'entries'}, each with three directions for the same brief.` }); }
  for (const e of sorted) { const { image } = cover(e); enPage({ route: `/d/${e.slug}`, type: 'article', title: `${e.title[1]} — ${enLibrary}`, description: e.summary[1], image: { src: `/media/${e.slug}/${image.file}`, width: image.width, height: image.height, alt: image.alt[1] },
    data: { '@type': 'CreativeWork', name: e.title[1], description: e.summary[1], datePublished: e.publishedAt, url: `${site}/d/${e.slug}`, image: site + `/media/${e.slug}/${image.file}`, isPartOf: { '@id': `${site}/#website` } } }); }
  for (const r of references) enPage({ route: `/inspiration/${r.id}`, title: sectionModule.detailTitle(r, 'en'), description: `${r.name}: ${r.focus.en}. Use it for ${r.application.en}.`, data: referenceData(r, site, 'en', sections) });
  for (const c of sections) enPage({ route: `/browse/${c.id}`, title: `${c.title.en} — Variant Design`, description: `${c.intro.en} ${c.count.en} so far.`, data: listData(c, englishReferences, site, 'en') });
  for (const [route, [title, description]] of Object.entries(staticPagesEn(onHome(references).length))) enPage({ route, title, description, ...(route === '/docs/install' && docs ? { data: docsData(docs, site, 'en') } : {}), ...(route === '/skills' ? { data: skillData(site, version, 'en') } : {}) });
  for (const g of guides) enPage({ route: guideRoute(g), type: 'article', title: `${g.title.en} — Variant Design`, description: g.answer.en, data: guideData(g, site, 'en'), image: guideImage(g, 'en') });
  for(const r of withdrawn)for(const lang of ['zh','en']){const en=lang==='en',route=`/inspiration/${r.id}`,title=en?'This work has been removed':'这条作品已撤下';const body=(en?english[route]:rendered[route])??`<main><h1>${title}</h1><p>${escape(r.name)}</p><p>${escape(r.withdrawnAt)}</p><p>${escape(r.reason[lang])}</p><a href="${en?'/':'/zh'}">${en?'Back to inspiration':'返回灵感作品流'}</a></main>`;pages.set(lang==='en'?enKey(route):route,withNoindex(page(template,{site,route,lang,translated:true,title:`${r.name} — ${title} — Variant Design`,description:r.reason[lang],body}))) }
  // Public addresses: English unprefixed, Chinese under /zh. A route with no English page keeps its address and shows the Chinese
  // copy there (the app falls back the same way), marked noindex because its canonical is the /zh page.
  const out = new Map();
  for (const [key, html] of pages) if (key === '/en' || key.startsWith('/en/')) out.set(key === '/en' ? '/' : key.slice(3), html);
  for (const [key, html] of pages) {
    if (key === '/en' || key.startsWith('/en/')) continue;
    if (oneAddress.test(key)) { out.set(key, html); continue; }
    if (!out.has(key)) out.set(key, withNoindex(html));
    out.set(pathIn(key, 'zh'), html);
  }
  return out;
}

// llms.txt (https://llmstxt.org): what the project is and where the answers live, in English for AI search.
export function llms(entries, docs, site = defaultSite, references = [], guides = []) {
  const cases = order(entries).map(e => `- [${e.title[1]}](${site}/d/${e.slug}): ${e.summary[1]}`).join('\n');
  const list = base => guides.filter(g => (g.base ?? '/guides') === base).map(g => `- [${g.title.en}](${site}/en${guideRoute(g)}): ${g.answer.en}`).join('\n');
  const answers = list('/guides'), articles = list('/docs');
  return `# Variant Design

> Variant Design is a bilingual (Chinese/English) design inspiration site: curated websites, interfaces and motion work, each with its source, the date it was checked and our own notes on what to study and where to use it. It also publishes variant-design, an open-source agent skill for Codex and Claude Code that turns one design brief into three distinct, comparable directions (A/B/C) inside your own project, with scoped edits, snapshot undo and an integration step you can roll back. A/B/C cases from real skill runs are listed with their output records.

- Install for Codex: \`${docs.installCommand}\`
- Install for Claude Code: \`${docs.clone(docs.agents.find(a => a.id === 'claude').path)}\`
- Or, inside a project: \`npx skills add YuqingNicole/variant-design-skill -a codex\` (or \`-a claude-code\`).
- Requires Git and Node.js 22+. Your agent supplies model access for this local skill. Hosted Pro and Team plans are proposals, not available subscriptions. MIT licensed, with third-party exceptions listed in NOTICE.
- Editing a direction does not select it: only an explicit \`pick B\` records the final choice. Output goes to \`variant-output/\` in your project.
- Or, as a Claude Code plugin from this repository's own marketplace: \`claude plugin marketplace add YuqingNicole/variant-design-skill\`, then \`claude plugin install variant-design@variant-design\` (checked with Claude Code 2.1.316). It is not listed in any third-party plugin directory yet.

## For agents using this skill

- Use it when the user wants several design directions for one task in their own code project, wants to refine or undo one direction, or wants a chosen direction integrated with a way back. For a single quick UI tweak, ordinary editing is enough.
- Say so in a prompt: "Use the Variant Design skill to create three directions A/B/C for this page, keeping the existing brand." The installed \`SKILL.md\` routes to the right workflow; read files when a step needs them, not all at once.
- Shorthand the user may send: \`compare\`, \`B vary subtle — hero\`, \`Mix A + B\`, \`undo B\`, \`pick B\`, \`react B\`. Editing a direction never selects it; only an explicit pick does.
- Bundled helpers run from the installed skill, not the user's project: \`node <skill-root>/scripts/...\` with Node.js 22+. Working files go in the project's \`.variant-work/\`, which must not be committed.
- Do not claim what did not run: no WCAG compliance, cross-browser support or quality score from inspection alone, no snapshots or preview checks when Node.js is missing, and no browser check without a browser. There is no force flag for undo or rollback. When undo refuses, use \`recover\` and reconcile into a new candidate; when rollback refuses, it names the files edited since integration, so tell the user rather than restoring them by hand.

## Docs

- [Docs home](${site}/docs): articles on making good interfaces with AI, and the install guide.
- [Install and get started](${site}/docs/install): prerequisites, install and verify, the first A/B/C run, compare/refine/undo commands, picking and integrating, FAQ.
- [Repository and README](${repository}): source, skill files and helper scripts.
${articles ? `${articles}\n` : ''}
${answers ? `## Guides\n\n${answers}\n\n` : ''}${cases ? `## Cases\n\n${cases}\n\n` : ''}## Library

- [Design inspiration](${site}/): ${onHome(references).length} curated external references, each with our own notes on what to study and where to use it, the source and the date it was checked.
- [Design skills](${site}/skills): design delivery skills that were run in a throwaway project, with public records.

## Optional

- [Install steps written for an agent to follow](${site}/install/agent.md)
- [Full install guide as text](${site}/llms-full.txt)
- [RSS feed of references and cases](${site}/feed.xml)
`;
}
// /install/agent.md: the install steps written for an agent to follow, built from the same data as the guide so the commands cannot drift.
// It asks the agent to confirm scope with the user and to report what it did and did not check.
export function agentInstall(docs, site = defaultSite) {
  const paths = docs.agents.map(a => `- ${a.label || 'Another agent (use that agent\'s own skills folder, or this path)'}: \`${a.path}\``).join('\n');
  const fresh = docs.clone('<path>');
  return `# Install Variant Design (instructions for an agent)

You are an AI coding agent and your user asked you to install the Variant Design skill. Follow these steps in order. Stop and tell the user if a step fails; do not work around a failure by guessing.

## 0. Know what you are installing

Variant Design turns one design brief into three comparable directions (A/B/C) in the user's own project. It is a folder of instructions plus Node.js helper scripts, MIT licensed. Install the **complete repository**: \`SKILL.md\` alone is not enough because it routes to sub-skills and scripts. Source: ${repository}

## 1. Check the machine

Run \`git --version\` and \`node --version\`. Node.js must be v22 or later. If either is missing or too old, tell the user what is missing and ask before installing anything; do not use sudo and do not install Node.js on your own. Without Node.js the skill can still suggest designs, but its snapshots and previews will not run, so say that plainly.

## 2. Ask where to install

Ask the user one question unless they already answered: user-level (every project) or this project only. Use the skills folder of the agent you are running in. Default paths from the install guide:

${paths}

If the target folder already exists, do not overwrite it. Ask the user, and if they want to update, run \`git -C <path> pull --ff-only\`.

## 3. Install

For a user-level install, clone into the chosen path:

\`\`\`
${fresh}
\`\`\`

For a project-only install, the skills CLI works: \`npx skills add YuqingNicole/variant-design-skill -a codex\` (or \`-a claude-code\`). Tell the user that this CLI reports installs to skills.sh unless \`DISABLE_TELEMETRY=1\` is set, and let them choose.

Claude Code can also install it as a plugin: \`claude plugin marketplace add YuqingNicole/variant-design-skill\`, then \`claude plugin install variant-design@variant-design\`.

## 4. Check it

\`\`\`
node --version
cat <path>/VERSION
\`\`\`

Confirm that \`<path>/SKILL.md\`, \`<path>/skills\`, \`<path>/references\` and \`<path>/scripts\` exist.

## 5. Tell the user

Say which path you installed to, the version in \`VERSION\`, and which of the checks above you actually ran. Tell them to open a new agent session, because most agents only load skills at start. Suggest this first prompt: "Use the Variant Design skill to create three directions A/B/C for this page, keeping the existing brand."

## Rules

- Change nothing outside the install folder. Do not edit the user's project during installation.
- Do not claim that the skill is active until you have checked the files; a new session is needed to see it in the agent's skill list.
- Output of later runs goes to \`variant-output/\` in the project, and working files to \`.variant-work/\`, which should not be committed.

Full guide: ${site}/docs/install · Guide as text: ${site}/llms-full.txt · Project summary: ${site}/llms.txt
`;
}
// The whole install guide as Markdown, English then Chinese.
export function llmsFull(entries, docs, site = defaultSite, references = [], guides = []) {
  const guide = lang => {
    const x = k => docs.text[k][lang], list = rows => rows.map(r => `- ${r[lang]}`).join('\n'), code = c => '```\n' + c + '\n```';
    const commands = rows => rows.map(([c, t]) => `- \`${typeof c === 'string' ? c : c[lang]}\`: ${t[lang]}`).join('\n');
    return [`# ${lang === 'en' ? 'Install and get started' : '安装与开始使用'}`, `## ${x('before')}`, list(docs.prerequisites), `## ${x('install')}`, x('installIntro'),
      ...docs.agents.flatMap(a => [`### ${a.label || (lang === 'en' ? 'Other agents' : '其他 Agent')}`, code(a.id === 'codex' ? docs.installCommand : docs.clone(a.path)), a.note[lang]]),
      `### ${x('confirm')}`, x('confirmNode'), ...docs.agents.map(a => code(docs.verify(a.path, lang === 'zh'))), x('confirmPrompt'), code(docs.prompts.check[lang]),
      `## ${x('firstProject')}`, x('firstIntro'), code(docs.prompts.first[lang]), `### ${x('outcomes')}`, list(docs.outcomes),
      `## ${x('refine')}`, x('refineIntro'), commands(docs.refine), `## ${x('deliver')}`, commands(docs.deliver), docs.systemChecks[lang], x('integrate'), code(docs.prompts.integrate[lang]), `### ${x('handoff')}`, list(docs.handoff),
      `## ${x('more')}`, x('moreIntro'), commands(docs.otherUses), `## ${x('faq')}`, ...docs.faq.flatMap(([q, a]) => [`### ${q[lang]}`, a[lang]])].join('\n\n');
  };
  return `${llms(entries, docs, site, references, guides)}\n---\n\n${guide('en')}\n\n---\n\n${guide('zh')}\n`;
}

export const indexableRoutes=pages=>[...pages].filter(([,html])=>!html.includes(noindexTag)).map(([route])=>route);
// Real dates only: a reference is last modified when it was last checked or added, a section or the home page when its newest
// reference was, and entries and guides by their publish date. Pages without a recorded date get no <lastmod> rather than the build time.
export function lastModified({ references = [], entries = [], guides = [], sectionOf = () => '' } = {}) {
  const day = v => String(v ?? '').slice(0, 10), valid = v => /^\d{4}-\d{2}-\d{2}$/.test(v), newest = list => list.filter(valid).sort().at(-1);
  const dates = {}, bySection = {};
  for (const r of references) {
    const d = newest([day(r.checkedAt), day(r.addedAt)]); if (!d) continue;
    dates[`/inspiration/${r.id}`] = d;
    const id = sectionOf(r); (bySection[id] ??= []).push(d);
  }
  for (const [id, list] of Object.entries(bySection)) if (id) dates[`/browse/${id}`] = newest(list);
  const all = newest(Object.values(bySection).flat()); if (all) dates['/'] = all;
  for (const e of entries) if (valid(e.publishedAt)) dates[`/d/${e.slug}`] = e.publishedAt;
  for (const g of guides) if (valid(g.publishedAt)) dates[guideRoute(g)] = g.publishedAt;
  const docsDate = newest(guides.filter(g => g.base === '/docs').map(g => g.publishedAt)); if (docsDate) dates['/docs'] = docsDate;
  return dates;
}
// Crawlers that collect pages to train models are refused. Search engines and the assistants that fetch a page for
// a person (OAI-SearchBot, ChatGPT-User, Claude-SearchBot, Claude-User, PerplexityBot, ...) stay allowed, so llms.txt and
// the GEO work in docs/research/2026-11-02-geo-strategy.md keep their purpose. robots.txt is a request, not enforcement.
export const aiTrainingCrawlers = ['GPTBot', 'ClaudeBot', 'anthropic-ai', 'Claude-Web', 'CCBot', 'Google-Extended', 'Applebot-Extended', 'Bytespider', 'Amazonbot', 'meta-externalagent', 'cohere-ai', 'Diffbot', 'omgili', 'omgilibot', 'ImagesiftBot', 'Timpibot'];
export function robots(site) {
  const refused = aiTrainingCrawlers.map(agent => `User-agent: ${agent}\nDisallow: /\n`).join('\n');
  return `# AI training crawlers are refused; search and user-requested AI access is allowed.\nUser-agent: *\nContent-Signal: search=yes, ai-input=yes, ai-train=no\nAllow: /\n\n${refused}\nSitemap: ${site}/sitemap.xml\n`;
}

export function sitemap(routes, site = defaultSite, dates = {}) {
  const listed = [...routes].filter(r => !unlisted.has(r)), known = new Set(listed), abs = r => escape(site + (r === '/' ? '/' : r));
  const baseOf = r => r === '/zh' ? '/' : r.startsWith('/zh/') ? r.slice(3) : r;
  const lastmod = r => { const d = dates[baseOf(r)]; return d ? `<lastmod>${d}</lastmod>` : ''; };
  const versions = r => { const base = baseOf(r), zh = pathIn(base, 'zh');
    if (!known.has(base) || !known.has(zh)) return '';
    return [['zh-CN', zh], ['en', base], ['x-default', base]].map(([tag, target]) => `<xhtml:link rel="alternate" hreflang="${tag}" href="${abs(target)}"/>`).join(''); };
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${listed.map(r => `  <url><loc>${abs(r)}</loc>${lastmod(r)}${versions(r)}</url>`).join('\n')}\n</urlset>\n`;
}

export function rss(entries, site = defaultSite, references = []) {
  const item = (title, link, date, description) => ({ date, xml: `    <item>
      <title>${escape(title)}</title>
      <link>${escape(link)}</link>
      <guid isPermaLink="true">${escape(link)}</guid>
      <pubDate>${new Date(date).toUTCString()}</pubDate>
      <description>${escape(description)}</description>
    </item>` });
  const items = [
    ...entries.map(e => item(e.title[0], `${site}/zh/d/${e.slug}`, `${e.publishedAt}T00:00:00Z`, e.summary[0])),
    ...references.map(r => item(r.name, `${site}/zh/inspiration/${r.id}`, r.addedAt, `${r.focus.zh}。用在${r.application.zh}。`))
  ].sort((a, b) => Date.parse(b.date) - Date.parse(a.date) || a.xml.localeCompare(b.xml)).map(i => i.xml).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">\n  <channel>\n    <title>Variant Design 灵感与方向库</title>\n    <link>${site}/</link>\n    <description>互联网上最好的设计灵感；一个任务，三个方向。</description>\n    <language>zh-CN</language>\n${items}\n  </channel>\n</rss>\n`;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const docs = await importTs(path.join(here, '../src/docs-content.ts'));
  const { guides: answers } = await importTs(path.join(here, '../src/guides-content.ts')), { docsArticles } = await importTs(path.join(here, '../src/docs-articles.ts')), guides = [...answers, ...docsArticles], { renderPages } = await import('../.ssr/ssr-pages.js');
  const { zh: rendered, en: english } = renderPages();
  for (const [route, html] of [...Object.entries(rendered), ...Object.entries(english)]) if (!html.includes('<h1')) throw new Error(`Empty static render for ${route}`);
  const version = fs.readFileSync(path.join(here, '../../VERSION'), 'utf8').trim(), references = loadReferences(), withdrawn=loadWithdrawnReferences();
  const dist = path.resolve(here, '../dist'), site = (process.env.SITE_URL || defaultSite).replace(/\/$/, '');
  const { entries, problems } = loadEntries();
  if (problems.length) { console.error(problems.join('\n')); process.exit(1); }
  const drafts = process.env.VERCEL_ENV === 'production' ? draftRoutes({ guides, entries, references }) : [];
  if (drafts.length) console.log(`Draft English left out of production: ${drafts.join(', ')}`);
  const englishReferences=references.filter(r=>!drafts.includes(`/inspiration/${r.id}`));
  rendered['/']+=referenceIndex(references);english['/']+=referenceIndex(englishReferences,'en');
  const hideCases = process.env.VERCEL_ENV === 'production';
  if (hideCases) console.log('Cases left out of production (src/case-visibility.ts).');
  const listed = { guides: guides.filter(g => !drafts.includes(guideRoute(g))), entries: hideCases ? [] : entries.filter(e => !drafts.includes(`/d/${e.slug}`)) };
  // The untouched shell stays available as app.html: the fallback for routes without their own page.
  const shell = path.join(dist, 'app.html');
  if (!fs.existsSync(shell)) fs.copyFileSync(path.join(dist, 'index.html'), shell);
  // Production publishes only collections with enough reviewed references; previews build them all, noindex (src/collections.ts).
  const { visibleCollections, englishDraftRoutes } = await importTs(path.join(here, '../src/collections.ts')), { readFacets } = await import('./reference-facets.mjs');
  const collections = visibleCollections(readFacets(), references, process.env.VERCEL_ENV !== 'production');
  const collectionDrafts = process.env.VERCEL_ENV === 'production' ? englishDraftRoutes(collections) : [];
  if (collectionDrafts.length) console.log(`Draft English left out of production: ${collectionDrafts.join(', ')}`);
  console.log(`Collections: ${collections.filter(c => c.ready).length} public, ${collections.filter(c => !c.ready).length} preview-only (noindex).`);
  const template = fs.readFileSync(shell, 'utf8').replace(`    ${noindexTag}\n`, ''), pages = renderSite(entries, template, site, references, { docs, version, guides, rendered, english: withoutDrafts(english, [...drafts, ...collectionDrafts]), withdrawn, sections: sectionPages(references, englishReferences), collections });
  if (hideCases) withoutCases(pages);
  for (const [route, html] of pages) {
    const file = route === '/' ? path.join(dist, 'index.html') : path.join(dist, route.slice(1), 'index.html');
    fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, html);
  }
  // The app shell answers every unknown path with 200, and previews and experiments are not landing pages.
  const htmlIn = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(f => f.isDirectory() ? htmlIn(path.join(dir, f.name)) : f.name.endsWith('.html') ? [path.join(dir, f.name)] : []);
  for (const file of [shell, ...htmlIn(path.join(dist, 'variant-output')), ...htmlIn(path.join(dist, 'lab'))]) fs.writeFileSync(file, withNoindex(fs.readFileSync(file, 'utf8')));
  fs.cpSync(path.join(contentRoot, 'media'), path.join(dist, 'media'), { recursive: true });
  fs.mkdirSync(path.join(dist, 'd'), { recursive: true });
  for (const entry of entries) fs.writeFileSync(path.join(dist, 'd', `${entry.slug}.json`), JSON.stringify(toCard(entry, site), null, 2) + '\n');
  fs.writeFileSync(path.join(dist, '404.html'), notFoundPage(template));
  fs.writeFileSync(path.join(dist, 'sitemap.xml'), sitemap(indexableRoutes(pages), site, lastModified({ references, entries: listed.entries, guides: listed.guides, sectionOf: sectionModule.sectionOf })));
  fs.writeFileSync(path.join(dist, 'feed.xml'), rss(hideCases ? [] : entries, site, references));
  fs.writeFileSync(path.join(dist, 'llms.txt'), llms(listed.entries, docs, site, englishReferences, listed.guides));
  fs.mkdirSync(path.join(dist, 'install'), { recursive: true });
  fs.writeFileSync(path.join(dist, 'install', 'agent.md'), agentInstall(docs, site));
  fs.writeFileSync(path.join(dist, 'llms-full.txt'), llmsFull(listed.entries, docs, site, englishReferences, listed.guides));
  fs.writeFileSync(path.join(dist, 'robots.txt'), robots(site));
  console.log(`Prerendered ${pages.size} routes (including reference details) and ${entries.length} direction cards for ${site}; sitemap.xml, feed.xml, llms.txt and robots.txt written.`);
}
