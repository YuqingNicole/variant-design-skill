// Host-owned observations for the self-authored native-vite fixture, not a universal app grader.
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { createHash, randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { localFile } from '../scripts/variant-history.mjs';
import { gradeNativeDelivery, nativeOriginalFiles } from './native-delivery.mjs';

const here = path.dirname(fileURLToPath(import.meta.url)), worker = path.join(here, 'native-vite-worker.mjs');
const ids = ['A', 'B', 'C'], widths = [1440, 390];
const need = (condition, message) => { if (!condition) throw new Error(message); };
const hash = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const json = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const existing = (project, file) => { const full = localFile(project, file); need(fs.statSync(full).isFile(), `Not a file: ${file}`); return full; };
const outputDir = (project, out) => {
  const outside = target => { const relative = path.relative(project, target); return relative === '..' || relative.startsWith('..' + path.sep) || path.isAbsolute(relative); };
  need(out && outside(path.resolve(out)), 'Host evidence must stay outside the Agent project');
  fs.mkdirSync(out, { recursive: true });
  need(outside(fs.realpathSync(out)), 'Host evidence must stay outside the Agent project');
  need(!fs.readdirSync(out).length, 'Preserve existing native evidence; choose a new empty output directory');
};

export function nativeManifest(project, file = '.variant-work/native-preview.json') {
  const value = json(existing(project, file));
  need(value.schemaVersion === 1, 'Native manifest needs schemaVersion 1');
  need(value.entries && ids.every(id => typeof value.entries[id] === 'string') && Object.keys(value.entries).length === 3, 'Need exactly A/B/C native entries');
  const pages = [value.compare, ...ids.map(id => value.entries[id])];
  need(new Set(pages).size === 4 && pages.every(p => typeof p === 'string' && p.startsWith('.variant-work/') && p.endsWith('.html')), 'Need distinct comparison and A/B/C HTML files under .variant-work/');
  need(Array.isArray(value.adapterFiles) && value.adapterFiles.length && new Set(value.adapterFiles).size === value.adapterFiles.length, 'List unique native adapter files');
  need(value.adapterFiles.every(p => typeof p === 'string' && p.startsWith('.variant-work/')), 'Native adapters belong under .variant-work/');
  need(Array.isArray(value.dependencies) && value.dependencies.length && new Set(value.dependencies).size === value.dependencies.length, 'List native dependencies');
  for (const p of [...pages, value.buildConfig, value.typecheckConfig, ...value.adapterFiles, ...value.dependencies]) existing(project, p);
  need([value.buildConfig, value.typecheckConfig].every(p => p.startsWith('.variant-work/')), 'Isolated configurations belong under .variant-work/');
  const required = ['src/workspace.tsx', 'src/workspaces.json', 'src/global.css', 'src/workshop-mark.svg', 'vite.config.ts', 'tsconfig.json'];
  need(required.every(p => value.dependencies.includes(p)), 'Native dependency manifest must include original provider/data/style/asset/configuration');
  need([...pages, value.buildConfig, value.typecheckConfig].every(p => value.adapterFiles.includes(p)), 'Native adapter inventory must include each entry and isolated configuration');
  return value;
}

// Only this worker handle is stopped. No port scanning or killing a user's existing server.
async function viteProcess(project, config, { mode = 'serve', destination, timeout = 30000 } = {}) {
  const argv = [worker, mode, project, existing(project, config), ...(destination ? [destination] : [])];
  const child = spawn(process.execPath, argv, { cwd: project, stdio: ['ignore', 'pipe', 'pipe', 'ipc'] });
  let stdout = '', stderr = '', message, timedOut = false;
  child.stdout.on('data', b => { stdout = (stdout + b).slice(-100000); });
  child.stderr.on('data', b => { stderr = (stderr + b).slice(-100000); });
  const closed = new Promise(resolve => child.once('close', (exit, signal) => resolve({ command: [process.execPath, ...argv], exit, signal, stdout, stderr, timedOut, ...message })));
  const stop = async () => {
    if (child.exitCode !== null || child.signalCode) return closed;
    child.kill('SIGTERM'); const timer = setTimeout(() => child.kill('SIGKILL'), 5000);
    try { return await closed; } finally { clearTimeout(timer); }
  };
  const timer = setTimeout(() => { timedOut = true; child.kill('SIGTERM'); setTimeout(() => { if (child.exitCode === null) child.kill('SIGKILL'); }, 5000).unref(); }, timeout);
  const ready = new Promise((resolve, reject) => {
    child.on('message', value => { message = value; if (value.url) resolve(value); });
    child.once('error', reject);
    child.once('close', code => reject(new Error(`Native Vite ${mode} exited ${code}: ${stderr || stdout}`)));
  });
  if (mode === 'build') {
    // Build mode has no ready URL. Observe errors through the completion result.
    ready.catch(() => {});
    try { return await closed; } finally { clearTimeout(timer); }
  }
  try {
    const value = await ready; clearTimeout(timer);
    return { ...value, stop };
  } catch (error) { clearTimeout(timer); await stop(); throw error; }
}

async function typecheck(project, config) {
  const bin = existing(project, 'node_modules/typescript/bin/tsc'), argv = [bin, '--noEmit', '--listFiles', '-p', existing(project, config)];
  const child = spawn(process.execPath, argv, { cwd: project, stdio: ['ignore', 'pipe', 'pipe'] });
  let stdout = '', stderr = '', timedOut = false;
  child.stdout.on('data', b => { stdout = (stdout + b).slice(-100000); }); child.stderr.on('data', b => { stderr = (stderr + b).slice(-100000); });
  const timer = setTimeout(() => { timedOut = true; child.kill('SIGKILL'); }, 60000);
  try { return await new Promise((resolve, reject) => { child.once('error', reject); child.once('close', (exit, signal) => resolve({ command: [process.execPath, ...argv], exit, signal, timedOut, stdout, stderr, version: json(existing(project, 'node_modules/typescript/package.json')).version })); }); }
  finally { clearTimeout(timer); }
}

async function exercise(page, data) {
  const rows = page.getByTestId('invoice-row'), workspace = page.getByTestId('workspace-name');
  const name = async expected => { await page.waitForFunction(value => document.querySelector('[data-testid="workspace-name"]')?.textContent === value, expected); };
  const count = async expected => { await page.waitForFunction(n => [...document.querySelectorAll('[data-testid="invoice-row"]')].filter(e => e.getBoundingClientRect().height > 0).length === n, expected); };
  const row = id => page.locator(`[data-testid="invoice-row"][data-invoice-id="${id}"]`);
  const amount = cents => `USD ${(cents / 100).toFixed(2)}`;
  const records = async items => {
    await count(items.length); need(await rows.count() === items.length, 'All invoice rows must be present');
    for (const item of items) {
      const text = await row(item.id).innerText();
      need(text.includes(item.client) && text.includes(item.id) && text.includes(amount(item.cents)), `Missing invoice data: ${item.id}`);
      need((await row(item.id).getByTestId('invoice-status').innerText()).trim().toLowerCase() === item.status, `Wrong payment status: ${item.id}`);
    }
  };
  const total = async cents => { await page.waitForFunction(value => document.querySelector('[data-testid="open-total"]')?.textContent === value, amount(cents)); };
  await name(data.north.name); await records(data.north.invoices); await total(204000);
  need((await page.getByTestId('workspace-role').innerText()).includes('Owner'), 'North workspace must be owner');
  const search = page.getByRole('textbox', { name: 'Search invoices', exact: true }), status = page.getByRole('combobox', { name: 'Status', exact: true });
  // Reach the real search control with keyboard navigation, rather than focus() alone.
  for (let i = 0; i < 15 && !await search.evaluate(e => e === document.activeElement); i++) await page.keyboard.press('Tab');
  need(await search.evaluate(e => e === document.activeElement), 'Search is not reachable by Tab');
  need(await search.evaluate(e => getComputedStyle(e).outlineStyle !== 'none' || getComputedStyle(e).boxShadow !== 'none'), 'Keyboard focus needs a visible outline or shadow');
  await search.fill('Canopy'); await count(1); need(await row('N-104').isVisible(), 'Search did not find Canopy');
  await status.selectOption('paid'); await count(0); need(await page.getByTestId('empty-state').isVisible(), 'Combined filters need a visible empty state');
  await status.selectOption('all'); await search.fill(''); await records(data.north.invoices);
  await page.getByRole('button', { name: 'Mark N-104 paid', exact: true }).click();
  await total(84000); need((await row('N-104').getByTestId('invoice-status').innerText()).trim() === 'Paid', 'Owner payment state did not update');
  const picker = page.getByRole('combobox', { name: 'Workspace', exact: true });
  await picker.selectOption('south'); await name(data.south.name); await records(data.south.invoices); await total(140000);
  need((await page.getByTestId('workspace-role').innerText()).includes('Read only'), 'South workspace must be read only');
  for (const item of data.south.invoices.filter(i => i.status === 'open')) {
    const action = page.getByRole('button', { name: `Mark ${item.id} paid`, exact: true });
    need(await action.count() === 0 || await action.isDisabled(), 'Viewer must not have an enabled payment action');
  }
  await picker.selectOption('north'); await name(data.north.name); await total(84000);
  need((await row('N-104').getByTestId('invoice-status').innerText()).trim() === 'Paid', 'Workspace return lost payment state');
  need(await workspace.isVisible(), 'Workspace name must remain visible');
}

function observePage(page, base) {
  const errors = [], failedRequests = [], warnings = [], implicitIcon = url => url === new URL('favicon.ico', base).href;
  page.on('pageerror', error => errors.push(error.message));
  // Keep the optional implicit favicon warning visible without hiding application resource errors.
  page.on('console', message => { if (message.type() === 'error') (implicitIcon(message.location().url) ? warnings : errors).push(`${message.text()} ${message.location().url}`); });
  page.on('response', response => { if (response.status() >= 400) (response.status() === 404 && implicitIcon(response.url()) ? warnings : errors).push(`HTTP ${response.status()}: ${response.url()}`); });
  page.on('requestfailed', request => failedRequests.push(`${request.url()}: ${request.failure()?.errorText}`));
  return { errors, failedRequests, warnings };
}

export async function captureNativeVite(project, { out, browser, manifest, original = false, data, cssMarker, variants = ids, expectedVariant } = {}) {
  project = fs.realpathSync(project); outputDir(project, out);
  need(Array.isArray(variants) && variants.length && new Set(variants).size === variants.length && variants.every(id => ids.includes(id)), 'List unique A/B/C preview variants');
  need(expectedVariant === undefined || ids.includes(expectedVariant), 'Expected integrated identity must be A/B/C');
  const spec = original ? null : nativeManifest(project, manifest), own = !browser;
  const context = fs.existsSync(localFile(project, 'variant-output/.variant-context.json')) ? json(localFile(project, 'variant-output/.variant-context.json')) : null;
  const owned = context ? Object.values(context.variants ?? {}).flatMap(v => (v.files ?? []).map(file => `variant-output/${file}`)) : [];
  const inputs = [...nativeOriginalFiles, ...owned, ...(context ? ['variant-output/.variant-context.json'] : []), ...(spec ? [manifest ?? '.variant-work/native-preview.json', ...spec.adapterFiles, ...spec.dependencies] : [])];
  const fingerprint = Object.fromEntries([...new Set(inputs)].sort().map(file => [file, hash(existing(project, file))]));
  data ??= json(path.join(here, 'fixtures/native-vite/project/src/workspaces.json'));
  const checks = {}, samples = [], compare = [];
  let server;
  try {
    checks.originalTypecheck = await typecheck(project, 'tsconfig.json');
    checks.originalBuild = await viteProcess(project, 'vite.config.ts', { mode: 'build', destination: path.join(out, 'original-build'), timeout: 60000 });
    checks.originalBuild.outputs = fs.existsSync(path.join(out, 'original-build/index.html'));
    if (spec) {
      checks.previewTypecheck = await typecheck(project, spec.typecheckConfig);
      const required = ['src/main.tsx', 'src/App.tsx', 'src/workspace.tsx', ...spec.adapterFiles.filter(file => /\.[jt]sx$/.test(file)), ...owned.filter(file => /\.[jt]sx$/.test(file))];
      const listed = new Set(checks.previewTypecheck.stdout.split(/\r?\n/).map(file => path.resolve(file)));
      checks.previewTypecheck.coverage = { required, missing: required.filter(file => !listed.has(existing(project, file))) };
      checks.previewBuild = await viteProcess(project, spec.buildConfig, { mode: 'build', destination: path.join(out, 'preview-build'), timeout: 60000 });
      checks.previewBuild.outputs = ['index.html', spec.compare, ...Object.values(spec.entries)].every(file => fs.existsSync(path.join(out, 'preview-build', file)));
    }
    if (!browser) { const { chromium } = createRequire(path.join(here, '../tests/package.json'))('playwright'); browser = await chromium.launch(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {}); }
    server = await viteProcess(project, 'vite.config.ts');
    for (const width of widths) {
      for (const id of original ? ['original'] : variants) {
        const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' }), { errors, failedRequests, warnings } = observePage(page, server.url);
        page.setDefaultTimeout(5000);
        const sample = { id, width, url: new URL(original ? 'index.html' : spec.entries[id], server.url).href, task: false, identity: original, errors, failedRequests, warnings };
        try {
          await page.goto(sample.url, { waitUntil: 'load', timeout: 15000 });
          await page.getByTestId('workspace-name').waitFor();
          sample.markers = await page.locator('[data-native-variant]').evaluateAll(nodes => nodes.filter(node => { const box = node.getBoundingClientRect(), style = getComputedStyle(node); return box.width > 0 && box.height > 0 && style.visibility !== 'hidden'; }).map(node => node.getAttribute('data-native-variant')));
          if (!original || expectedVariant) sample.identity = sample.markers.length > 0 && sample.markers.every(value => value === (expectedVariant ?? id));
          await exercise(page, data); sample.task = true;
          sample.heading = await page.locator('h1').innerText();
          sample.brand = await page.evaluate(() => {
            const body = getComputedStyle(document.body), heading = document.querySelector('h1'), logo = document.querySelector('img[alt="Workshop mark"]');
            const first = text => text.split(',')[0].trim().replace(/^["']|["']$/g, '');
            return { bodyFont: first(body.fontFamily), headingFont: heading && first(getComputedStyle(heading).fontFamily), background: body.backgroundColor,
              marker: getComputedStyle(document.documentElement).getPropertyValue('--native-host-marker').trim(),
              logo: logo && { url: logo.currentSrc, loaded: logo.complete && logo.naturalWidth > 0 }, overflow: document.documentElement.scrollWidth > innerWidth };
          });
          // Vite may inline a small SVG as data:. Resolve the original asset through the same
          // real Vite transform, then compare the actual rendered URL rather than its spelling.
          sample.brand.originalLogo = await page.evaluate(async () => { const asset = await import('/src/workshop-mark.svg?import'); return new URL(asset.default, location.href).href; });
          if (cssMarker) need(sample.brand.marker === cssMarker, 'Preview did not load the changed original global CSS');
        } catch (error) { errors.push(error.message); }
        try { sample.screenshot = path.join(out, `${id}-${width}.png`); await page.screenshot({ path: sample.screenshot, fullPage: true }); }
        catch (error) { errors.push(error.message); }
        finally { await page.close(); }
        samples.push(sample);
      }
      if (spec) {
        const page = await browser.newPage({ viewport: { width, height: 900 } }), observations = observePage(page, server.url), { errors } = observations;
        const sample = { width, url: new URL(spec.compare, server.url).href, links: false, overflow: null, ...observations };
        try {
          await page.goto(sample.url);
          const targets = await page.locator('a[href]').evaluateAll(links => links.map(a => ({ url: a.href, visible: a.getBoundingClientRect().height > 0 })));
          sample.links = ids.every(id => targets.some(link => link.visible && link.url === new URL(spec.entries[id], server.url).href));
          sample.overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
          sample.screenshot = path.join(out, `compare-${width}.png`); await page.screenshot({ path: sample.screenshot, fullPage: true });
        } catch (error) { errors.push(error.message); }
        finally { await page.close(); }
        compare.push(sample);
      }
    }
    const changed = Object.keys(fingerprint).filter(file => hash(existing(project, file)) !== fingerprint[file]);
    const report = { source: 'host Playwright / original project Vite', environment: { browser: browser.version(), vite: server.version, node: process.version }, fingerprint, changed, checks, samples, compare };
    fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
    return report;
  } finally {
    const stopped = await server?.stop();
    if (stopped) fs.writeFileSync(path.join(out, 'server.json'), JSON.stringify(stopped, null, 2) + '\n');
    if (own) await browser?.close();
  }
}

export async function probeNativeDependencies(project, { out, browser, manifest } = {}) {
  project = fs.realpathSync(project); outputDir(project, out);
  const originalFiles = ['src/workspaces.json', 'src/global.css', 'src/workspace.tsx'];
  const before = Object.fromEntries(originalFiles.map(file => [file, hash(existing(project, file))]));
  const copy = path.join(out, 'project');
  fs.cpSync(project, copy, { recursive: true, filter: file => !['.git', 'node_modules'].includes(path.relative(project, file).split(path.sep)[0]) });
  fs.cpSync(path.join(project, 'node_modules'), path.join(copy, 'node_modules'), { recursive: true });
  const file = localFile(copy, 'src/workspaces.json'), data = json(file), nonce = randomUUID();
  data.north.name = `North ${nonce}`; data.south.name = `South ${nonce}`;
  fs.writeFileSync(file, JSON.stringify(data));
  // Probe the original provider too: a copied provider could still import the original JSON.
  const provider = existing(copy, 'src/workspace.tsx'), source = fs.readFileSync(provider, 'utf8'), anchor = 'return {id,workspace,invoices';
  need(source.split(anchor).length === 2, 'Original fixture provider changed; review the host probe before grading');
  fs.writeFileSync(provider, source.replace(anchor, `return {id,workspace:{...workspace,name:workspace.name+' Provider ${nonce}'},invoices`));
  for (const value of Object.values(data)) value.name += ` Provider ${nonce}`;
  const marker = `probe-${nonce}`; fs.appendFileSync(localFile(copy, 'src/global.css'), `\n:root{--native-host-marker:${marker}}\n`);
  const capture = await captureNativeVite(copy, { out: path.join(out, 'capture'), browser, manifest, data, cssMarker: marker });
  const after = Object.fromEntries(originalFiles.map(file => [file, hash(existing(project, file))]));
  const result = { ...capture, nonce, cssMarker: marker, originalBefore: before, originalAfter: after, sourceProjectUnchanged: originalFiles.every(file => before[file] === after[file]), copy };
  fs.writeFileSync(path.join(out, 'probe.json'), JSON.stringify(result, null, 2) + '\n', { flag: 'wx' });
  return result;
}

// Missing observations fail closed, including native delivery's independent replay.
export function gradeNativeVite(evidence) {
  const checks = [], add = (id, pass, details = []) => checks.push({ id, pass: Boolean(pass), details });
  const reports = ['baseline', 'generate', 'deliver', 'probe'];
  for (const phase of reports) {
    const report = evidence?.[phase], expected = phase === 'baseline' ? ['original'] : ids;
    const complete = !report?.error && report?.source === 'host Playwright / original project Vite' && Array.isArray(report.samples) && report.samples.length === expected.length * widths.length
      && expected.every(id => widths.every(width => report.samples.filter(s => s?.id === id && s.width === width).length === 1));
    add(`${phase}-observed`, complete, complete ? [] : [report?.error ?? 'Missing complete independent native browser observations']);
    if (!complete) continue;
    add(`${phase}-tasks`, report.samples.every(s => s.task && s.identity && Array.isArray(s.errors) && !s.errors.length && Array.isArray(s.failedRequests) && !s.failedRequests.length), report.samples.flatMap(s => (s.errors ?? []).map(e => `${s.id}/${s.width}: ${e}`)));
    add(`${phase}-brand-assets`, report.samples.every(s => s.brand?.bodyFont === 'Arial' && s.brand?.headingFont === 'Georgia' && s.brand?.background === 'rgb(247, 250, 252)' && s.brand?.logo?.loaded && s.brand?.originalLogo && s.brand.logo.url === s.brand.originalLogo), []);
    add(`${phase}-no-overflow`, report.samples.every(s => s.brand?.overflow === false), []);
    const expectedChecks = phase === 'baseline' ? ['originalTypecheck', 'originalBuild'] : ['originalTypecheck', 'originalBuild', 'previewTypecheck', 'previewBuild'];
    add(`${phase}-build-typecheck`, expectedChecks.every(key => report.checks?.[key]?.exit === 0 && report.checks[key].timedOut === false && report.checks[key].version), expectedChecks.filter(key => report.checks?.[key]?.exit !== 0).map(key => `${key}: ${report.checks?.[key]?.stderr ?? 'missing'}`));
    add(`${phase}-build-coverage`, report.checks?.originalBuild?.outputs === true && (phase === 'baseline' || (report.checks?.previewBuild?.outputs === true && Array.isArray(report.checks?.previewTypecheck?.coverage?.missing) && !report.checks.previewTypecheck.coverage.missing.length)), []);
    add(`${phase}-fresh`, Array.isArray(report.changed) && !report.changed.length && Object.keys(report.fingerprint ?? {}).length > 0, report.changed ?? []);
    if (phase !== 'baseline') add(`${phase}-comparison`, Array.isArray(report.compare) && report.compare.length === widths.length && widths.every(width => report.compare.some(s => s.width === width && s.links && s.overflow === false && Array.isArray(s.errors) && !s.errors.length && Array.isArray(s.failedRequests) && !s.failedRequests.length)), []);
    if (phase === 'probe') add('original-dependencies-reused', report.sourceProjectUnchanged && report.nonce && report.cssMarker && report.samples.every(s => s.brand?.marker === report.cssMarker), []);
  }
  const delivery = gradeNativeDelivery(evidence?.delivery); add('delivery-replayed', delivery.pass, delivery.details);
  return { pass: checks.every(check => check.pass), checks };
}
