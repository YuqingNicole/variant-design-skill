// Lab measurements of the public pages in real Chrome: LCP, CLS, FCP, long-task time, the slowest interaction, and the
// gzip size of the scripts and styles a page loads. Lab data on one machine, not what readers experience.
// `node perf-lab.mjs [--base https://…] [--runs 5] [--out file.json]`; without --base it serves ../website/dist locally.
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import zlib from 'node:zlib';

const pixel = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
export const pages = ['/', '/browse/interaction', '/inspiration/linear', '/sponsor'];
export const median = list => [...list].sort((a, b) => a - b)[Math.floor(list.length / 2)];

// `stub` answers every third-party image with one pixel and blocks other third-party requests, so the numbers describe our
// own HTML, scripts and styles instead of other sites' images. Without it (production runs) the real network is used.
export const fakeWidgets = `window.twttr={widgets:{createTweet:(id,box)=>new Promise(ok=>setTimeout(()=>{const el=document.createElement('div');el.style.cssText='width:100%;height:520px';box.appendChild(el);ok(el)},700))}};`;
export async function measure(browser, { base, path, mobile = false, stub = true }) {
  const context = await browser.newContext(mobile ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { viewport: { width: 1440, height: 900 } });
  const page = await context.newPage(), origin = new URL(base).origin, bytes = { js: 0, css: 0, html: 0 };
  // X's embed script is stood in for by one that adds a tall block 700ms after it is asked for (a shift within 500ms of an
  // input does not count, and the real widget takes longer than that),
  // so a layout that lets the embed push the page's text down shows up here instead of only on production.
  if (stub) await page.route(url => url.origin !== origin, r => /^https:\/\/platform\.twitter\.com\/widgets\.js/.test(r.request().url()) ? r.fulfill({ contentType: 'text/javascript', body: fakeWidgets }) : r.request().resourceType() === 'image' ? r.fulfill({ contentType: 'image/png', body: pixel }) : r.abort());
  if (mobile) await (await context.newCDPSession(page)).send('Emulation.setCPUThrottlingRate', { rate: 4 });
  const reads = [];
  page.on('response', r => {
    const type = r.request().resourceType(), key = type === 'script' ? 'js' : type === 'stylesheet' ? 'css' : type === 'document' ? 'html' : '';
    if (!key || new URL(r.url()).origin !== origin) return;
    reads.push(r.body().then(body => { bytes[key] += zlib.gzipSync(body).length; }, () => { /* a response replaced mid-navigation has no body */ }));
  });
  await page.addInitScript(() => {
    const m = window.__m = { lcp: 0, cls: 0, fcp: 0, longMs: 0, slowest: 0 }, watch = (type, fn, extra = {}) => { try { new PerformanceObserver(l => l.getEntries().forEach(fn)).observe({ type, buffered: true, ...extra }); } catch { /* unsupported entry type */ } };
    watch('largest-contentful-paint', e => { m.lcp = e.startTime; });
    watch('layout-shift', e => { if (!e.hadRecentInput) m.cls += e.value; });
    watch('paint', e => { if (e.name === 'first-contentful-paint') m.fcp = e.startTime; });
    watch('longtask', e => { m.longMs += Math.max(0, e.duration - 50); });
    watch('event', e => { if (e.interactionId) m.slowest = Math.max(m.slowest, e.duration); }, { durationThreshold: 16 });
  });
  await page.goto(base + path, { waitUntil: 'load' });
  await page.waitForFunction(() => Object.keys(document.getElementById('root')).some(k => k.startsWith('__reactContainer')));
  await page.waitForTimeout(1500);
  const load = await page.evaluate(() => ({ ...window.__m }));
  // `kb` is what the page loaded to render; `kbAfter` adds what using it fetched (since 2026-11-13 the home fetches the rest of
  // the reference library when the reader scrolls past the first page or searches, so the two differ there).
  const kb = async () => { await Promise.all(reads); return { js: +(bytes.js / 1024).toFixed(1), css: +(bytes.css / 1024).toFixed(1), html: +(bytes.html / 1024).toFixed(1) }; };
  const loaded = await kb();
  // Then use the page the way a reader does: open a card, close it, search.
  const card = page.locator('.insp-card-open').first();
  if (await card.count()) { await card.click(); await page.waitForTimeout(1400); await page.keyboard.press('Escape'); await page.waitForTimeout(300); }
  const search = page.locator('.insp-search input');
  if (await search.count()) { await search.click(); await page.keyboard.type('a'); await page.waitForTimeout(400); }
  const after = await page.evaluate(() => ({ ...window.__m }));
  const kbAfter = await kb();
  await context.close();
  return { lcp: Math.round(load.lcp), fcp: Math.round(load.fcp), cls: +after.cls.toFixed(4), longMs: Math.round(load.longMs), slowest: Math.round(after.slowest), kb: loaded, kbAfter };
}

if (process.argv[1] && import.meta.url === new URL(process.argv[1], 'file:').href) {
  const arg = name => { const i = process.argv.indexOf(`--${name}`); return i < 0 ? '' : process.argv[i + 1]; };
  const runs = Number(arg('runs') || 5), remote = arg('base'), base = remote || 'http://127.0.0.1:4197';
  const server = remote ? null : spawn('node', ['../website/server.mjs'], { env: { ...process.env, PORT: '4197' }, stdio: 'ignore' });
  if (server) await new Promise(r => setTimeout(r, 1500));
  const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || undefined }), out = [];
  for (const mobile of [false, true]) for (const path of pages) {
    const samples = []; for (let i = 0; i < runs; i++) samples.push(await measure(browser, { base, path, mobile, stub: !remote }));
    const pick = f => median(samples.map(f));
    const row = { path, profile: mobile ? 'phone, 4x CPU slowdown' : 'desktop', runs, lcp: pick(s => s.lcp), fcp: pick(s => s.fcp), cls: pick(s => s.cls), longMs: pick(s => s.longMs), slowest: pick(s => s.slowest), kb: samples[0].kb, kbAfter: samples[0].kbAfter };
    out.push(row); console.log(JSON.stringify(row));
  }
  await browser.close(); server?.kill();
  if (arg('out')) writeFileSync(arg('out'), JSON.stringify({ base, date: new Date().toISOString(), stub: !remote, rows: out }, null, 2) + '\n');
}
