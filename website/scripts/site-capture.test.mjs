import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { captureScreens, launch, moved, sheetHtml, sheetHeight, VIEWPORT, GAP } from './site-capture.mjs';

const chrome = [process.env.CHROME_BIN, '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium']
  .find(file => file && existsSync(file));

// Ubuntu 24.04 (the CI runner) blocks Chrome's sandbox; the page here is our own.
const sandbox = process.platform === 'linux' ? ['--no-sandbox'] : [];

// Enough of PNG to read Chrome's screenshots: 8-bit RGB or RGBA, not interlaced.
function decodePng(buf) {
  const width = buf.readUInt32BE(16), height = buf.readUInt32BE(20), channels = { 2: 3, 6: 4 }[buf[25]];
  assert.ok(buf[24] === 8 && channels && buf[28] === 0, 'unexpected PNG format');
  const parts = [];
  for (let at = 8; at < buf.length;) {
    const length = buf.readUInt32BE(at), type = buf.toString('ascii', at + 4, at + 8);
    if (type === 'IDAT') parts.push(buf.subarray(at + 8, at + 8 + length));
    at += length + 12;
  }
  const raw = zlib.inflateSync(Buffer.concat(parts)), stride = width * channels, pixels = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)], line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let x = 0; x < stride; x++) {
      const a = x >= channels ? pixels[y * stride + x - channels] : 0, b = y ? pixels[(y - 1) * stride + x] : 0, c = x >= channels && y ? pixels[(y - 1) * stride + x - channels] : 0;
      const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
      const predictor = [0, a, b, (a + b) >> 1, pa <= pb && pa <= pc ? a : pb <= pc ? b : c][filter];
      pixels[y * stride + x] = (line[x] + predictor) & 255;
    }
  }
  return { width, height, at: (x, y) => [...pixels.subarray(y * stride + x * channels, y * stride + x * channels + 3)] };
}

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
</style></head><body><section id="hero"></section><section id="reveal"></section><section id="last"></section>
<script>new IntersectionObserver(es => es.forEach(e => e.isIntersecting && e.target.classList.add('in')), { threshold: .5 }).observe(document.getElementById('reveal'))</script>
</body></html>`;

test('each screen is one viewport, reached by scrolling, after scroll reveals ran', { skip: !chrome && 'no Chrome on this machine', timeout: 90000 }, async () => {
  const server = http.createServer((req, res) => { res.writeHead(200, { 'content-type': 'text/html' }); res.end(page); });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'capture-test-'));
  try {
    const { file, offsets } = await captureScreens(`http://127.0.0.1:${server.address().port}/`, path.join(dir, 'site.png'), { chrome, settle: 600, intro: 300, args: sandbox });
    assert.deepEqual(offsets, [0, 800, 1600]);
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
