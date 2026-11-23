import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { captureScreens, sheetHtml, sheetHeight, VIEWPORT, GAP } from './site-capture.mjs';

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
