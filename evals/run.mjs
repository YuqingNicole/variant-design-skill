#!/usr/bin/env node
// Runs the skill from this working tree in real agent CLIs on fixture projects, then grades each run.
// Usage: node evals/run.mjs [--agent claude,codex] [--fixture pulse,harbor,bakery,ledger,harbor-chain] [--out <dir>] [--timeout-min 25] [--jobs 3] [--prepare-only] [--no-skill] [--install plugin] [--turns generate,pick]
// --install plugin (Claude only) installs the working tree as a Claude Code plugin from a local copy of .claude-plugin/marketplace.json, in each project's local scope, instead of copying it into .claude/skills.
// --no-skill runs the same agent on the same project without the skill and with the plain prompt in evals/blind/plain-prompt.txt (the blind-review control group).
// Each run costs real model usage (a Claude run has cost about $2–3). Results stay outside the repository.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { grade, gradeChain, loadFixture, snapshot, usage } from './grade.mjs';
import { capturePremium, premiumUndo } from './premium.mjs';
import { captureNativeVite, probeNativeDependencies } from './native-vite.mjs';
import { replayNativeDelivery } from './native-delivery.mjs';
import { createPhaseArchive } from './phase-archive.mjs';
import { armPreviewCleanup, observePreviewCleanup } from './preview-cleanup.mjs';
import { probeSharedDependencies } from './shared-dependencies.mjs';
import { probeDeliveryReceipts } from './delivery-receipts.mjs';
import { observeRuntimePlan } from './runtime-plans.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..');
const args = process.argv.slice(2), opt = (name, fallback) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : fallback; };
const agents = opt('--agent', 'claude,codex').split(',');
// Multi-turn fixtures cost several runs each, so they run only when named.
const fixtures = opt('--fixture', fs.readdirSync(path.join(here, 'fixtures')).filter(f => !loadFixture(f).turns).join(',')).split(',');
const out = path.resolve(opt('--out', path.join(os.tmpdir(), `variant-evals-${new Date().toISOString().replace(/[:.]/g, '-')}`)));
const timeoutMs = Number(opt('--timeout-min', 25)) * 60_000, jobs = Number(opt('--jobs', 3));
const shipped = /^(SKILL\.md|VERSION|skills\/|references\/|assets\/|scripts\/(?!.*\.test\.)[^/]+\.mjs$)/;
// Where each CLI discovers a project-level skill; `npx skills add` uses the same folders.
const installDir = { claude: '.claude/skills/variant-design', codex: '.agents/skills/variant-design', dsh: '.agents/skills/variant-design' };
const viaPlugin = opt('--install', 'project') === 'plugin';
const claudeConfig = process.env.CLAUDE_CONFIG_DIR ?? path.join(os.homedir(), '.claude');
const pluginCache = path.join(claudeConfig, 'plugins/cache/variant-design');
const plain = args.includes('--no-skill') ? fs.readFileSync(path.join(here, 'blind/plain-prompt.txt'), 'utf8').trim() : null;

// The working tree, including uncommitted changes, so a run tests exactly what is here.
const tree = test => execFileSync('git', ['ls-files', '-co', '--exclude-standard'], { cwd: repo, encoding: 'utf8' }).split('\n').filter(f => test(f) && fs.existsSync(path.join(repo, f)));
const copy = (files, root) => { for (const file of files) { const target = path.join(root, file); fs.mkdirSync(path.dirname(target), { recursive: true }); fs.copyFileSync(path.join(repo, file), target); } };

// A plugin install goes through Claude Code's own marketplace flow. It registers the marketplace in the runner's
// Claude config and caches the plugin there, so refuse to touch an existing one and remove ours afterwards.
function stageMarketplace() {
  const known = path.join(claudeConfig, 'plugins/known_marketplaces.json');
  if (fs.existsSync(known) && JSON.parse(fs.readFileSync(known, 'utf8'))['variant-design']) { console.error('A "variant-design" marketplace is already added to Claude Code. Remove it (claude plugin marketplace remove variant-design) before an --install plugin run.'); process.exit(2); }
  const root = path.join(out, 'marketplace');
  copy(tree(f => shipped.test(f) || /^(\.claude-plugin\/marketplace\.json|NOTICE|LICENSE|LICENSES\/)/.test(f)), root);
  return { root };
}
function removePlugin(dir) {
  try { execFileSync('claude', ['plugin', 'marketplace', 'remove', 'variant-design'], { cwd: dir, stdio: 'pipe' }); } catch (error) { console.error(`Could not remove the variant-design marketplace: ${error.stderr ?? error.message}`); }
  fs.rmSync(pluginCache, { recursive: true, force: true });
}

function prepare(fixture, agent) {
  const dir = path.join(out, `${fixture}-${agent}`);
  // A multi-turn fixture can reuse another fixture's project ("project": "harbor").
  fs.cpSync(path.join(here, 'fixtures', loadFixture(fixture).project ?? fixture, 'project'), dir, { recursive: true });
  const git = (...a) => execFileSync('git', a, { cwd: dir, stdio: 'pipe' });
  git('init', '-q'); git('add', '-A'); git('-c', 'user.name=eval', '-c', 'user.email=eval@localhost', 'commit', '-qm', 'baseline');
  if (fs.existsSync(path.join(dir, 'package-lock.json'))) execFileSync('npm', ['ci', '--prefer-offline', '--no-audit', '--no-fund', '--loglevel=error'], { cwd: dir, stdio: 'pipe' });
  if (plain) return { dir };
  if (!marketplace) { copy(tree(f => shipped.test(f)), path.join(dir, installDir[agent])); return { dir }; }
  // Local scope writes enabledPlugins to the project's .claude/settings.local.json, which --setting-sources project,local reads.
  for (const step of [['marketplace', 'add', marketplace.root], ['install', 'variant-design@variant-design']]) execFileSync('claude', ['plugin', ...step, '--scope', 'local'], { cwd: dir, stdio: 'pipe' });
  // Claude Code reads a plugin from a local directory marketplace in place; a GitHub install reads the same files from the plugin cache.
  return { dir, install: marketplace.root };
}

function command(agent, prompt, dir) {
  // --setting-sources without "user" keeps ~/.claude/skills out, so a global install cannot shadow the copy under test.
  if (agent === 'claude') return ['claude', ['-p', '--dangerously-skip-permissions', '--setting-sources', 'project,local', '--output-format', 'stream-json', '--verbose', prompt]];
  // --ignore-user-config, --ignore-rules and hooks off keep the runner's own Codex setup (MCP servers such as Computer Use,
  // plugin marketplaces, hooks, exec rules) out of the run; --ephemeral keeps runs out of the session history. Login still works.
  // DeepSeek Harness: the shipped headless profile answers one task; --json writes run events.
  if (agent === 'dsh') return ['dsh', ['headless', '--json', prompt]];
  return ['codex', ['exec', '--skip-git-repo-check', '-s', 'workspace-write', '-c', 'approval_policy="never"', '-c', 'features.hooks=false', '--ignore-user-config', '--ignore-rules', '--ephemeral', '--json', '-o', path.join(dir, '..', `${path.basename(dir)}.last.txt`), prompt]];
}

function runAgent(agent, prompt, dir, turn = '') {
  const name = path.basename(dir) + (turn && `.${turn}`), transcript = path.join(out, `${name}.jsonl`), log = fs.openSync(transcript, 'w'), err = fs.openSync(path.join(out, `${name}.err`), 'w');
  const [bin, argv] = command(agent, prompt, dir), started = Date.now();
  return new Promise(resolve => {
    const child = spawn(bin, argv, { cwd: dir, stdio: ['ignore', log, err], detached: true });
    const timer = setTimeout(() => { try { process.kill(-child.pid, 'SIGTERM'); } catch {} }, timeoutMs);
    child.on('close', code => { clearTimeout(timer); resolve({ transcript, exit: code, seconds: Math.round((Date.now() - started) / 1000), timedOut: Date.now() - started >= timeoutMs }); });
  });
}

async function one(fixture, agent) {
  const config = loadFixture(fixture), { dir, install } = prepare(fixture, agent);
  if (args.includes('--prepare-only')) return { fixture, agent, dir };
  console.log(`▶ ${fixture} · ${agent}`);
  if (config.turns && !plain) return chain(fixture, agent, config, dir, install);
  const run = await runAgent(agent, plain ?? config.prompt, dir);
  // The control group has no skill record to grade; keep what it cost.
  const result = plain ? { fixture, agent, dir, ...run, pass: true, checks: [], usage: usage(run.transcript), recommendation: null } : { fixture, agent, dir, ...run, ...grade(dir, { fixture: config, transcript: run.transcript, install }) };
  fs.writeFileSync(path.join(out, `${fixture}-${agent}.json`), JSON.stringify(result, null, 2));
  console.log(`${result.pass ? '✓' : '✗'} ${fixture} · ${agent} (${run.seconds}s${run.timedOut ? ', timed out' : ''})`);
  return result;
}

// One fresh agent process per turn, as a user returning to the project later would start one. A turn that fails or
// times out does not stop the chain: the later turns are graded on whatever it left, and its own checks show the failure.
async function chain(fixture, agent, config, dir, install) {
  if (config.runtimePlans && config.nativeVite) throw new Error('Use a dedicated runtime-plan fixture; native delivery and runtime-plan chains have different archive phases');
  const turns = [], started = Date.now(), initial = snapshot(dir), measurements = {};
  const archive = (phase, state) => {
    const directory = path.join(out, `${fixture}-${agent}.phases`, phase);
    try { return createPhaseArchive(dir, { directory, phase, snapshot: state }); }
    catch (error) { return { phase, directory, error: error.stack }; }
  };
  const native = async (phase, probe = false) => {
    const destination = path.join(out, `${fixture}-${agent}.native`, phase);
    let result;
    try { result = await (probe ? probeNativeDependencies : captureNativeVite)(dir, { out: destination, manifest: config.nativeVite.manifest, original: phase === 'baseline' }); }
    catch (error) { result = { error: error.stack }; }
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination + '.json', JSON.stringify(result, null, 2) + '\n', { flag: 'wx' });
    return result;
  };
  const capture = async phase => {
    try { return await capturePremium(dir, { ...config.styleBudget, out: path.join(out, `${fixture}-${agent}.browser`, phase) }); }
    catch (error) { return { error: error.message }; }
  };
  if (config.styleBudget) {
    if (config.styleBudget.variant !== 'B' || config.turns.length !== 1 || config.turns[0].id !== 'premium') throw new Error('The premium host contract requires one B refinement turn.');
    measurements.before = await capture('before');
    const work = path.join(dir, '.variant-work'); fs.mkdirSync(work, { recursive: true });
    for (const sample of measurements.before.samples ?? []) fs.writeFileSync(path.join(work, `style-before-${sample.viewport.width}.json`), JSON.stringify(sample.probe, null, 2));
  }
  if (config.nativeVite) {
    measurements.native = { archives: { baseline: archive('baseline', initial) } };
    measurements.native.baseline = await native('baseline');
  }
  if (config.runtimePlans) measurements.runtimePlans = { archives: { baseline: archive('baseline', initial) } };
  // --turns generate,pick runs a prefix of the chain, for a change that only touches its first turns.
  const only = opt('--turns', null)?.split(',');
  for (const turn of config.turns.filter(t => !only || only.includes(t.id))) {
    console.log(`  ↳ ${fixture} · ${agent} · ${turn.id}`);
    const run = await runAgent(agent, [turn.prompt, config.note].filter(Boolean).join(''), dir, turn.id);
    turns.push({ id: turn.id, transcript: run.transcript, exit: run.exit, seconds: run.seconds, timedOut: run.timedOut, snapshot: snapshot(dir) });
    if (config.runtimePlans) {
      measurements.runtimePlans.archives[turn.id] = archive(turn.id, turns.at(-1).snapshot);
      try { measurements.runtimePlans[turn.id] = await observeRuntimePlan(dir, { out: path.join(out, `${fixture}-${agent}.runtime-plans`, turn.id), phase: turn.id, mode: config.runtimePlans.mode ?? 'file', archive: measurements.runtimePlans.archives[turn.id] }); }
      catch (error) { measurements.runtimePlans[turn.id] = { error: error.stack }; }
    }
    if (config.nativeVite) {
      const saved = archive(turn.id, turns.at(-1).snapshot);
      measurements.native.archives[turn.id] = saved; turns.at(-1).archive = saved;
      if (turn.id !== 'cleanup') measurements.native[turn.id] = await native(turn.id);
      if (turn.id === 'cleanup' && config.previewOwnership) measurements.previewCleanup = { ...measurements.previewCleanup, after: observePreviewCleanup(dir, measurements.previewCleanup?.before) };
      if (turn.id === 'generate') measurements.native.probe = await native('probe', true);
      if (turn.id === 'deliver') {
        try { measurements.native.delivery = await replayNativeDelivery(dir, { out: path.join(out, `${fixture}-${agent}.native`, 'replay'), generated: turns.find(t => t.id === 'generate')?.snapshot, baseline: measurements.native.baseline, manifest: config.nativeVite.manifest, delivery: config.nativeVite.delivery }); }
        catch (error) { measurements.native.delivery = { error: error.stack }; }
        if (config.sharedDependencies) {
          try { measurements.sharedDependencies = await probeSharedDependencies(dir, { out: path.join(out, `${fixture}-${agent}.shared-dependencies`), generated: turns.find(t => t.id === 'generate')?.snapshot, baseline: measurements.native.baseline, manifest: config.nativeVite.manifest, delivery: config.nativeVite.delivery }); }
          catch (error) { measurements.sharedDependencies = { error: error.stack }; }
        }
        if (config.deliveryReceipts) {
          try { measurements.deliveryReceipts = await probeDeliveryReceipts(dir, { out: path.join(out, `${fixture}-${agent}.delivery-receipts`), generated: turns.find(t => t.id === 'generate')?.snapshot, baseline: measurements.native.baseline, manifest: config.nativeVite.manifest, delivery: config.nativeVite.delivery }); }
          catch (error) { measurements.deliveryReceipts = { error: error.stack }; }
        }
        if (config.previewOwnership) {
          try { measurements.previewCleanup = { before: armPreviewCleanup(dir, { baselineArchive: measurements.native.archives.baseline, manifest: config.nativeVite.manifest }) }; }
          catch (error) { measurements.previewCleanup = { before: { error: error.stack } }; }
        }
      }
    }
  }
  if (config.styleBudget) { measurements.after = await capture('after'); measurements.undo = premiumUndo(dir, initial, path.join(out, `${fixture}-${agent}.browser`), config.styleBudget.variant); }
  const result = { fixture, agent, dir, seconds: Math.round((Date.now() - started) / 1000), timedOut: turns.some(t => t.timedOut), ...gradeChain(dir, { turns, install, fixture: config, initial, measurements }), ...(config.styleBudget || config.nativeVite || config.runtimePlans ? { measurements } : {}), turns: turns.map(({ snapshot: s, ...t }) => ({ ...t, selectedVariant: s.context?.selectedVariant ?? null, designSystem: s.context?.designSystem ?? null, drift: s.drift })) };
  fs.writeFileSync(path.join(out, `${fixture}-${agent}.json`), JSON.stringify(result, null, 2));
  console.log(`${result.pass ? '✓' : '✗'} ${fixture} · ${agent} (${result.seconds}s${result.timedOut ? ', a turn timed out' : ''})`);
  return result;
}

if (viaPlugin && (plain || agents.some(a => a !== 'claude'))) { console.error('--install plugin is a Claude Code install: use it with --agent claude and without --no-skill.'); process.exit(2); }
fs.mkdirSync(out, { recursive: true });
const marketplace = viaPlugin ? stageMarketplace() : null;
const queue = fixtures.flatMap(f => agents.map(a => [f, a])), results = [];
try {
  await Promise.all(Array.from({ length: Math.min(jobs, queue.length) }, async () => { while (queue.length) { const [f, a] = queue.shift(); results.push(await one(f, a)); } }));
} finally {
  if (marketplace && !args.includes('--prepare-only')) removePlugin(out);
}
if (args.includes('--prepare-only')) { for (const r of results) console.log(r.dir); if (marketplace) console.log(`The plugin stays installed for these projects. Afterwards: claude plugin marketplace remove variant-design && rm -rf ${JSON.stringify(pluginCache)}`); process.exit(0); }

const ids = [...new Set(results.flatMap(r => r.checks.map(c => c.id)))];
const lines = [`| Run | ${ids.join(' | ')} | Recommends | Skill words read | Usage |`, `|---|${ids.map(() => '---').join('|')}|---|---|---|`,
  ...results.sort((a, b) => `${a.fixture}${a.agent}`.localeCompare(`${b.fixture}${b.agent}`)).map(r => `| ${r.fixture} · ${r.agent} | ${ids.map(id => { const c = r.checks.find(x => x.id === id); return c ? (c.pass ? '✓' : '✗') : '–'; }).join(' | ')} | ${r.recommendation ?? '–'} | ${r.reading ? `${r.reading.words} (${r.reading.files.length} files)` : '–'} | ${r.usage.costUsd != null ? `$${r.usage.costUsd.toFixed(2)}, ${r.usage.turns} turns` : r.usage.tokens ? `${r.usage.tokens} tokens` : '–'}, ${r.seconds}s |`)];
const failures = results.flatMap(r => r.checks.filter(c => !c.pass || c.details.some(d => d.startsWith('warning'))).map(c => `- ${r.fixture} · ${r.agent} · ${c.id}: ${c.details.join('; ') || 'failed'}`));
const summary = [`# Variant Design evals — ${new Date().toISOString()}`, '', lines.join('\n'), '', failures.length ? '## Details\n\n' + failures.join('\n') : 'All checks passed.', ''].join('\n');
fs.writeFileSync(path.join(out, 'summary.md'), summary);
console.log('\n' + summary + `\nResults: ${out}`);
process.exitCode = results.every(r => r.pass) ? 0 : 1;
