#!/usr/bin/env node
// After `vite build`: write one HTML file per library route with its own title, description,
// canonical link, share card, structured data and readable content, plus sitemap.xml, feed.xml
// (RFC-002 §7) and llms.txt / llms-full.txt for AI search.
// The browser still renders with React; createRoot replaces the static content on load.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { contentRoot, loadEntries, toCard } from './content.mjs';
const here = path.dirname(fileURLToPath(import.meta.url));
const repository = 'https://github.com/YuqingNicole/variant-design-skill';
export const defaultSite = 'https://variant-design-skill.vercel.app';
const categoryNames = { landing: '落地页', product: '产品界面', data: '数据展示', brand: '品牌', component: '组件' };
const kindLabel = e => e.source === 'own' ? (e.kind === 'verified' ? '技能产出 · 已验证' : '概念作品') : e.source === 'permission' ? '授权投稿' : '外部参考';
export const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const cover = e => { const d = e.directions.find(x => x.id === e.recommendation?.variant) ?? e.directions[0]; return { direction: d, image: d.media[0] }; };
const order = entries => [...entries].sort((a, b) => Number(b.featured) - Number(a.featured) || b.publishedAt.localeCompare(a.publishedAt) || a.slug.localeCompare(b.slug));
// Pages outside the library only get their own title and description.
const staticPages = {
  '/about': ['关于 Variant Design', '一份需求，在你的项目里做出三个能运行的方向：任务、数据和功能相同，取舍不同。局部修改先存快照，可以撤回，不会覆盖你没看过的改动。'],
  '/docs': ['安装与开始使用 — Variant Design', '安装技能，确认可用，然后在你的项目里走完一次：生成、比较、试改、撤回、接入。'],
  '/inspiration': ['灵感参考 — Variant Design', '94 个外部设计参考，只附我们自己的分析和原站链接。'],
  '/submit': ['投稿与授权 — Variant Design', 'Variant Design 方向库的收录、授权与撤下规则。'],
  '/pricing': ['价格 — Variant Design', 'Variant Design 的方案与价格。'],
  '/sponsor': ['赞助 — Variant Design', '品牌赞助 Variant Design 的方式与规则：明确标注，与编辑精选分开。'],
  '/lab': ['实验室 — Variant Design', '工作台和画布等实验功能。'],
  '/guides': ['指南 — Variant Design', '用 AI 做界面时常见问题的回答：怎么比较方向、怎么撤回修改、怎么避免千篇一律。'],
  '/changelog': ['更新记录 — Variant Design', 'Variant Design 技能每个版本的改动，来自仓库里的 CHANGELOG.md。'],
  '/skills': ['设计技能 — Variant Design', '只收录在一次性项目里实际跑过、并公开了记录的设计交付技能。'],
};

const staticPagesEn = references => ({
  '/about': ['About Variant Design', 'One brief becomes three runnable directions in your own project: the same task, data and functions, different tradeoffs. Scoped edits are snapshotted first, can be undone and never overwrite changes you have not seen.'],
  '/docs': ['Install & get started — Variant Design', 'Install the skill, confirm it works, then go through one full loop in your project: generate, compare, refine, undo, integrate.'],
  '/inspiration': ['Inspiration — Variant Design', `${references} outside design references, with only our own notes and links to the source.`],
  '/submit': ['Submissions & permissions — Variant Design', 'How the Variant Design direction library handles submissions, permissions and takedowns.'],
  '/sponsor': ['Sponsor Variant Design', 'How brands can sponsor Variant Design: clearly labeled and kept separate from editorial picks.'],
  '/pricing': ['Pricing — Variant Design', 'Variant Design plans and pricing.'],
  '/changelog': ['Changelog — Variant Design', 'What changed in each version of the Variant Design skill, from CHANGELOG.md in the repository.'],
  '/skills': ['Design skills — Variant Design', 'Only design delivery skills we ran in throwaway projects, with public records.'],
  '/guides': ['Guides — Variant Design', 'Answers to common questions about designing interfaces with AI: comparing directions, undoing changes and avoiding generic results.'],
});

// Experiments stay reachable but out of search results (RFC-005 §3.3).
const unlisted = new Set(['/lab']);
const noindexTag = '<meta name="robots" content="noindex">';
export const withNoindex = html => html.includes(noindexTag) ? html : html.replace('</head>', () => `    ${noindexTag}\n  </head>`);

// The reference library lives in a TS module of plain JSON literals; read it without a TS loader.
export function loadReferences() {
  const source = fs.readFileSync(path.join(here, '../src/inspiration-data.ts'), 'utf8'), start = source.indexOf('export const inspirationItems = ');
  const from = source.indexOf('[', start);
  return JSON.parse(source.slice(from, source.indexOf('\n];', from) + 2));
}
// Without JavaScript the inspiration page shows only its first tab; this index links every reference page.
export function referenceIndex(references, lang = 'zh') {
  const en = lang === 'en', href = id => (en ? '/en' : '') + `/inspiration/${id}`;
  return `<nav aria-label="${en ? 'All references' : '全部参考'}"><h2>${en ? `All ${references.length} references` : `全部 ${references.length} 个参考`}</h2><ul>${references.map(r => `<li><a href="${href(escape(r.id))}">${escape(r.name)}</a></li>`).join('')}</ul></nav>`;
}
function referenceBody(r) {
  return `<main><p><a href="/inspiration">灵感参考</a></p><h1>${escape(r.name)}</h1><p>${escape(new URL(r.url).hostname)}</p><dl><dt>研究什么</dt><dd>${escape(r.focus.zh)}</dd><dt>用在哪里</dt><dd>${escape(r.application.zh)}</dd><dt>出处</dt><dd>${escape(r.publisher)} · ${escape(r.checkedAt)}${r.via ? ` · <a href="${escape(r.via)}">经 ${escape(new URL(r.via).hostname)} 发现</a>` : ''}</dd></dl><p><a href="${escape(r.url)}">访问原站</a></p></main>`;
}
// The install guide (src/docs-content.ts) as static HTML, so /docs reads without JavaScript.
function docsBody(d, lang = 'zh') {
  const list = rows => `<ul>${rows.map(r => `<li>${escape(r[lang])}</li>`).join('')}</ul>`, code = c => `<pre><code>${escape(c)}</code></pre>`;
  const commands = rows => `<dl>${rows.map(([c, t]) => `<dt><code>${escape(typeof c === 'string' ? c : c[lang])}</code></dt><dd>${escape(t[lang])}</dd>`).join('')}</dl>`;
  const x = k => escape(d.text[k][lang]);
  return `<main><h1>${lang === 'en' ? 'Install and get started' : '安装与开始使用'}</h1>`
    + `<section id="before"><h2>${x('before')}</h2>${list(d.prerequisites)}</section>`
    + `<section id="install"><h2>${x('install')}</h2><p>${x('installIntro')}</p>${d.agents.map(a => `<h3>${escape(a.label || (lang === 'en' ? 'Other agents' : '其他 Agent'))}</h3>${code(a.id === 'codex' ? d.installCommand : d.clone(a.path))}<p>${escape(a.note[lang])}</p>`).join('')}`
    + `<h3>${x('confirm')}</h3><p>${x('confirmNode')}</p>${d.agents.map(a => code(d.verify(a.path, lang === 'zh'))).join('')}<p>${x('confirmPrompt')}</p>${code(d.prompts.check[lang])}</section>`
    + `<section id="first-project"><h2>${x('firstProject')}</h2><p>${x('firstIntro')}</p>${code(d.prompts.first[lang])}<h3>${x('outcomes')}</h3>${list(d.outcomes)}</section>`
    + `<section id="refine"><h2>${x('refine')}</h2><p>${x('refineIntro')}</p>${commands(d.refine)}</section>`
    + `<section id="deliver"><h2>${x('deliver')}</h2>${commands(d.deliver)}<p>${x('integrate')}</p>${code(d.prompts.integrate[lang])}<h3>${x('handoff')}</h3>${list(d.handoff)}</section>`
    + `<section id="more"><h2>${x('more')}</h2><p>${x('moreIntro')}</p>${commands(d.otherUses)}</section>`
    + `<section id="faq"><h2>${x('faq')}</h2>${d.faq.map(([q, a]) => `<h3>${escape(q[lang])}</h3><p>${escape(a[lang])}</p>`).join('')}</section></main>`;
}
const pathIn = (route, lang) => lang === 'en' ? (route === '/' ? '/en' : `/en${route}`) : route;
const skillData = (site, version, lang = 'zh') => ({ '@type': 'SoftwareSourceCode', '@id': `${site}/#skill`, name: 'variant-design', version,
  description: lang === 'en' ? 'Open-source agent skill that turns one design brief into three comparable directions (A/B/C) inside your own project, with scoped edits, snapshot undo and an integration you can roll back. For Codex, Claude Code and other local agents.' : '开源 Agent 技能：在你自己的项目里把一个设计任务做成 A/B/C 三个可比较的方向，支持局部修改、快照撤回和可回滚的接入。适用于 Codex、Claude Code 等本地 Agent。',
  codeRepository: repository, url: site + pathIn('/docs', lang), programmingLanguage: 'JavaScript', runtimePlatform: 'Node.js 22+', license: 'https://opensource.org/licenses/MIT' });
function docsData(d, site, lang = 'zh') {
  const url = site + pathIn('/docs', lang);
  return { '@graph': [
    { '@type': 'HowTo', name: lang === 'en' ? 'Install Variant Design and generate A/B/C directions in your project' : '安装 Variant Design 并在项目里生成 A/B/C 三个方向', url, inLanguage: lang === 'en' ? 'en' : 'zh-CN',
      supply: d.prerequisites.map(p => ({ '@type': 'HowToSupply', name: p[lang] })),
      step: [['install', 'installIntro', d.installCommand], ['confirm', 'confirmPrompt', d.prompts.check[lang]], ['firstProject', 'firstIntro', d.prompts.first[lang]], ['refine', 'refineIntro'], ['deliver', 'integrate', d.prompts.integrate[lang]]]
        .map(([h, p, c], i) => ({ '@type': 'HowToStep', position: i + 1, name: d.text[h][lang], text: [d.text[p][lang], c].filter(Boolean).join('\n'), url: `${url}#${['install', 'install', 'first-project', 'refine', 'deliver'][i]}` })) },
    { '@type': 'FAQPage', mainEntity: d.faq.map(([q, a]) => ({ '@type': 'Question', name: q[lang], acceptedAnswer: { '@type': 'Answer', text: a[lang] } })) }] };
}

function card(e) {
  const { image } = cover(e);
  return `<article><a href="/d/${e.slug}"><img src="/media/${e.slug}/${escape(image.file)}" width="${image.width}" height="${image.height}" alt="${escape(image.alt[0])}"><p>${escape(categoryNames[e.category] ?? e.category)} · ${escape(kindLabel(e))}</p><h2>${escape(e.title[0])}</h2><p>${escape(e.summary[0])}</p></a></article>`;
}
function entryBody(e) {
  const directions = e.directions.map(d => `<section><h2>${d.id} · ${escape(d.name[0])}</h2><img src="/media/${e.slug}/${escape(d.media[0].file)}" width="${d.media[0].width}" height="${d.media[0].height}" alt="${escape(d.media[0].alt[0])}"><dl><dt>优化</dt><dd>${escape(d.comparison.optimizes[0])}</dd><dt>取舍</dt><dd>${escape(d.comparison.tradeoff[0])}</dd><dt>适合</dt><dd>${escape(d.comparison.bestFor[0])}</dd></dl></section>`).join('');
  const recommendation = e.recommendation ? `<aside><h2>推荐 ${e.recommendation.variant}</h2><p>${escape(e.recommendation.reason[0])}</p></aside>` : '';
  return `<main><p><a href="/">作品</a> / <a href="/c/${e.category}">${escape(categoryNames[e.category] ?? e.category)}</a></p><h1>${escape(e.title[0])}</h1><p>${escape(e.summary[0])}</p><p>${escape(kindLabel(e))} · ${escape(e.credit.name)} · ${e.publishedAt}</p><p>任务：${escape(e.brief[0])}</p>${directions}${recommendation}</main>`;
}

function guideData(g, site, lang = 'zh') {
  return { '@type': 'Article', headline: g.title[lang], description: g.answer[lang], datePublished: g.publishedAt, inLanguage: lang === 'en' ? 'en' : 'zh-CN', url: site + pathIn(`/guides/${g.slug}`, lang), author: { '@type': 'Person', name: 'Yuqing Nicole' }, about: { '@id': `${site}/#skill` } };
}

function page(template, { site, route, title, description, image, type = 'website', body = '', data, lang = 'zh', translated = false }) {
  const url = site + pathIn(route, lang);
  // Every version names all versions including itself; x-default is the unprefixed address (RFC-005 §3.4).
  const versions = translated ? [['zh-CN', 'zh'], ['en', 'en'], ['x-default', 'zh']].map(([tag, l]) => `<link rel="alternate" hreflang="${tag}" href="${escape(site + pathIn(route, l))}">`) : [];
  const meta = [`<link rel="canonical" href="${escape(url)}">`, ...versions, `<meta property="og:locale" content="${lang === 'en' ? 'en_US' : 'zh_CN'}">`, `<meta property="og:type" content="${type}">`, `<meta property="og:site_name" content="Variant Design">`,
    `<meta property="og:title" content="${escape(title)}">`, `<meta property="og:description" content="${escape(description)}">`, `<meta property="og:url" content="${escape(url)}">`,
    ...(image ? [`<meta property="og:image" content="${escape(site + image.src)}">`, `<meta property="og:image:width" content="${image.width}">`, `<meta property="og:image:height" content="${image.height}">`, `<meta property="og:image:alt" content="${escape(image.alt)}">`] : []),
    `<meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}">`,
    `<link rel="alternate" type="application/rss+xml" title="Variant Design 方向库" href="${site}/feed.xml">`,
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

export function renderSite(entries, template, site = defaultSite, references = [], { docs, version = '', guides = [], rendered = {}, english = {} } = {}) {
  const sorted = order(entries), pages = new Map();
  const zhPage = options => page(template, { site, translated: !!english[options.route], ...options });
  const enPage = options => { if (english[options.route]) pages.set(pathIn(options.route, 'en'), page(template, { site, lang: 'en', translated: true, body: english[options.route], ...options })); };
  const library = 'Variant Design 方向库';
  pages.set('/', zhPage({ route: '/', data: { '@graph': [{ '@type': 'WebSite', '@id': `${site}/#website`, url: `${site}/`, name: 'Variant Design', inLanguage: ['zh-CN', 'en'] }, skillData(site, version)] }, title: 'Variant Design — 设计导航，只收核对过的', description: '给用 AI 做产品的人：精选外部参考、实测过的设计技能和真实的 A/B/C 案例。参考写明来源、核对日期和还不知道的事，技能附实测记录，案例附产出记录。', body: `<main><h1>设计导航，只收核对过的。</h1><p>给用 AI 做产品的人：精选外部参考、实测过的设计技能和真实的 A/B/C 案例。参考写明来源、核对日期和还不知道的事，技能附实测记录，案例附产出记录。</p><nav><a href="/inspiration">浏览设计参考</a> · <a href="/skills">设计技能</a> · <a href="#works">A/B/C 案例</a> · <a href="/docs">安装与使用</a></nav><section><h2>精选技能：variant-design</h2><p>把一个任务做成 A/B/C 三个可比较的方向，支持局部修改、快照撤回和可回滚的接入。</p><a href="/d/pulse">查看 Pulse 案例与产出记录</a></section><section id="works"><h2>一个任务，三种方向。</h2>${sorted.map(card).join('')}</section></main>` }));
  for (const category of [...new Set(sorted.map(e => e.category))]) {
    const name = categoryNames[category] ?? category, list = sorted.filter(e => e.category === category);
    pages.set(`/c/${category}`, zhPage({ route: `/c/${category}`, title: `${name} — ${library}`, description: `${name}：${list.length} 件作品，每件包含同一个任务的三个方向。`, body: `<main><h1>${escape(name)}</h1>${list.map(card).join('')}</main>` }));
  }
  for (const e of sorted) {
    const { image } = cover(e);
    pages.set(`/d/${e.slug}`, zhPage({ route: `/d/${e.slug}`, type: 'article', data: { '@type': 'CreativeWork', name: e.title[0], alternateName: e.title[1], description: e.summary[0], datePublished: e.publishedAt, url: `${site}/d/${e.slug}`, image: site + `/media/${e.slug}/${image.file}`, isPartOf: { '@id': `${site}/#website` } }, title: `${e.title[0]} — ${library}`, description: e.summary[0],
      image: { src: `/media/${e.slug}/${image.file}`, width: image.width, height: image.height, alt: image.alt[0] }, body: entryBody(e) }));
  }
  for (const r of references) pages.set(`/inspiration/${r.id}`, zhPage({ route: `/inspiration/${r.id}`, title: `${r.name} — 灵感参考 — Variant Design`, description: `${r.name}：${r.focus.zh}。用在${r.application.zh}。`, body: referenceBody(r) }));
  for (const [route, [title, description]] of Object.entries(staticPages)) pages.set(route, zhPage({ route, title, description, body: rendered[route] ?? '', ...(route === '/docs' && docs ? { body: docsBody(docs), data: docsData(docs, site) } : {}) }));
  for (const g of guides) pages.set(`/guides/${g.slug}`, zhPage({ route: `/guides/${g.slug}`, type: 'article', title: `${g.title.zh} — Variant Design`, description: g.answer.zh, data: guideData(g, site), body: rendered[`/guides/${g.slug}`] ?? '' }));

  // English exists only where it rendered in full; a page without it stays Chinese-only and unlisted in hreflang.
  const enLibrary = 'Variant Design direction library', enCategories = { landing: 'Landing pages', product: 'Product UI', data: 'Data', brand: 'Brand', component: 'Components' };
  enPage({ route: '/', title: 'Variant Design — a design guide, checked before it’s listed', description: 'For people building products with AI: curated outside references, tried design skills and real A/B/C cases, each with its source, check date and what is still unknown.', data: { '@graph': [{ '@type': 'WebSite', '@id': `${site}/#website`, url: `${site}/en`, name: 'Variant Design', inLanguage: ['zh-CN', 'en'] }, skillData(site, version, 'en')] } });
  for (const category of new Set(sorted.map(e => e.category))) { const name = enCategories[category] ?? category, count = sorted.filter(e => e.category === category).length; enPage({ route: `/c/${category}`, title: `${name} — ${enLibrary}`, description: `${name}: ${count} ${count === 1 ? 'entry' : 'entries'}, each with three directions for the same brief.` }); }
  for (const e of sorted) { const { image } = cover(e); enPage({ route: `/d/${e.slug}`, type: 'article', title: `${e.title[1]} — ${enLibrary}`, description: e.summary[1], image: { src: `/media/${e.slug}/${image.file}`, width: image.width, height: image.height, alt: image.alt[1] },
    data: { '@type': 'CreativeWork', name: e.title[1], description: e.summary[1], datePublished: e.publishedAt, url: `${site}/en/d/${e.slug}`, image: site + `/media/${e.slug}/${image.file}`, isPartOf: { '@id': `${site}/#website` } } }); }
  for (const r of references) enPage({ route: `/inspiration/${r.id}`, title: `${r.name} — Inspiration — Variant Design`, description: `${r.name}: ${r.focus.en}. Use it for ${r.application.en}.` });
  for (const [route, [title, description]] of Object.entries(staticPagesEn(references.length))) enPage({ route, title, description, ...(route === '/docs' && docs ? { data: docsData(docs, site, 'en') } : {}) });
  for (const g of guides) enPage({ route: `/guides/${g.slug}`, type: 'article', title: `${g.title.en} — Variant Design`, description: g.answer.en, data: guideData(g, site, 'en') });
  return pages;
}

// llms.txt (https://llmstxt.org): what the project is and where the answers live, in English for AI search.
export function llms(entries, docs, site = defaultSite, references = [], guides = []) {
  const cases = order(entries).map(e => `- [${e.title[1]}](${site}/en/d/${e.slug}): ${e.summary[1]}`).join('\n');
  const answers = guides.map(g => `- [${g.title.en}](${site}/en/guides/${g.slug}): ${g.answer.en}`).join('\n');
  return `# Variant Design

> Variant Design is an open-source agent skill for Codex and Claude Code that turns one design brief into three distinct, comparable directions (A/B/C) inside your own project, with scoped edits, snapshot undo and an integration step you can roll back. Its website is a bilingual (Chinese/English) design navigation site: curated external references with sources and check dates, design skills that were actually run, and real A/B/C cases with their output records.

- Install for Codex: \`${docs.installCommand}\`
- Install for Claude Code: \`${docs.clone(docs.agents.find(a => a.id === 'claude').path)}\`
- Or, inside a project: \`npx skills add YuqingNicole/variant-design-skill -a codex\` (or \`-a claude-code\`).
- Requires Git and Node.js 22+. Your agent supplies the model; there is no hosted service. MIT licensed.
- Editing a direction does not select it: only an explicit \`pick B\` records the final choice. Output goes to \`variant-output/\` in your project.
- Or, as a Claude Code plugin from this repository's own marketplace: \`claude plugin marketplace add YuqingNicole/variant-design-skill\`, then \`claude plugin install variant-design@variant-design\` (checked with Claude Code 2.1.316). It is not listed in any third-party plugin directory yet.

## For agents using this skill

- Use it when the user wants several design directions for one task in their own code project, wants to refine or undo one direction, or wants a chosen direction integrated with a way back. For a single quick UI tweak, ordinary editing is enough.
- Say so in a prompt: "Use the Variant Design skill to create three directions A/B/C for this page, keeping the existing brand." The installed \`SKILL.md\` routes to the right workflow; read files when a step needs them, not all at once.
- Shorthand the user may send: \`compare\`, \`B vary subtle — hero\`, \`Mix A + B\`, \`undo B\`, \`pick B\`, \`react B\`. Editing a direction never selects it; only an explicit pick does.
- Bundled helpers run from the installed skill, not the user's project: \`node <skill-root>/scripts/...\` with Node.js 22+. Working files go in the project's \`.variant-work/\`, which must not be committed.
- Do not claim what did not run: no WCAG compliance, cross-browser support or quality score from inspection alone, no snapshots or preview checks when Node.js is missing, and no browser check without a browser. There is no force flag for undo or rollback. When undo refuses, use \`recover\` and reconcile into a new candidate; when rollback refuses, it names the files edited since integration, so tell the user rather than restoring them by hand.

## Docs

- [Install and get started](${site}/en/docs): prerequisites, install and verify, the first A/B/C run, compare/refine/undo commands, picking and integrating, FAQ.
- [Repository and README](${repository}): source, skill files and helper scripts.

${answers ? `## Guides\n\n${answers}\n\n` : ''}## Cases

${cases}

## Library

- [Design references](${site}/en/inspiration): ${references.length} curated external references, each with our own notes on what to study and where to use it, the source and the date it was checked.
- [Design skills](${site}/en/skills): design delivery skills that were run in a throwaway project, with public records.

## Optional

- [Full install guide as text](${site}/llms-full.txt)
- [RSS feed of cases](${site}/feed.xml)
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
      `## ${x('refine')}`, x('refineIntro'), commands(docs.refine), `## ${x('deliver')}`, commands(docs.deliver), x('integrate'), code(docs.prompts.integrate[lang]), `### ${x('handoff')}`, list(docs.handoff),
      `## ${x('more')}`, x('moreIntro'), commands(docs.otherUses), `## ${x('faq')}`, ...docs.faq.flatMap(([q, a]) => [`### ${q[lang]}`, a[lang]])].join('\n\n');
  };
  return `${llms(entries, docs, site, references, guides)}\n---\n\n${guide('en')}\n\n---\n\n${guide('zh')}\n`;
}

export function sitemap(routes, site = defaultSite) {
  const listed = [...routes].filter(r => !unlisted.has(r)), known = new Set(listed), abs = r => escape(site + (r === '/' ? '/' : r));
  const versions = r => { const base = r === '/en' ? '/' : r.startsWith('/en/') ? r.slice(3) : r, en = pathIn(base, 'en');
    if (!known.has(base) || !known.has(en)) return '';
    return [['zh-CN', base], ['en', en], ['x-default', base]].map(([tag, target]) => `<xhtml:link rel="alternate" hreflang="${tag}" href="${abs(target)}"/>`).join(''); };
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${listed.map(r => `  <url><loc>${abs(r)}</loc>${versions(r)}</url>`).join('\n')}\n</urlset>\n`;
}

export function rss(entries, site = defaultSite) {
  const items = [...entries].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt) || a.slug.localeCompare(b.slug)).map(e => `    <item>
      <title>${escape(e.title[0])}</title>
      <link>${site}/d/${e.slug}</link>
      <guid isPermaLink="true">${site}/d/${e.slug}</guid>
      <pubDate>${new Date(`${e.publishedAt}T00:00:00Z`).toUTCString()}</pubDate>
      <description>${escape(e.summary[0])}</description>
    </item>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">\n  <channel>\n    <title>Variant Design 方向库</title>\n    <link>${site}/</link>\n    <description>一个任务，三个方向。</description>\n    <language>zh-CN</language>\n${items}\n  </channel>\n</rss>\n`;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const { importTs } = await import('./ts-module.mjs'), docs = await importTs(path.join(here, '../src/docs-content.ts'));
  const { guides } = await importTs(path.join(here, '../src/guides-content.ts')), { renderPages } = await import('../.ssr/ssr-pages.js');
  const { zh: rendered, en: english } = renderPages();
  for (const [route, html] of [...Object.entries(rendered), ...Object.entries(english)]) if (!html.includes('<h1')) throw new Error(`Empty static render for ${route}`);
  const version = fs.readFileSync(path.join(here, '../../VERSION'), 'utf8').trim(), references = loadReferences();
  rendered['/inspiration'] += referenceIndex(references); english['/inspiration'] += referenceIndex(references, 'en');
  const dist = path.resolve(here, '../dist'), site = (process.env.SITE_URL || defaultSite).replace(/\/$/, '');
  const { entries, problems } = loadEntries();
  if (problems.length) { console.error(problems.join('\n')); process.exit(1); }
  // The untouched shell stays available as app.html: the fallback for routes without their own page.
  const shell = path.join(dist, 'app.html');
  if (!fs.existsSync(shell)) fs.copyFileSync(path.join(dist, 'index.html'), shell);
  const template = fs.readFileSync(shell, 'utf8').replace(`    ${noindexTag}\n`, ''), pages = renderSite(entries, template, site, references, { docs, version, guides, rendered, english });
  for (const [route, html] of pages) {
    const file = route === '/' ? path.join(dist, 'index.html') : path.join(dist, route.slice(1), 'index.html');
    fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, html);
  }
  // The app shell answers every unknown path with 200, and previews and experiments are not landing pages.
  const htmlIn = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(f => f.isDirectory() ? htmlIn(path.join(dir, f.name)) : f.name.endsWith('.html') ? [path.join(dir, f.name)] : []);
  for (const file of [shell, ...htmlIn(path.join(dist, 'variant-output')), ...htmlIn(path.join(dist, 'lab'))]) fs.writeFileSync(file, withNoindex(fs.readFileSync(file, 'utf8')));
  fs.cpSync(path.join(contentRoot, 'media'), path.join(dist, 'media'), { recursive: true });
  for (const entry of entries) fs.writeFileSync(path.join(dist, 'd', `${entry.slug}.json`), JSON.stringify(toCard(entry, site), null, 2) + '\n');
  fs.writeFileSync(path.join(dist, 'sitemap.xml'), sitemap(pages.keys(), site));
  fs.writeFileSync(path.join(dist, 'feed.xml'), rss(entries, site));
  fs.writeFileSync(path.join(dist, 'llms.txt'), llms(entries, docs, site, references, guides));
  fs.writeFileSync(path.join(dist, 'llms-full.txt'), llmsFull(entries, docs, site, references, guides));
  fs.writeFileSync(path.join(dist, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${site}/sitemap.xml\n`);
  console.log(`Prerendered ${pages.size} routes (including reference details) and ${entries.length} direction cards for ${site}; sitemap.xml, feed.xml, llms.txt and robots.txt written.`);
}
