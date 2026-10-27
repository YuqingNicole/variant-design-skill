#!/usr/bin/env node
// Builds the blind-review package (docs/trials/blind-review.md): screenshots of the original page and of
// both groups' A/B/C, their trade-off notes and recommendation, with the groups randomly labelled X and Y.
// Usage: node evals/blind/pack.mjs --skill <runs dir> --plain <runs dir> --out <package dir> [--agent claude] [--fixture pulse,harbor,bakery,ledger]
// Needs the Playwright install in tests/ (PLAYWRIGHT_CHANNEL=chrome uses the local Chrome). The answer key goes to <out>-key.json.
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { randomInt } from 'node:crypto';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const { chromium } = createRequire(path.join(here, '../../tests/package.json'))('playwright');
const args = process.argv.slice(2), opt = (name, fallback) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : fallback; };
const skillRuns = path.resolve(opt('--skill')), plainRuns = path.resolve(opt('--plain')), out = path.resolve(opt('--out'));
const agent = opt('--agent', 'claude');
const fixtures = opt('--fixture', fs.readdirSync(path.join(here, '../fixtures')).join(',')).split(',');
const viewports = { desktop: { width: 1280, height: 900 }, mobile: { width: 390, height: 844 } };
const escape = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

const freePort = () => new Promise(resolve => { const s = net.createServer().listen(0, () => { const { port } = s.address(); s.close(() => resolve(port)); }); });
// The original page: a static file, or the project's own dev server for Vite and Next.js fixtures.
async function original(dir) {
  if (!fs.existsSync(path.join(dir, 'package.json'))) return { url: pathToFileURL(path.join(dir, 'index.html')).href, stop() {} };
  const port = await freePort(), next = fs.existsSync(path.join(dir, 'next.config.ts'));
  const child = spawn('npx', next ? ['next', 'dev', '-p', String(port)] : ['vite', '--port', String(port), '--strictPort'], { cwd: dir, stdio: 'ignore', detached: true, env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' } });
  const url = `http://localhost:${port}${next ? '/pricing' : '/'}`;
  for (let i = 0; i < 120; i++) { try { if ((await fetch(url)).ok) break; } catch {} await new Promise(r => setTimeout(r, 1000)); }
  return { url, stop: () => { try { process.kill(-child.pid); } catch {} } };
}

// Skill group: pages and notes from the recorded context. Control group: A/B/C.html and notes.json.
function skillGroup(dir) {
  const output = path.join(dir, 'variant-output'), context = JSON.parse(fs.readFileSync(path.join(output, '.variant-context.json'), 'utf8'));
  const page = id => { const entry = context.variants[id].entry; const file = entry.endsWith('.html') ? path.join(output, entry) : path.join(output, '_static/_preview', `${id}.html`); return fs.existsSync(file) ? pathToFileURL(file).href : null; };
  return { pages: Object.fromEntries(['A', 'B', 'C'].map(id => [id, page(id)])), notes: Object.fromEntries(['A', 'B', 'C'].map(id => [id, context.variants[id].comparison])), recommendation: context.recommendation };
}
function plainGroup(dir) {
  const output = path.join(dir, 'variant-output');
  let notes = {};
  try { notes = JSON.parse(fs.readFileSync(path.join(output, 'notes.json'), 'utf8')); } catch {}
  const page = id => fs.existsSync(path.join(output, `${id}.html`)) ? pathToFileURL(path.join(output, `${id}.html`)).href : null;
  return { pages: Object.fromEntries(['A', 'B', 'C'].map(id => [id, page(id)])), notes: { A: notes.A, B: notes.B, C: notes.C }, recommendation: notes.recommendation };
}

async function shoot(browser, url, file, viewport) {
  if (!url) return null;
  const page = await browser.newPage({ viewport, reducedMotion: 'reduce' });
  try { await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 }); await page.waitForTimeout(500); await page.screenshot({ path: file, fullPage: true }); return path.basename(file); }
  catch { return null; } finally { await page.close(); }
}

const notesHtml = group => `<dl>${['A', 'B', 'C'].map(id => { const n = group.notes[id] ?? {}; return `<dt>${id}</dt><dd>Optimizes: ${escape(n.optimizes)}<br>Trade-off: ${escape(n.tradeoff)}<br>Best for: ${escape(n.bestFor)}</dd>`; }).join('')}</dl><p><b>Recommends ${escape(group.recommendation?.variant)}</b>: ${escape(group.recommendation?.reason)}</p>`;

fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {});
const key = {}, sections = [];
for (const fixture of fixtures) {
  const sDir = path.join(skillRuns, `${fixture}-${agent}`), pDir = path.join(plainRuns, `${fixture}-${agent}`);
  if (!fs.existsSync(sDir) || !fs.existsSync(pDir)) { console.log(`skip ${fixture}: missing a run`); continue; }
  const swap = randomInt(2) === 1, groups = { X: swap ? plainGroup(pDir) : skillGroup(sDir), Y: swap ? skillGroup(sDir) : plainGroup(pDir) };
  key[fixture] = { X: swap ? 'plain' : 'skill', Y: swap ? 'skill' : 'plain' };
  const dir = path.join(out, fixture); fs.mkdirSync(dir, { recursive: true });
  const server = await original(sDir);
  const before = {}; for (const [name, viewport] of Object.entries(viewports)) before[name] = await shoot(browser, server.url, path.join(dir, `original-${name}.png`), viewport);
  server.stop();
  const shots = {};
  for (const [label, group] of Object.entries(groups)) for (const id of ['A', 'B', 'C']) for (const [name, viewport] of Object.entries(viewports)) shots[`${label}${id}${name}`] = await shoot(browser, group.pages[id], path.join(dir, `${label}-${id}-${name}.png`), viewport);
  const img = file => file ? `<a href="${fixture}/${file}"><img src="${fixture}/${file}" loading="lazy" alt=""></a>` : '<p class="missing">No page to show</p>';
  sections.push(`<section><h2>${escape(fixture)}</h2><p class="task">${escape(JSON.parse(fs.readFileSync(path.join(here, '../fixtures', fixture, 'fixture.json'), 'utf8')).description)}</p>
<h3>Original</h3><div class="row">${img(before.desktop)}${img(before.mobile)}</div>
${['X', 'Y'].map(label => `<h3>Group ${label}</h3>${['A', 'B', 'C'].map(id => `<h4>${label} · ${id}</h4><div class="row">${img(shots[`${label}${id}desktop`])}${img(shots[`${label}${id}mobile`])}</div>`).join('')}${notesHtml(groups[label])}`).join('')}</section>`);
  console.log(`packed ${fixture}`);
}
await browser.close();
fs.writeFileSync(path.join(out, 'index.html'), `<!doctype html><meta charset="utf-8"><title>Blind review</title><style>body{font:15px/1.5 system-ui,sans-serif;max-width:1200px;margin:24px auto;padding:0 16px}.row{display:flex;gap:12px;align-items:flex-start}.row a:first-child{flex:3}.row a:last-child{flex:1}img{width:100%;border:1px solid #ccc;max-height:900px;object-fit:cover;object-position:top}section{border-top:2px solid #333;margin-top:40px}dd{margin:0 0 8px 16px}.missing{color:#a00}</style>
<h1>Blind review</h1><p>For each task, compare group X and group Y. Fill in the score sheet for both groups, then say which one you would rather keep working with and why. Click an image to open it at full size.</p>${sections.join('\n')}`);
fs.writeFileSync(`${out}-key.json`, JSON.stringify({ agent, key }, null, 2));
console.log(`Package: ${path.join(out, 'index.html')}\nAnswer key (do not share with reviewers): ${out}-key.json`);
