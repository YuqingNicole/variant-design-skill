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

export const VIEWPORT = { width: 1280, height: 800 };
export const GAP = 8;
const defaultChrome = process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
// Waits for `promise`, or `ms` at most; the timer is cleared so a finished capture does not keep the process alive.
const within = (promise, ms) => { let timer; return Promise.race([promise, new Promise(resolve => { timer = setTimeout(resolve, ms); })]).finally(() => clearTimeout(timer)); };

async function devtoolsPort(profile, child, ms) {
  const file = path.join(profile, 'DevToolsActivePort'), end = Date.now() + ms;
  while (Date.now() < end) {
    if (child.exitCode !== null) throw new Error(`Chrome exited ${child.exitCode}`);
    const text = await fs.readFile(file, 'utf8').catch(() => '');
    const [port, route] = text.split('\n');
    if (port && route) return `ws://127.0.0.1:${port.trim()}${route.trim()}`;
    await sleep(100);
  }
  throw new Error('Chrome did not open its DevTools port');
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

// Returns the stacked image's path and, per screen, the scroll offset it was taken at.
// `startup`: how long Chrome may take to open its DevTools port. A cold start on a busy CI runner, or under a scheduled job,
// took longer than 15 s (2026-11-24: the gallery job and CI both failed with "did not open its DevTools port").
export async function captureScreens(url, file, { screens = 3, viewport = VIEWPORT, chrome = defaultChrome, settle = 1200, intro = 2500, timeout = 75000, args = [], startup = 45000 } = {}) {
  const profile = await fs.mkdtemp(path.join(os.tmpdir(), 'site-capture-'));
  const child = spawn(chrome, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--mute-audio', '--no-first-run', '--no-default-browser-check',
    `--window-size=${viewport.width},${viewport.height}`, '--remote-debugging-port=0', `--user-data-dir=${profile}`, ...args, 'about:blank'], { stdio: 'ignore' });
  let client, timer;
  // A missing or unrunnable binary fails the capture instead of crashing the process with an unhandled 'error' event.
  const failed = new Promise((_, reject) => child.once('error', error => reject(new Error(`Chrome could not start: ${error.message}`))));
  const work = (async () => {
    client = connect(await Promise.race([devtoolsPort(profile, child, startup), failed]));
    await client.opened;
    const page = await openPage(client, viewport);
    const load = page.loaded();
    const { errorText } = await page.send('Page.navigate', { url });
    if (errorText) throw new Error(`Chrome could not open the page: ${errorText}`);
    await within(load, 25000);
    await page.quiet(500, 6000);
    await within(page.evaluate(settled), 4000);
    await sleep(intro); // entrance animations on the first screen (fade or blur-in) usually run 1–2s
    const shots = [], offsets = [];
    for (let i = 0; i < screens; i++) {
      if (i) {
        // Wheel input in small steps, as a trackpad would send it; scroll-jacking sites ignore window.scrollTo.
        await page.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: viewport.width / 2, y: viewport.height / 2 });
        for (let step = 0; step < 4; step++) {
          await page.send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: viewport.width / 2, y: viewport.height / 2, deltaX: 0, deltaY: viewport.height / 4 });
          await sleep(120);
        }
        await sleep(settle);
        await page.quiet(400, 3000);
        await within(page.evaluate(settled), 3500);
      }
      offsets.push(await page.evaluate(scrolled) ?? 0);
      shots.push((await page.send('Page.captureScreenshot', { format: 'png' })).data);
    }
    const sheet = await openPage(client, { width: viewport.width, height: sheetHeight(screens, viewport) });
    const { frameTree } = await sheet.send('Page.getFrameTree');
    await sheet.send('Page.setDocumentContent', { frameId: frameTree.frame.id, html: sheetHtml(shots, viewport) });
    await sheet.evaluate(`Promise.all([...document.images].map(i => i.decode()))`);
    const { data } = await sheet.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    await fs.writeFile(file, Buffer.from(data, 'base64'));
    return { file, offsets };
  })();
  try {
    return await Promise.race([work, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(`capture took longer than ${timeout / 1000}s`)), timeout); })]);
  } finally {
    clearTimeout(timer); client?.close(); child.kill('SIGKILL');
    work.catch(() => {});
    failed.catch(() => {});
    if (child.pid) await new Promise(resolve => (child.exitCode !== null || child.signalCode ? resolve() : child.once('exit', resolve)));
    await fs.rm(profile, { recursive: true, force: true }).catch(() => {});
  }
}
