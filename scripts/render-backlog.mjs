#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = path.join(root, 'TODO.md');
const outputPath = process.argv[2] ? path.resolve(process.cwd(), process.argv[2]) : path.join(root, 'website', 'public', 'backlog.html');

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

function inline(value) {
  const escaped = escapeHtml(value);
  return escaped
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) => {
      const safeHref = href.startsWith('https://') || href.startsWith('http://') || href.startsWith('/') || /^[\w./-]+$/.test(href);
      const target = safeHref && !href.startsWith('https://') && !href.startsWith('http://') && !href.startsWith('/') ? `https://github.com/YuqingNicole/variant-design-skill/blob/master/${href}` : href;
      return safeHref ? `<a href="${target}">${label}</a>` : label;
    });
}

function parseMarkdown(markdown) {
  const sections = [];
  let title = 'Backlog';
  let intro = [];
  let section;
  let paragraph = [];
  const flushParagraph = () => {
    if (!paragraph.length) return;
    const text = paragraph.join(' ').trim();
    if (section) section.description.push(text);
    else intro.push(text);
    paragraph = [];
  };

  for (const rawLine of markdown.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('<!--')) { flushParagraph(); continue; }
    if (line.startsWith('# ')) { flushParagraph(); title = line.slice(2).trim(); continue; }
    if (line.startsWith('## ')) {
      flushParagraph();
      section = { title: line.slice(3).trim(), description: [], tasks: [] };
      sections.push(section);
      continue;
    }
    const task = line.match(/^- \[([ xX])\] (.+)$/);
    if (task) {
      flushParagraph();
      if (!section) continue;
      section.tasks.push({ text: task[2], done: task[1].toLowerCase() === 'x', owner: task[2].includes('【维护者】') });
      continue;
    }
    const bullet = line.match(/^- (.+)$/);
    if (bullet) {
      flushParagraph();
      if (section) section.tasks.push({ text: bullet[1], done: false, owner: bullet[1].includes('【维护者】') });
      continue;
    }
    paragraph.push(line);
  }
  flushParagraph();
  return { title, intro, sections };
}

const backlog = parseMarkdown(fs.readFileSync(sourcePath, 'utf8'));
const tasks = backlog.sections.flatMap((section, sectionIndex) => section.tasks.map((task, taskIndex) => ({ ...task, sectionIndex, taskIndex })));
const openCount = tasks.filter(task => !task.done).length;
const ownerCount = tasks.filter(task => task.owner && !task.done).length;

const sectionMarkup = backlog.sections.map((section, sectionIndex) => {
  const description = section.description.map(text => `<p class="section-note">${inline(text)}</p>`).join('');
  const taskMarkup = section.tasks.length ? `<ul class="task-list">${section.tasks.map((task, taskIndex) => `<li class="task" data-owner="${task.owner ? 'yes' : 'no'}" data-done="${task.done ? 'yes' : 'no'}" data-search="${escapeHtml(`${section.title} ${task.text}`.toLocaleLowerCase())}">
    <span class="task-state${task.done ? ' is-done' : ''}" aria-label="${task.done ? '已完成' : '待处理'}">${task.done ? '✓' : ''}</span>
    <div class="task-copy"><h3>${inline(task.text)}</h3><span class="task-owner">${task.owner ? '需要维护者' : task.done ? '已完成' : '可继续推进'}</span></div>
  </li>`).join('')}</ul>` : '<p class="empty-section">当前没有待办。</p>';
  return `<section class="backlog-section" data-section="${sectionIndex}">
    <header class="section-heading"><span class="section-index">${String(sectionIndex + 1).padStart(2, '0')}</span><h2>${inline(section.title)}</h2><span class="section-count">${section.tasks.filter(task => !task.done).length} 项</span></header>
    ${description}${taskMarkup}
  </section>`;
}).join('\n');

const html = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>${escapeHtml(backlog.title)} · Backlog</title>
  <style>
    :root{color-scheme:light;--paper:#f6f6f0;--card:#fffefa;--ink:#252920;--muted:#656b60;--line:#d9ddd1;--green:#354b2e;--wash:#e6ecdf;--serif:Georgia,"Songti SC",serif;--sans:ui-sans-serif,-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif;--ease:cubic-bezier(.22,1,.36,1)}
    *{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.65 var(--sans);-webkit-font-smoothing:antialiased}a{color:var(--green);text-underline-offset:3px}button,input,select{font:inherit;color:inherit}button:focus-visible,input:focus-visible,select:focus-visible,a:focus-visible{outline:2px solid var(--green);outline-offset:3px}.visually-hidden{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
    .shell{width:min(1120px,calc(100% - 48px));margin:auto}.topline{padding:20px 0;border-bottom:1px solid var(--line);font-size:13px;color:var(--muted)}.topline a{font-weight:600;text-decoration:none}.hero{padding:72px 0 44px}.eyebrow{margin:0 0 14px;color:var(--green);font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase}.hero h1{margin:0;font:500 clamp(42px,7vw,76px)/1.02 var(--serif);letter-spacing:-.035em}.hero-intro{max-width:760px;margin:22px 0 0;color:var(--muted);font-size:17px}.hero-meta{display:flex;gap:10px;flex-wrap:wrap;margin-top:28px}.meta-pill{padding:7px 12px;border:1px solid var(--line);border-radius:999px;background:var(--card);font-size:13px}.meta-pill strong{color:var(--green);font-variant-numeric:tabular-nums}
    .toolbar{position:sticky;top:0;z-index:5;padding:14px 0;background:color-mix(in srgb,var(--paper) 92%,transparent);backdrop-filter:blur(12px);border-block:1px solid var(--line)}.toolbar-inner{display:grid;grid-template-columns:minmax(220px,1fr) auto minmax(190px,.55fr);align-items:center;gap:14px}.search{width:100%;height:46px;padding:0 16px;border:1px solid var(--line);border-radius:8px;background:var(--card)}.filters{display:flex;gap:5px;padding:4px;border:1px solid var(--line);border-radius:999px;background:#eceee7}.filters button{min-height:36px;padding:0 12px;border:0;border-radius:999px;background:transparent;font-size:13px;cursor:pointer;transition:background .15s var(--ease),color .15s var(--ease)}.filters button[aria-pressed=true]{background:var(--green);color:#fff}.filters button:hover{color:var(--green)}.filters button[aria-pressed=true]:hover{color:#fff}.section-select{height:46px;padding:0 14px;border:1px solid var(--line);border-radius:8px;background:var(--card)}.result-line{padding:24px 0 6px;color:var(--muted);font-size:13px}.result-line strong{color:var(--ink)}
    .backlog-section{padding:28px 0 46px;border-bottom:1px solid var(--line)}.section-heading{display:flex;align-items:baseline;gap:14px;margin-bottom:18px}.section-index{color:#8d9486;font:13px ui-monospace,SFMono-Regular,monospace}.section-heading h2{margin:0;font:500 clamp(26px,4vw,36px)/1.2 var(--serif);letter-spacing:-.02em}.section-count{margin-left:auto;color:var(--muted);font-size:13px;font-variant-numeric:tabular-nums}.section-note{max-width:820px;margin:0 0 14px;color:var(--muted);font-size:14px}.section-note code,.task-copy code{padding:.12em .4em;border-radius:4px;background:#eceee7;font: .9em ui-monospace,SFMono-Regular,monospace;overflow-wrap:anywhere}.task-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:0;padding:0;list-style:none}.task{display:flex;align-items:flex-start;gap:14px;min-height:100px;padding:18px;border:1px solid var(--line);border-radius:9px;background:var(--card);transition:border-color .18s var(--ease),transform .18s var(--ease)}.task:hover{border-color:#aeb9a5;transform:translateY(-1px)}.task[hidden],.backlog-section[hidden]{display:none}.task-state{display:grid;place-items:center;flex:none;width:23px;height:23px;margin-top:2px;border:1px solid #aeb5a8;border-radius:6px;color:white;font-size:14px}.task-state.is-done{border-color:var(--green);background:var(--green)}.task-copy{min-width:0}.task-copy h3{margin:0;font-size:15px;font-weight:500;line-height:1.55;overflow-wrap:anywhere}.task-owner{display:inline-flex;margin-top:10px;color:var(--muted);font-size:11px}.task-owner::before{content:"";width:6px;height:6px;margin:5px 7px 0 0;border-radius:50%;background:#b7c3ad}.task[data-owner=yes] .task-owner{color:#816544}.task[data-owner=yes] .task-owner::before{background:#b98d55}.empty-section{color:var(--muted);font-size:14px}.no-results{padding:40px 0;text-align:center;color:var(--muted)}footer{padding:28px 0 56px;color:var(--muted);font-size:12px}
    @media(max-width:760px){.hero{padding:52px 0 34px}.toolbar-inner{grid-template-columns:1fr auto}.search{grid-column:1/-1;grid-row:1}.filters{grid-column:1;grid-row:2;justify-self:start}.section-select{grid-column:2;grid-row:2;max-width:100%}.task-list{grid-template-columns:1fr}.task{min-height:0}.result-line{padding-top:18px}}
    @media(max-width:420px){.shell{width:calc(100% - 32px)}.topline{padding:16px 0}.hero h1{font-size:44px}.hero-intro{font-size:15px}.toolbar{padding:10px 0}.toolbar-inner{gap:8px}.filters{max-width:100%;overflow:auto}.filters button{white-space:nowrap;padding-inline:10px}.section-heading{gap:10px}.section-heading h2{font-size:28px}.task{padding:15px}}
    @media(prefers-reduced-motion:reduce){*,*::before,*::after{scroll-behavior:auto!important;animation:none!important;transition:none!important}}
  </style>
</head>
<body>
  <div class="topline"><div class="shell"><a href="https://github.com/YuqingNicole/variant-design-skill/blob/master/TODO.md">Variant Design</a> <span aria-hidden="true">/</span> 项目待办</div></div>
  <header class="hero shell">
    <p class="eyebrow">Backlog · Maintainer &amp; agents</p>
    <h1>把下一步，<br>变得清楚。</h1>
    <p class="hero-intro">${backlog.intro.map(inline).join('<br>')}</p>
    <div class="hero-meta"><span class="meta-pill"><strong>${openCount}</strong> 项待处理</span><span class="meta-pill"><strong>${ownerCount}</strong> 项需要维护者</span><span class="meta-pill">来源 <code>TODO.md</code></span></div>
  </header>
  <div class="toolbar"><div class="shell toolbar-inner">
    <label><span class="visually-hidden">搜索待办</span><input class="search" type="search" placeholder="搜索 backlog" autocomplete="off"></label>
    <div class="filters" role="group" aria-label="按执行者筛选"><button type="button" data-kind="all" aria-pressed="true">全部</button><button type="button" data-kind="agent" aria-pressed="false">可继续推进</button><button type="button" data-kind="owner" aria-pressed="false">需要维护者</button></div>
    <label><span class="visually-hidden">筛选分组</span><select class="section-select"><option value="all">所有分组</option>${backlog.sections.map((section, index) => `<option value="${index}">${escapeHtml(section.title)}</option>`).join('')}</select></label>
  </div></div>
  <main class="shell">
    <p class="result-line" aria-live="polite">显示 <strong class="visible-count">${openCount}</strong> / ${openCount} 项</p>
    ${sectionMarkup}
    <p class="no-results" hidden>没有匹配的待办，试试其他关键词或筛选条件。</p>
  </main>
  <footer class="shell">这是由 <code>TODO.md</code> 生成的浏览视图。修改待办请编辑 Markdown，再运行 <code>node scripts/render-backlog.mjs</code>。</footer>
  <script>
    const search=document.querySelector('.search'),kindButtons=[...document.querySelectorAll('[data-kind]')],sectionSelect=document.querySelector('.section-select'),cards=[...document.querySelectorAll('.task')],sections=[...document.querySelectorAll('.backlog-section')],visibleCount=document.querySelector('.visible-count'),noResults=document.querySelector('.no-results');let kind='all';
    function filter(){const query=search.value.trim().toLocaleLowerCase();let visible=0;for(const card of cards){const sectionMatch=sectionSelect.value==='all'||card.closest('.backlog-section').dataset.section===sectionSelect.value;const kindMatch=kind==='all'||(kind==='owner'?card.dataset.owner==='yes':card.dataset.owner==='no'&&card.dataset.done==='no');const matches=sectionMatch&&kindMatch&&card.dataset.search.includes(query);card.hidden=!matches;if(matches)visible++}for(const section of sections){const hasVisible=Boolean(section.querySelector('.task:not([hidden])'));const informativeEmpty=!section.querySelector('.task')&&sectionSelect.value==='all'&&kind==='all'&&!query;section.hidden=!hasVisible&&!informativeEmpty}visibleCount.textContent=visible;noResults.hidden=visible>0}
    search.addEventListener('input',filter);sectionSelect.addEventListener('change',filter);for(const button of kindButtons)button.addEventListener('click',()=>{kind=button.dataset.kind;for(const item of kindButtons)item.setAttribute('aria-pressed',String(item===button));filter()});
  </script>
</body>
</html>`;

fs.writeFileSync(outputPath, html);
process.stdout.write(`Wrote ${path.relative(root, outputPath)} from TODO.md (${openCount} open items).\n`);
