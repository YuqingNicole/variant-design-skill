// Captures a site's first screens the way a visitor sees them, for screening (threads-publish.mjs).
// A single tall `--screenshot` made the window 2400px high, so a `100vh` hero filled all three "screens", and content that
// appears on scroll (IntersectionObserver reveals, lazy images) never ran. Here the viewport is a real 1280×800: each screen
// is reached with mouse-wheel input (which also drives smooth-scroll libraries and inner scroll containers), given time to
// settle, and shot on its own; the shots are then stacked into one image in the same browser. No dependencies: Chrome is
// driven over the DevTools protocol with Node's built-in WebSocket.
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import zlib from 'node:zlib';

export const VIEWPORT = { width: 1280, height: 800 };
export const GAP = 8;
// Headless Chrome with the GPU disabled has no WebGL at all, so WebGL sites rendered black or a script error (A DAY, PR #356;
// MORIMICHI, #342). SwiftShader draws WebGL on the CPU; since Chrome 137 it must be asked for explicitly.
export const WEBGL_ARGS = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'];
const defaultChrome = process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
// Waits for `promise`, or `ms` at most; the timer is cleared so a finished capture does not keep the process alive.
const within = (promise, ms) => { let timer; return Promise.race([promise, new Promise(resolve => { timer = setTimeout(resolve, ms); })]).finally(() => clearTimeout(timer)); };

async function devtoolsPort(profile, child, ms) {
  const file = path.join(profile, 'DevToolsActivePort'), end = Date.now() + ms;
  while (Date.now() < end) {
    if (child.exitCode !== null || child.signalCode) throw new Error(`Chrome exited ${child.exitCode ?? child.signalCode}`);
    const text = await fs.readFile(file, 'utf8').catch(() => '');
    const [port, route] = text.split('\n');
    if (port && route) return `ws://127.0.0.1:${port.trim()}${route.trim()}`;
    await sleep(100);
  }
  throw new Error(`Chrome did not open its DevTools port within ${ms / 1000}s`);
}

const gone = pid => { try { process.kill(pid, 0); return false; } catch (error) { return error.code === 'ESRCH'; } };
// Chrome runs in its own process group; killing only the browser process left its helpers writing into the profile after it
// was deleted (33 such folders were left in TMPDIR by 2026-11-24). Kill the group, wait until it is gone, then delete.
async function stop(child, profile) {
  if (child.pid) {
    try { process.kill(-child.pid, 'SIGKILL'); } catch { try { child.kill('SIGKILL'); } catch {} }
    for (const end = Date.now() + 5000; Date.now() < end && !gone(-child.pid);) await sleep(50);
  }
  await fs.rm(profile, { recursive: true, force: true, maxRetries: 3 }).catch(() => {});
}

// Profiles a crashed or killed run could not delete; an hour is far longer than any capture.
async function sweep(dir = os.tmpdir(), age = 3600000) {
  const names = await fs.readdir(dir).catch(() => []);
  for (const name of names.filter(n => n.startsWith('site-capture-'))) {
    const at = path.join(dir, name), stat = await fs.stat(at).catch(() => null);
    if (stat?.isDirectory() && Date.now() - stat.mtimeMs > age) await fs.rm(at, { recursive: true, force: true }).catch(() => {});
  }
}

// Starts a headless Chrome on a fresh profile and returns its DevTools endpoint. A failed start is cleaned up and tried once
// more: on the 8 GB machine that runs the scheduled job, a cold start under memory pressure (swap nearly full) can stall.
export async function launch({ chrome = defaultChrome, viewport = VIEWPORT, args = [], startup = 45000, attempts = 2 } = {}) {
  let last;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    const profile = await fs.mkdtemp(path.join(os.tmpdir(), 'site-capture-'));
    const child = spawn(chrome, ['--headless=new', '--disable-gpu', ...WEBGL_ARGS, '--hide-scrollbars', '--mute-audio', '--no-first-run', '--no-default-browser-check',
      `--window-size=${viewport.width},${viewport.height}`, '--remote-debugging-port=0', `--user-data-dir=${profile}`, ...args, 'about:blank'], { stdio: 'ignore', detached: true });
    // A missing or unrunnable binary fails the capture instead of crashing the process with an unhandled 'error' event.
    const failed = new Promise((_, reject) => child.once('error', error => reject(new Error(`Chrome could not start: ${error.message}`))));
    failed.catch(() => {});
    try {
      const endpoint = await Promise.race([devtoolsPort(profile, child, startup), failed]);
      return { endpoint, pid: child.pid, profile, close: () => stop(child, profile) };
    } catch (error) {
      last = error;
      await stop(child, profile);
      if (/could not start/.test(error.message)) break;
    }
  }
  throw last;
}

// A minimal DevTools client over the browser endpoint, with flat sessions.
function connect(url) {
  const socket = new WebSocket(url), pending = new Map(), listeners = new Set();
  let next = 0;
  socket.addEventListener('message', ({ data }) => {
    const message = JSON.parse(data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id); pending.delete(message.id);
      message.error ? reject(new Error(message.error.message)) : resolve(message.result);
    } else if (message.method) for (const listener of listeners) listener(message);
  });
  socket.addEventListener('close', () => { for (const { reject } of pending.values()) reject(new Error('DevTools connection closed')); pending.clear(); });
  const opened = new Promise((resolve, reject) => { socket.addEventListener('open', resolve); socket.addEventListener('error', () => reject(new Error('DevTools connection failed'))); });
  const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
    const id = ++next; pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
  });
  return { opened, send, on: listener => (listeners.add(listener), () => listeners.delete(listener)), close: () => socket.close() };
}

async function openPage(client, viewport) {
  const { targetId } = await client.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await client.send('Target.attachToTarget', { targetId, flatten: true });
  const send = (method, params) => client.send(method, params, sessionId);
  await send('Emulation.setDeviceMetricsOverride', { ...viewport, deviceScaleFactor: 1, mobile: false });
  await Promise.all([send('Page.enable'), send('Network.enable'), send('Runtime.enable')]);
  // Track requests in flight so each screen can wait for its lazy images and fonts, without waiting on streams forever.
  const inflight = new Set(); let changed = Date.now();
  client.on(({ method, params, sessionId: from }) => {
    if (from !== sessionId) return;
    if (method === 'Network.requestWillBeSent') { inflight.add(params.requestId); changed = Date.now(); }
    if (method === 'Network.loadingFinished' || method === 'Network.loadingFailed') { inflight.delete(params.requestId); changed = Date.now(); }
  });
  const quiet = async (ms, max) => { const end = Date.now() + max; while (Date.now() < end && (inflight.size > 2 || Date.now() - changed < ms)) await sleep(100); };
  const evaluate = async expression => (await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result?.value;
  const loaded = () => new Promise(resolve => { const off = client.on(({ method, sessionId: from }) => { if (from === sessionId && method === 'Page.loadEventFired') { off(); resolve(); } }); });
  return { targetId, send, quiet, evaluate, loaded };
}

// The scroll position a visitor would see, whether the window or an inner container scrolls.
const scrolled = `(() => { let y = window.scrollY; for (const el of document.querySelectorAll('body, body *')) { if (el.scrollTop > y) y = el.scrollTop; } return Math.round(y); })()`;
const settled = `Promise.race([Promise.all([document.fonts?.ready, ...[...document.images].filter(i => !i.complete && i.getBoundingClientRect().top < innerHeight).map(i => new Promise(r => { i.addEventListener('load', r, { once: true }); i.addEventListener('error', r, { once: true }); }))]), new Promise(r => setTimeout(r, 3000))]).then(() => true)`;

// Stacks the screens with a thin grey line between them, so a hero that ends at the fold reads as one screen, not three.
export function sheetHtml(images, viewport = VIEWPORT) {
  const shots = images.map(b64 => `<img src="data:image/png;base64,${b64}" width="${viewport.width}" height="${viewport.height}">`).join('');
  return `<!doctype html><html><head><style>html,body{margin:0;background:#9a9a9a}img{display:block}img+img{margin-top:${GAP}px}</style></head><body>${shots}</body></html>`;
}
export const sheetHeight = (screens, viewport = VIEWPORT) => screens * viewport.height + (screens - 1) * GAP;

// Where the content sits: the tops of the page's first few hundred visible boxes. Comparing two of these tells whether a
// screen actually moved, including on sites that scroll with transforms and never change scrollY.
const layout = `(() => { const tops = []; for (const el of document.querySelectorAll('body *')) { const r = el.getBoundingClientRect(); if (r.width * r.height > 2000) tops.push(Math.round(r.top)); if (tops.length >= 400) break; } return tops; })()`;
// null when either measurement is missing (the page did not answer in time): unknown, never "did not move".
export function moved(before, after) {
  if (!before || !after) return null;
  if (before.offset !== after.offset) return true;
  const n = Math.min(before.tops?.length ?? 0, after.tops?.length ?? 0);
  let shifted = 0;
  for (let i = 0; i < n; i++) if (Math.abs(before.tops[i] - after.tops[i]) >= 50) shifted++;
  return n > 0 && shifted > n / 3;
}

// Enough of PNG to read Chrome's screenshots: 8-bit RGB or RGBA, not interlaced.
export function decodePng(buf) {
  const width = buf.readUInt32BE(16), height = buf.readUInt32BE(20), channels = { 2: 3, 6: 4 }[buf[25]];
  if (buf[24] !== 8 || !channels || buf[28] !== 0) throw new Error('unexpected PNG format');
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

// Whether an image has been drawn on: more than 1% of its pixels fall outside its most common colour (coarsely binned). A WebGL
// scene that is still loading shows one flat colour, usually black.
export function drawn(png) {
  const bins = new Map();
  for (let y = 0; y < png.height; y++) for (let x = 0; x < png.width; x++) {
    const [r, g, b] = png.at(x, y), key = (r >> 5) << 6 | (g >> 5) << 3 | b >> 5;
    bins.set(key, (bins.get(key) ?? 0) + 1);
  }
  const total = png.width * png.height;
  return total - Math.max(0, ...bins.values()) > total / 100;
}

// The largest visible canvas covering at least a quarter of the window, as a screenshot clip, or null.
const bigCanvas = `(() => { let best = null; for (const c of document.querySelectorAll('canvas')) { const r = c.getBoundingClientRect(), x = Math.max(0, r.left), y = Math.max(0, r.top), w = Math.min(innerWidth, r.right) - x, h = Math.min(innerHeight, r.bottom) - y; if (w > 0 && h > 0 && w * h >= innerWidth * innerHeight / 4 && getComputedStyle(c).visibility !== 'hidden' && (!best || w * h > best.width * best.height)) best = { x, y, width: w, height: h }; } return best; })()`;

// A full-screen entry gate ("Enter with sound / Without", "Skip intro", "Explore") hides the site on every screen (Rinat Seif,
// #356). This finds its button: short text that is only an entry word, inside a fixed or absolute layer that covers the window,
// or on a page that does not scroll yet, with few other things to click. The silent or plain choice wins over the others.
// Links to other pages are never chosen. Returns the button's centre and text, or null.
const gate = `(() => {
  const vw = innerWidth, vh = innerHeight, entry = /^(enter|enter (the )?(site|website|experience)|enter without (sound|audio|music)|without( sound| audio| music)?|no (sound|audio|music)|sound off|mute|silent|skip|skip intro|start|explore|continue|begin|进入|进入网站|跳过|开始|探索|静音进入)$/;
  const quiet = /without|no (sound|audio|music)|sound off|mute|silent|skip|跳过|静音/;
  const visible = el => { const r = el.getBoundingClientRect(), s = getComputedStyle(el); return r.width > 0 && r.height > 0 && r.bottom > 0 && r.right > 0 && r.top < vh && r.left < vw && s.visibility !== 'hidden' && Number(s.opacity) > 0.05; };
  const clickable = el => el.matches('a[href], button, [role=button], [onclick], input[type=button], input[type=submit]') || getComputedStyle(el).cursor === 'pointer';
  const elsewhere = el => { const a = el.closest('a[href]'); if (!a) return false; const h = a.getAttribute('href'); if (/^(#|javascript:)/i.test(h)) return false; try { const u = new URL(a.href); return u.origin !== location.origin || u.pathname !== location.pathname; } catch { return false; } };
  const scrolls = (document.scrollingElement?.scrollHeight ?? 0) > vh * 1.2 && !['hidden', 'clip'].includes(getComputedStyle(document.documentElement).overflowY) && !['hidden', 'clip'].includes(getComputedStyle(document.body).overflowY);
  const layer = el => { for (let p = el.parentElement; p && p !== document.documentElement; p = p.parentElement) { const s = getComputedStyle(p), r = p.getBoundingClientRect(); if (['fixed', 'absolute', 'sticky'].includes(s.position) && r.width >= vw * 0.9 && r.height >= vh * 0.9) return p; } return null; };
  const targets = [...document.querySelectorAll('body *')].slice(0, 5000).filter(el => clickable(el) && visible(el));
  let best = null;
  for (const el of targets) {
    const text = (el.innerText || el.value || el.getAttribute('aria-label') || '').toLowerCase().replace(/[^\\p{L}\\p{N}\\s']/gu, ' ').replace(/\\s+/g, ' ').trim();
    if (!text || text.length > 40 || !entry.test(text) || elsewhere(el)) continue;
    const box = layer(el), around = box ? targets.filter(t => box.contains(t)) : targets;
    if (!(box || !scrolls) || around.length > 8) continue;
    const score = quiet.test(text) ? 2 : 1, r = el.getBoundingClientRect();
    if (!best || score > best.score) best = { score, text: (el.innerText || el.value || el.getAttribute('aria-label')).trim().replace(/\\s+/g, ' '), x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
  }
  return best && { text: best.text, x: best.x, y: best.y };
})()`;

// Returns the stacked image's path and, per screen, the scroll offset it was taken at and whether the page moved to reach it
// (`moved[0]` is null, and so is any screen whose position could not be measured). A page that does not move after a second wheel pass and the Page Down key genuinely does not scroll
// (a fixed hero, a drag-to-explore scene); its screens repeat, and the screening prompt says so.
// `timeout` is the page's budget: a slow page spends it loading, the remaining waits shrink to fit, and the screens show what
// loaded by then (`late: true`). Only a browser that stops answering fails the capture, `hang` ms after the budget.
// `startup`: how long Chrome may take to open its DevTools port, per attempt (see launch).
// `gate`: the text of the entry-gate button clicked once before the first screen, or null. `canvas`: for a page whose first
// screen is mostly a canvas, whether it had drawn when shot ('drawn', or 'blank' when `paint` ms ran out), else null.
export async function captureScreens(url, file, { screens = 3, viewport = VIEWPORT, chrome = defaultChrome, settle = 1200, intro = 2500, paint = 12000, timeout = 75000, hang = 30000, args = [], startup = 45000 } = {}) {
  sweep();
  const browser = await launch({ chrome, viewport, args, startup });
  let client, timer, late = false;
  const deadline = Date.now() + timeout, left = () => deadline - Date.now();
  const budget = ms => { const rest = Math.max(0, Math.min(ms, left())); if (rest < ms) late = true; return rest; };
  const wait = ms => sleep(budget(ms));
  const work = (async () => {
    client = connect(browser.endpoint);
    await client.opened;
    const page = await openPage(client, viewport);
    const load = page.loaded();
    const { errorText } = await page.send('Page.navigate', { url });
    if (errorText) throw new Error(`Chrome could not open the page: ${errorText}`);
    await within(load, budget(25000));
    await page.quiet(500, budget(6000));
    await within(page.evaluate(settled), budget(4000));
    await wait(intro); // entrance animations on the first screen (fade or blur-in) usually run 1–2s
    const measure = expression => within(page.evaluate(expression).catch(() => undefined), 3000);
    const where = async () => { const offset = await measure(scrolled), tops = await measure(layout); return typeof offset === 'number' && Array.isArray(tops) ? { offset, tops } : null; };
    const center = { x: viewport.width / 2, y: viewport.height / 2 };
    // Wheel input in small steps, as a trackpad would send it; scroll-jacking sites ignore window.scrollTo.
    // Chrome acknowledges input once the page has handled it; a busy page can hold that for seconds, so input does not wait long.
    const input = (method, params) => within(page.send(method, params).catch(() => {}), 2000);
    const wheel = async () => {
      await input('Input.dispatchMouseEvent', { type: 'mouseMoved', ...center });
      for (let step = 0; step < 4; step++) {
        await input('Input.dispatchMouseEvent', { type: 'mouseWheel', ...center, deltaX: 0, deltaY: viewport.height / 4 });
        await sleep(120);
      }
    };
    const pageDown = async () => {
      for (const type of ['keyDown', 'keyUp']) await input('Input.dispatchKeyEvent', { type, key: 'PageDown', code: 'PageDown', windowsVirtualKeyCode: 34 });
    };
    // An entry gate is clicked once, at its centre with real mouse input, and the page gets the intro time again.
    const door = await measure(gate);
    if (door) {
      await input('Input.dispatchMouseEvent', { type: 'mouseMoved', x: door.x, y: door.y });
      for (const type of ['mousePressed', 'mouseReleased']) await input('Input.dispatchMouseEvent', { type, x: door.x, y: door.y, button: 'left', clickCount: 1 });
      await page.quiet(500, budget(4000)); await within(page.evaluate(settled), budget(3000)); await wait(intro);
    }
    // A canvas scene (WebGL on SwiftShader is slow) is shot once it shows more than one flat colour, within `paint` ms.
    const area = await measure(bigCanvas);
    let canvas = null;
    if (area) {
      const scale = Math.min(1, 96 / area.width), end = Date.now() + budget(paint);
      for (;;) {
        const shot = await within(page.send('Page.captureScreenshot', { format: 'png', clip: { ...area, scale } }).catch(() => null), 5000);
        canvas = shot?.data && drawn(decodePng(Buffer.from(shot.data, 'base64'))) ? 'drawn' : 'blank';
        if (canvas === 'drawn' || Date.now() + 500 >= end) break;
        await sleep(500);
      }
      if (canvas === 'drawn') await wait(Math.min(intro, 1500)); // let the first frames fade in
    }
    const rest = async () => { await wait(settle); await page.quiet(400, budget(3000)); await within(page.evaluate(settled), budget(3500)); };
    const shots = [], offsets = [], went = [];
    let here = await where();
    for (let i = 0; i < screens; i++) {
      if (i) {
        // A page still busy loading (seen under memory pressure) can drop the first wheel pass, so a screen that did not move
        // gets one more pass and then the keyboard before it is taken as it is.
        // Only a measured standstill earns another try; an unknown result is recorded as unknown, without moving again.
        let now, step;
        for (const move of [wheel, wheel, pageDown]) {
          await move(); await rest();
          now = await where(); step = moved(here, now);
          if (step !== false) break;
        }
        went.push(step); here = now;
      } else went.push(null);
      offsets.push(here?.offset ?? null);
      shots.push((await page.send('Page.captureScreenshot', { format: 'png' })).data);
    }
    const sheet = await openPage(client, { width: viewport.width, height: sheetHeight(screens, viewport) });
    const { frameTree } = await sheet.send('Page.getFrameTree');
    await sheet.send('Page.setDocumentContent', { frameId: frameTree.frame.id, html: sheetHtml(shots, viewport) });
    await sheet.evaluate(`Promise.all([...document.images].map(i => i.decode()))`);
    const { data } = await sheet.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    await fs.writeFile(file, Buffer.from(data, 'base64'));
    return { file, offsets, moved: went, late, gate: door?.text ?? null, canvas };
  })();
  try {
    return await Promise.race([work, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(`Chrome stopped answering (capture ran past ${(timeout + hang) / 1000}s)`)), timeout + hang); })]);
  } finally {
    clearTimeout(timer); client?.close();
    work.catch(() => {});
    await browser.close();
  }
}
