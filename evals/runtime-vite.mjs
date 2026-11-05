// Trusted adapter for the original runtime-plan-vite fixture, not arbitrary Vite projects.
import fs from 'node:fs';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { localFile } from '../scripts/variant-history.mjs';
import { viteProcess, typecheck } from './native-vite.mjs';
import { materializePhaseArchive, verifyPhaseArchive } from './phase-archive.mjs';

const need = (v, message) => { if (!v) throw new Error(message); }, hash = b => createHash('sha256').update(b).digest('hex');
const read = (root, file) => fs.readFileSync(localFile(root, file));
export const runtimeViteOriginals = ['package.json', 'package-lock.json', 'index.html', 'vite.config.ts', 'tsconfig.json', 'src/main.tsx', 'src/App.tsx', 'src/review.tsx', 'src/review-data.json', 'src/global.css', 'src/env.d.ts'];
const original = new URL('./fixtures/runtime-plan-vite/project/', import.meta.url);
const held = (project, files) => Object.fromEntries(files.map(file => [file, hash(read(project, file))]));
const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const write = (file, value) => fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n', { flag: 'wx' });
const waitText = (page, id, value) => page.waitForFunction(({ id, value }) => document.querySelector(`[data-testid="${id}"]`)?.textContent === value, { id, value }, { timeout: 5000 });

async function probe(project, { archive, out, target, browser }) {
  const directory = path.join(out, 'probe'); fs.mkdirSync(directory);
  const copy = materializePhaseArchive(archive, path.join(directory, 'project')).directory;
  fs.cpSync(localFile(project, 'node_modules'), path.join(copy, 'node_modules'), { recursive: true });
  const nonce = randomUUID(), data = JSON.parse(read(copy, 'src/review-data.json'));
  data.title = `Data ${nonce}`; data.workspaces.studio.progress = 73; data.workspaces.studio.activity = 11; data.workspaces.archive.progress = 91; data.workspaces.archive.activity = 17;
  fs.writeFileSync(localFile(copy, 'src/review-data.json'), JSON.stringify(data));
  const provider = read(copy, 'src/review.tsx').toString(), anchor = 'title:data.title'; need(provider.split(anchor).length === 2, 'Original provider probe anchor changed');
  fs.writeFileSync(localFile(copy, 'src/review.tsx'), provider.replace(anchor, `${anchor}+' Provider ${nonce}'`));
  fs.appendFileSync(localFile(copy, 'src/global.css'), `\n:root{--runtime-host-marker:probe-${nonce}}\n`);
  let server, page, error; const observations = {}, errors = [];
  try {
    server = await viteProcess(copy, 'vite.config.ts'); page = await browser.newPage({ reducedMotion: 'no-preference', viewport: { width: 390, height: 844 }, serviceWorkers: 'block' }); page.setDefaultTimeout(5000);
    page.on('pageerror', e => errors.push(e.message)); page.on('requestfailed', r => errors.push(r.url()));
    await page.goto(new URL(target, server.url).href); await waitText(page, 'activity-count', '11');
    observations.heading = await page.locator('h1').innerText(); need(observations.heading.includes(`${data.title} Provider ${nonce}`), 'B does not reflect the actual original data and provider');
    observations.marker = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--runtime-host-marker').trim()); need(observations.marker === `probe-${nonce}`, 'B does not load original brand CSS');
    await waitText(page, 'progress', '73'); await page.getByRole('button', { name: 'Animate progress', exact: true }).click(); await waitText(page, 'progress', '50');
    await page.emulateMedia({ reducedMotion: 'reduce' }); await waitText(page, 'progress', '100');
    await page.getByRole('button', { name: 'Inspect activity', exact: true }).click(); await waitText(page, 'activity-count', '12');
    await page.getByLabel('Workspace', { exact: true }).selectOption('archive'); await waitText(page, 'workspace-role', 'Read only'); await waitText(page, 'activity-count', '17'); await waitText(page, 'progress', '91');
    observations.viewerHidden = await page.getByRole('button', { name: 'Animate progress', exact: true, includeHidden: true }).isHidden(); need(observations.viewerHidden, 'Viewer animation must remain hidden');
    await page.getByRole('button', { name: 'Inspect activity', exact: true }).click(); await waitText(page, 'activity-count', '18');
    await page.getByLabel('Workspace', { exact: true }).selectOption('studio'); await waitText(page, 'activity-count', '12'); observations.workspaceCounts = [12, 18];
    need(!errors.length, `Probe browser errors: ${errors.join('; ')}`);
    observations.screenshot = path.join(directory, 'B.png'); await page.screenshot({ path: observations.screenshot, fullPage: true });
  } catch (e) { error = e.stack; }
  finally { await page?.close(); if (server) await server.stop(); }
  verifyPhaseArchive(archive);
  const result = { pass: !error, nonce, copy, observations, errors, ...(error ? { error } : {}) }; write(path.join(directory, 'report.json'), result); return result;
}

export async function runtimeViteAdapter(project, { out, target, record, archive, browser, page }) {
  const saved = verifyPhaseArchive(archive); need(saved.manifest.project === project, 'Runtime archive belongs to another project');
  need(target.startsWith('.variant-work/preview/') && target.endsWith('.html'), 'Use an isolated HTML entry in .variant-work/preview');
  for (const file of runtimeViteOriginals) need(read(project, file).equals(fs.readFileSync(new URL(file, original))), `Original fixture changed: ${file}`);
  const files = Object.keys(record.fingerprint.dependencies).sort(), before = held(project, files);
  for (const [file, digest] of Object.entries(before)) need(saved.manifest.inventory.files[file]?.sha256 === digest, `Current source differs from phase archive: ${file}`);
  for (const [file, digest] of Object.entries(record.fingerprint.inputs)) need(saved.manifest.inventory.files[file]?.sha256 === digest, `Observation input differs from phase archive: ${file}`);
  const checks = { typecheck: await typecheck(project, 'tsconfig.json') };
  const context = JSON.parse(read(project, 'variant-output/.variant-context.json'));
  const required = ['src/main.tsx', 'src/App.tsx', 'src/review.tsx', ...Object.values(context.variants).flatMap(v => v.files.filter(file => /\.[jt]sx$/.test(file)).map(file => `variant-output/${file}`))];
  const listed = new Set(checks.typecheck.stdout.split(/\r?\n/).map(file => path.resolve(file)));
  checks.typecheck.coverage = { required, missing: required.filter(file => !listed.has(localFile(project, file))) };
  checks.build = await viteProcess(project, 'vite.config.ts', { mode: 'build', destination: path.join(out, 'build'), entries: ['index.html', target], timeout: 60000 });
  checks.build.outputs = ['index.html', target].every(file => fs.existsSync(path.join(out, 'build', file)));
  write(path.join(out, 'project-check.json'), checks);
  const versions = JSON.parse(read(project, 'package.json')).devDependencies;
  const passed = checks.typecheck.version === versions.typescript && checks.build.version === versions.vite && !checks.typecheck.exit && !checks.typecheck.signal && !checks.typecheck.timedOut && !checks.typecheck.coverage.missing.length && !checks.build.exit && !checks.build.signal && !checks.build.timedOut && checks.build.outputs;
  const server = await viteProcess(project, 'vite.config.ts'), errors = [], requests = [], pending = []; let readyCount = 0;
  const watch = response => {
    const url = response.url(); if (url === new URL('favicon.ico', server.url).href && response.status() === 404) return;
    if (response.status() >= 400) errors.push(`HTTP ${response.status()}: ${url}`);
    pending.push(response.body().then(body => requests.push({ url, status: response.status(), bytes: body.length, sha256: hash(body) })).catch(e => errors.push(`${url}: ${e.message}`)));
  };
  page.on('response', watch); page.on('pageerror', e => errors.push(e.message)); page.on('requestfailed', r => errors.push(`${r.url()}: ${r.failure()?.errorText}`));
  try { await page.route('**/*', route => new URL(route.request().url()).origin === new URL(server.url).origin ? route.continue() : route.abort()); } catch (error) { await server.stop(); throw error; }
  return {
    baseURL: server.url,
    ready: async current => {
      need(current.url() === new URL(target, server.url).href, 'Wrong Vite target'); await current.locator('h1').waitFor();
      await waitText(current, 'configuration', 'Original Vite configuration');
      const markers = await current.locator('[data-runtime-variant]').evaluateAll(nodes => nodes.map(el => el.getAttribute('data-runtime-variant'))); need(markers.length > 0 && markers.every(v => v === 'B'), 'Actual Vite direction is not B');
      need(await current.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Vite candidate overflows the declared viewport'); readyCount++;
    },
    projectChecks: async () => ({ id: 'project-checks', status: passed ? 'passed' : 'failed', reason: 'Original TypeScript check covers registered components; original Vite builds original and actual B entries', tool: { name: 'TypeScript and original Vite worker', version: `${checks.typecheck.version} / ${checks.build.version}` }, environment: { cwd: project, commands: [checks.typecheck.command, checks.build.command] }, evidence: [path.join(out, 'project-check.json')] }),
    finish: async () => {
      await Promise.all(pending); const dependencyProbe = await probe(project, { archive, out, target, browser });
      const after = held(project, files), unchanged = equal(before, after);
      const result = { pass: passed && readyCount > 0 && !errors.length && unchanged && dependencyProbe.pass, checks, environment: { url: server.url, vite: server.version, browser: browser.version(), node: process.version, transport: server.transport }, readyCount, requests, errors, sourceBefore: before, sourceAfter: after, unchanged, dependencyProbe, hostSha256: Object.fromEntries(['runtime-vite.mjs', 'native-vite.mjs', 'native-vite-worker.mjs'].map(file => [file, hash(fs.readFileSync(new URL(file, import.meta.url)))])) };
      write(path.join(out, 'vite.json'), result); return result;
    },
    stop: () => server.stop()
  };
}
