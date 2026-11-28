import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { captureScreens, decodePng, drawn, launch, moved, sheetHtml, sheetHeight, VIEWPORT, GAP } from './site-capture.mjs';

const chrome = [process.env.CHROME_BIN, '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium']
  .find(file => file && existsSync(file));

// Ubuntu 24.04 (the CI runner) blocks Chrome's sandbox; the page here is our own.
const sandbox = process.platform === 'linux' ? ['--no-sandbox'] : [];

test('the sheet stacks one viewport-sized shot per screen with a gap between', () => {
  assert.equal(sheetHeight(3), 3 * VIEWPORT.height + 2 * GAP);
  const html = sheetHtml(['QQ==', 'Qg==', 'Qw==']);
  assert.equal(html.match(/<img /g).length, 3);
  assert.match(html, /width="1280" height="800"/);
});

test('a Chrome that cannot start fails the capture instead of crashing the run', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'capture-test-'));
  try {
    await assert.rejects(captureScreens('https://example.com/', path.join(dir, 'site.png'), { chrome: path.join(dir, 'no-chrome') }), /Chrome could not start/);
  } finally { await fs.rm(dir, { recursive: true, force: true }); }
});

// The two failures seen in the 2026-11-22 run (#314): a `100vh` hero filled the whole capture, and content revealed on
// scroll stayed blank. The page below has both; each screen must show its own section, revealed.
const page = `<!doctype html><html><head><style>
  body { margin: 0 } section { height: 100vh } #hero { background: rgb(255,0,0) }
  #reveal { background: rgb(255,255,255); transition: background .3s } #reveal.in { background: rgb(0,160,0) }
  #last { background: rgb(0,0,255) }
</style></head><body><section id="hero"><button style="margin:20px">Explore</button></section><section id="reveal"></section><section id="last"></section>
<script>new IntersectionObserver(es => es.forEach(e => e.isIntersecting && e.target.classList.add('in')), { threshold: .5 }).observe(document.getElementById('reveal'))</script>
</body></html>`;

test('each screen is one viewport, reached by scrolling, after scroll reveals ran', { skip: !chrome && 'no Chrome on this machine', timeout: 90000 }, async () => {
  const server = http.createServer((req, res) => { res.writeHead(200, { 'content-type': 'text/html' }); res.end(page); });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'capture-test-'));
  try {
    const { file, offsets, gate, canvas } = await captureScreens(`http://127.0.0.1:${server.address().port}/`, path.join(dir, 'site.png'), { chrome, settle: 600, intro: 300, args: sandbox });
    assert.deepEqual(offsets, [0, 800, 1600]);
    assert.equal(gate, null, 'a button on a page that scrolls is not an entry gate');
    assert.equal(canvas, null);
    const png = decodePng(await fs.readFile(file));
    assert.deepEqual([png.width, png.height], [1280, sheetHeight(3)]);
    const middle = screen => png.at(640, screen * (VIEWPORT.height + GAP) + 400);
    assert.deepEqual(middle(0), [255, 0, 0], 'screen 1 is the hero');
    assert.deepEqual(middle(1), [0, 160, 0], 'screen 2 is the revealed section, not more hero');
    assert.deepEqual(middle(2), [0, 0, 255], 'screen 3 is the last section');
    assert.deepEqual(png.at(640, VIEWPORT.height + GAP / 2), [154, 154, 154], 'a grey line separates the screens');
  } finally {
    server.close();
    await fs.rm(dir, { recursive: true, force: true });
  }
});

const serve = async handler => {
  const server = http.createServer(handler);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  return { url: `http://127.0.0.1:${server.address().port}/`, close: () => { server.closeAllConnections(); server.close(); } };
};
const alive = pid => { try { process.kill(pid, 0); return true; } catch { return false; } };
const fast = { chrome, settle: 600, intro: 300, args: sandbox };

test('a screen counts as moved when the scroll offset or most of the content moved', () => {
  const tops = [0, 100, 900, 1700];
  assert.equal(moved({ offset: 0, tops }, { offset: 800, tops }), true);
  assert.equal(moved({ offset: 0, tops }, { offset: 0, tops: tops.map(t => t - 800) }), true, 'a transform scroller never changes scrollY');
  assert.equal(moved({ offset: 0, tops }, { offset: 0, tops: [0, 100, 900, 1650] }), false, 'one carousel slide is not a scroll');
  assert.equal(moved({ offset: 0, tops: [] }, { offset: 0, tops: [] }), false);
  assert.equal(moved({ offset: 0, tops }, null), null, 'a measurement that timed out is unknown, not a standstill');
  assert.equal(moved(null, { offset: 0, tops }), null);
});

// The scheduled run of 2026-11-24 lost 9 of 10 sites, 7 to "Chrome did not open its DevTools port" on a machine deep in swap.
test('a Chrome that does not open its port is stopped with its children, and started once more', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'capture-test-'));
  const fake = path.join(dir, 'chrome'), starts = path.join(dir, 'starts'), kids = path.join(dir, 'kids');
  await fs.writeFile(fake, `#!/bin/sh\necho start >> "${starts}"\nsleep 30 &\necho $! >> "${kids}"\nwait\n`, { mode: 0o755 });
  try {
    await assert.rejects(launch({ chrome: fake, startup: 2000 }), /did not open its DevTools port within 2s/);
    assert.equal((await fs.readFile(starts, 'utf8')).trim().split('\n').length, 2, 'one retry');
    for (const pid of (await fs.readFile(kids, 'utf8')).trim().split('\n').map(Number)) assert.equal(alive(pid), false, `helper ${pid} was left running`);
  } finally { await fs.rm(dir, { recursive: true, force: true }); }
});

test('closing Chrome stops its helpers and leaves no profile behind', { skip: !chrome && 'no Chrome on this machine', timeout: 60000 }, async () => {
  const browser = await launch({ chrome, args: sandbox });
  await browser.close();
  assert.equal(alive(-browser.pid), false, 'the process group is gone');
  await new Promise(resolve => setTimeout(resolve, 1000));
  assert.equal(existsSync(browser.profile), false, 'no helper wrote the profile back after it was deleted');
});

// Protip Marketing was rejected as "never scrolled" from the scheduled run but scrolls fine when the machine is idle: a wheel
// pass that arrives before the page is ready must not end the capture's attempt to move.
test('a page that ignores the first wheel pass is scrolled by the second', { skip: !chrome && 'no Chrome on this machine', timeout: 90000 }, async () => {
  const late = page.replace('<script>', `<script>document.documentElement.style.overflow = 'hidden'; setTimeout(() => document.documentElement.style.overflow = '', 1800);`);
  const site = await serve((req, res) => { res.writeHead(200, { 'content-type': 'text/html' }); res.end(late); });
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'capture-test-'));
  try {
    const { offsets, moved: went } = await captureScreens(site.url, path.join(dir, 'site.png'), fast);
    assert.deepEqual(went, [null, true, true]);
    assert.deepEqual(offsets, [0, 800, 1600]);
  } finally { site.close(); await fs.rm(dir, { recursive: true, force: true }); }
});

test('a page that genuinely does not scroll is reported as not moving', { skip: !chrome && 'no Chrome on this machine', timeout: 90000 }, async () => {
  const fixed = `<!doctype html><html><body style="margin:0;overflow:hidden"><div style="height:100vh;background:rgb(255,0,0)"></div><div style="height:100vh"></div></body></html>`;
  const site = await serve((req, res) => { res.writeHead(200, { 'content-type': 'text/html' }); res.end(fixed); });
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'capture-test-'));
  try {
    const { offsets, moved: went } = await captureScreens(site.url, path.join(dir, 'site.png'), fast);
    assert.deepEqual(went, [null, false, false]);
    assert.deepEqual(offsets, [0, 0, 0]);
  } finally { site.close(); await fs.rm(dir, { recursive: true, force: true }); }
});

// The Brink Agency and Gleb Kuznetsov failed with "capture took longer than 75s": a page that never finishes loading is shot
// as far as it got within the budget instead of being lost.
test('a page that never finishes loading is captured as it stands when the budget runs out', { skip: !chrome && 'no Chrome on this machine', timeout: 90000 }, async () => {
  const site = await serve((req, res) => {
    if (req.url === '/hang') return; // never answers, so the load event never fires
    res.writeHead(200, { 'content-type': 'text/html' }); res.end(page.replace('<section id="hero">', '<section id="hero"><img src="/hang">'));
  });
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'capture-test-'));
  try {
    const started = Date.now();
    const { file, late, offsets } = await captureScreens(site.url, path.join(dir, 'site.png'), { ...fast, timeout: 6000 });
    assert.equal(late, true);
    assert.deepEqual(offsets, [0, 800, 1600]);
    assert.ok(Date.now() - started < 30000, 'bounded by the budget, not by the page');
    assert.deepEqual(decodePng(await fs.readFile(file)).at(640, 400), [255, 0, 0]);
  } finally { site.close(); await fs.rm(dir, { recursive: true, force: true }); }
});

test('a canvas counts as drawn once more than a flat colour shows', () => {
  const image = (w, h, colour) => ({ width: w, height: h, at: (x, y) => colour(x, y) });
  assert.equal(drawn(image(96, 60, () => [0, 0, 0])), false, 'a black scene still loading');
  assert.equal(drawn(image(96, 60, (x, y) => (x < 2 && y < 2 ? [255, 255, 255] : [0, 0, 0]))), false, 'a few pixels of noise');
  assert.equal(drawn(image(96, 60, x => (x < 48 ? [200, 30, 30] : [0, 0, 0]))), true);
});

// A DAY (#356) showed only "Cannot read properties of null (reading 'getSupportedExtensions')": headless Chrome had no WebGL.
// This scene needs WebGL and draws only after a delay; the first screen must wait for it and show it.
test('a WebGL scene renders and is shot once it has drawn', { skip: !chrome && 'no Chrome on this machine', timeout: 90000 }, async () => {
  const scene = `<!doctype html><html><body style="margin:0;background:#000"><canvas id="c" width="1280" height="800" style="display:block;width:100vw;height:100vh"></canvas>
<script>const gl = document.getElementById('c').getContext('webgl', { preserveDrawingBuffer: true }); document.title = gl ? 'webgl' : 'none';
setTimeout(() => { if (!gl) return; gl.clearColor(1, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT); gl.enable(gl.SCISSOR_TEST); gl.scissor(0, 0, 640, 800); gl.clearColor(0, 0, 1, 1); gl.clear(gl.COLOR_BUFFER_BIT); }, 2500);</script></body></html>`;
  const site = await serve((req, res) => { res.writeHead(200, { 'content-type': 'text/html' }); res.end(scene); });
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'capture-test-'));
  try {
    const { file, canvas } = await captureScreens(site.url, path.join(dir, 'site.png'), fast);
    assert.equal(canvas, 'drawn');
    const png = decodePng(await fs.readFile(file));
    assert.deepEqual(png.at(320, 400), [0, 0, 255]);
    assert.deepEqual(png.at(960, 400), [255, 0, 0]);
  } finally { site.close(); await fs.rm(dir, { recursive: true, force: true }); }
});

// Rinat Seif (#356) showed its "Enter with sound / Without" gate on all three screens. The silent choice is clicked once.
test('a full-screen entry gate is clicked once, on its silent choice', { skip: !chrome && 'no Chrome on this machine', timeout: 90000 }, async () => {
  const gated = page.replace('<script>', `<div id="gate" style="position:fixed;inset:0;background:#000;display:flex;gap:40px;align-items:center;justify-content:center">
<span id="loud" style="cursor:pointer;color:#fff">Enter with sound</span><span id="quiet" style="cursor:pointer;color:#fff">Without</span></div>
<script>document.body.style.overflow = 'hidden';
for (const [id, colour] of [['loud', 'rgb(255,255,0)'], ['quiet', 'rgb(255,0,0)']]) document.getElementById(id).addEventListener('click', () => {
  document.getElementById('gate').remove(); document.body.style.overflow = ''; document.getElementById('hero').style.background = colour; });</script><script>`);
  const site = await serve((req, res) => { res.writeHead(200, { 'content-type': 'text/html' }); res.end(gated); });
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'capture-test-'));
  try {
    const { file, gate, offsets } = await captureScreens(site.url, path.join(dir, 'site.png'), fast);
    assert.equal(gate, 'Without');
    assert.deepEqual(offsets, [0, 800, 1600]);
    const png = decodePng(await fs.readFile(file));
    assert.deepEqual(png.at(640, 400), [255, 0, 0], 'the hero behind the gate, entered without sound');
    assert.deepEqual(png.at(640, 2 * (VIEWPORT.height + GAP) + 400), [0, 0, 255]);
  } finally { site.close(); await fs.rm(dir, { recursive: true, force: true }); }
});
