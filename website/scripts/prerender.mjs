#!/usr/bin/env node
// After `vite build`: write one HTML file per library route with its own title, description,
// canonical link, share card and readable content, plus sitemap.xml and feed.xml (RFC-002 §7).
// The browser still renders with React; createRoot replaces the static content on load.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { contentRoot, loadEntries, toCard } from './content.mjs';
const here = path.dirname(fileURLToPath(import.meta.url));
export const defaultSite = 'https://variant-design-skill.vercel.app';
const categoryNames = { landing: '落地页', product: '产品界面', data: '数据展示', brand: '品牌', component: '组件' };
const kindLabel = e => e.source === 'own' ? (e.kind === 'verified' ? '技能产出 · 已验证' : '概念作品') : e.source === 'permission' ? '授权投稿' : '外部参考';
export const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const cover = e => { const d = e.directions.find(x => x.id === e.recommendation?.variant) ?? e.directions[0]; return { direction: d, image: d.media[0] }; };
const order = entries => [...entries].sort((a, b) => Number(b.featured) - Number(a.featured) || b.publishedAt.localeCompare(a.publishedAt) || a.slug.localeCompare(b.slug));
// Pages outside the library only get their own title and description.
const staticPages = {
  '/about': ['关于 Variant Design', '一个提示词，生成三种有明确立场的视觉方向。比较、批判、变化，再交付真正值得保留的方案。'],
  '/docs': ['安装与开始使用 — Variant Design', '安装技能，确认可用，然后在你的项目里走完一次：生成、比较、试改、撤回、接入。'],
  '/inspiration': ['灵感参考 — Variant Design', '24 个外部设计参考，只附我们自己的分析和原站链接。'],
  '/submit': ['投稿与授权 — Variant Design', 'Variant Design 方向库的收录、授权与撤下规则。'],
  '/pricing': ['价格 — Variant Design', 'Variant Design 的方案与价格。'],
  '/lab': ['实验室 — Variant Design', '工作台和画布等实验功能。'],
  '/skills': ['设计技能 — Variant Design', '只收录在一次性项目里实际跑过、并公开了记录的设计交付技能。'],
};

function card(e) {
  const { image } = cover(e);
  return `<article><a href="/d/${e.slug}"><img src="/media/${e.slug}/${escape(image.file)}" width="${image.width}" height="${image.height}" alt="${escape(image.alt[0])}"><p>${escape(categoryNames[e.category] ?? e.category)} · ${escape(kindLabel(e))}</p><h2>${escape(e.title[0])}</h2><p>${escape(e.summary[0])}</p></a></article>`;
}
function entryBody(e) {
  const directions = e.directions.map(d => `<section><h2>${d.id} · ${escape(d.name[0])}</h2><img src="/media/${e.slug}/${escape(d.media[0].file)}" width="${d.media[0].width}" height="${d.media[0].height}" alt="${escape(d.media[0].alt[0])}"><dl><dt>优化</dt><dd>${escape(d.comparison.optimizes[0])}</dd><dt>取舍</dt><dd>${escape(d.comparison.tradeoff[0])}</dd><dt>适合</dt><dd>${escape(d.comparison.bestFor[0])}</dd></dl></section>`).join('');
  const recommendation = e.recommendation ? `<aside><h2>推荐 ${e.recommendation.variant}</h2><p>${escape(e.recommendation.reason[0])}</p></aside>` : '';
  return `<main><p><a href="/">作品</a> / <a href="/c/${e.category}">${escape(categoryNames[e.category] ?? e.category)}</a></p><h1>${escape(e.title[0])}</h1><p>${escape(e.summary[0])}</p><p>${escape(kindLabel(e))} · ${escape(e.credit.name)} · ${e.publishedAt}</p><p>任务：${escape(e.brief[0])}</p>${directions}${recommendation}</main>`;
}

function page(template, { site, route, title, description, image, type = 'website', body = '' }) {
  const url = site + (route === '/' ? '/' : route);
  const meta = [`<link rel="canonical" href="${escape(url)}">`, `<meta property="og:type" content="${type}">`, `<meta property="og:site_name" content="Variant Design">`,
    `<meta property="og:title" content="${escape(title)}">`, `<meta property="og:description" content="${escape(description)}">`, `<meta property="og:url" content="${escape(url)}">`,
    ...(image ? [`<meta property="og:image" content="${escape(site + image.src)}">`, `<meta property="og:image:width" content="${image.width}">`, `<meta property="og:image:height" content="${image.height}">`, `<meta property="og:image:alt" content="${escape(image.alt)}">`] : []),
    `<meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}">`,
    `<link rel="alternate" type="application/rss+xml" title="Variant Design 方向库" href="${site}/feed.xml">`].join('\n    ');
  const html = template
    .replace(/<title>[\s\S]*?<\/title>/, () => `<title>${escape(title)}</title>`)
    .replace(/<meta\s+name="description"\s+content="[^"]*"\s*\/?>/, () => `<meta name="description" content="${escape(description)}" />`)
    .replace('</head>', () => `    ${meta}\n  </head>`)
    .replace('<div id="root"></div>', () => `<div id="root">${body}</div>`);
  if (!html.includes(`<title>${escape(title)}</title>`) || !html.includes(`content="${escape(description)}"`)) throw new Error(`Could not place metadata for ${route}`);
  return html;
}

export function renderSite(entries, template, site = defaultSite) {
  const sorted = order(entries), pages = new Map();
  const library = 'Variant Design 方向库';
  pages.set('/', page(template, { site, route: '/', title: `${library} — 一个任务，三个方向`, description: '找到值得参考的设计，记录你的选择，在自己的项目里探索三种不同方向。', body: `<main><h1>一个任务，三个方向。</h1><p>找到值得参考的设计，记录你的选择，在自己的项目里探索三种不同方向。</p><nav><a href="/inspiration">寻找设计参考</a> · <a href="#works">查看 A/B/C 案例</a> · <a href="/docs">安装与使用</a></nav><section><h2>从喜欢，到做出来。</h2><p>浏览公开来源，记录想借鉴和避免的内容，再在项目里比较 A/B/C。</p><h3>示例：给 SaaS 产品做首页</h3><p>参考 Linear 的产品展示与 Notion 的分层介绍；研究信息层级，避免照搬品牌、文案和素材。</p></section><section><h2>同一个任务，试试三种解法。</h2><p>Pulse：为订阅类产品的每周数据报告重新设计，读者是周一早上的产品负责人；品牌字体和颜色已锁定。</p><a href="/d/pulse">查看完整案例与产出记录</a></section><section id="works"><h2>一个任务，三种方向。</h2>${sorted.map(card).join('')}</section></main>` }));
  for (const category of [...new Set(sorted.map(e => e.category))]) {
    const name = categoryNames[category] ?? category, list = sorted.filter(e => e.category === category);
    pages.set(`/c/${category}`, page(template, { site, route: `/c/${category}`, title: `${name} — ${library}`, description: `${name}：${list.length} 件作品，每件包含同一个任务的三个方向。`, body: `<main><h1>${escape(name)}</h1>${list.map(card).join('')}</main>` }));
  }
  for (const e of sorted) {
    const { image } = cover(e);
    pages.set(`/d/${e.slug}`, page(template, { site, route: `/d/${e.slug}`, type: 'article', title: `${e.title[0]} — ${library}`, description: e.summary[0],
      image: { src: `/media/${e.slug}/${image.file}`, width: image.width, height: image.height, alt: image.alt[0] }, body: entryBody(e) }));
  }
  for (const [route, [title, description]] of Object.entries(staticPages)) pages.set(route, page(template, { site, route, title, description }));
  return pages;
}

export function sitemap(routes, site = defaultSite) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...routes].map(r => `  <url><loc>${escape(site + (r === '/' ? '/' : r))}</loc></url>`).join('\n')}\n</urlset>\n`;
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
  const dist = path.resolve(here, '../dist'), site = (process.env.SITE_URL || defaultSite).replace(/\/$/, '');
  const { entries, problems } = loadEntries();
  if (problems.length) { console.error(problems.join('\n')); process.exit(1); }
  // The untouched shell stays available as app.html: the fallback for routes without their own page.
  const shell = path.join(dist, 'app.html');
  if (!fs.existsSync(shell)) fs.copyFileSync(path.join(dist, 'index.html'), shell);
  const template = fs.readFileSync(shell, 'utf8'), pages = renderSite(entries, template, site);
  for (const [route, html] of pages) {
    const file = route === '/' ? path.join(dist, 'index.html') : path.join(dist, route.slice(1), 'index.html');
    fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, html);
  }
  fs.cpSync(path.join(contentRoot, 'media'), path.join(dist, 'media'), { recursive: true });
  for (const entry of entries) fs.writeFileSync(path.join(dist, 'd', `${entry.slug}.json`), JSON.stringify(toCard(entry, site), null, 2) + '\n');
  fs.writeFileSync(path.join(dist, 'sitemap.xml'), sitemap(pages.keys(), site));
  fs.writeFileSync(path.join(dist, 'feed.xml'), rss(entries, site));
  fs.writeFileSync(path.join(dist, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${site}/sitemap.xml\n`);
  console.log(`Prerendered ${pages.size} routes and ${entries.length} direction cards for ${site}; sitemap.xml, feed.xml and robots.txt written.`);
}
