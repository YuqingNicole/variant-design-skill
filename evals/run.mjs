#!/usr/bin/env node
// Runs the skill from this working tree in real agent CLIs on fixture projects, then grades each run.
// Usage: node evals/run.mjs [--agent claude,codex] [--fixture pulse,harbor,bakery] [--out <dir>] [--timeout-min 25] [--jobs 3] [--prepare-only]
// Each run costs real model usage (a Claude run has cost about $2–3). Results stay outside the repository.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { grade, loadFixture } from './grade.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..');
const args = process.argv.slice(2), opt = (name, fallback) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : fallback; };
const agents = opt('--agent', 'claude,codex').split(',');
const fixtures = opt('--fixture', fs.readdirSync(path.join(here, 'fixtures')).join(',')).split(',');
const out = path.resolve(opt('--out', path.join(os.tmpdir(), `variant-evals-${new Date().toISOString().replace(/[:.]/g, '-')}`)));
const timeoutMs = Number(opt('--timeout-min', 25)) * 60_000, jobs = Number(opt('--jobs', 3));
const shipped = /^(SKILL\.md|VERSION|skills\/|references\/|assets\/|scripts\/(?!.*\.test\.)[^/]+\.mjs$)/;
// Where each CLI discovers a project-level skill; `npx skills add` uses the same folders.
const installDir = { claude: '.claude/skills/variant-design', codex: '.agents/skills/variant-design' };

function prepare(fixture, agent) {
  const dir = path.join(out, `${fixture}-${agent}`);
  fs.cpSync(path.join(here, 'fixtures', fixture, 'project'), dir, { recursive: true });
  const git = (...a) => execFileSync('git', a, { cwd: dir, stdio: 'pipe' });
  git('init', '-q'); git('add', '-A'); git('-c', 'user.name=eval', '-c', 'user.email=eval@localhost', 'commit', '-qm', 'baseline');
  if (fs.existsSync(path.join(dir, 'package-lock.json'))) execFileSync('npm', ['ci', '--no-audit', '--no-fund', '--loglevel=error'], { cwd: dir, stdio: 'pipe' });
  // Install the working tree, including uncommitted changes, so a run tests exactly what is here.
  const files = execFileSync('git', ['ls-files', '-co', '--exclude-standard'], { cwd: repo, encoding: 'utf8' }).split('\n').filter(f => shipped.test(f) && fs.existsSync(path.join(repo, f)));
  for (const file of files) { const target = path.join(dir, installDir[agent], file); fs.mkdirSync(path.dirname(target), { recursive: true }); fs.copyFileSync(path.join(repo, file), target); }
  return dir;
}

function command(agent, prompt, dir) {
  // --setting-sources without "user" keeps ~/.claude/skills out, so a global install cannot shadow the copy under test.
  if (agent === 'claude') return ['claude', ['-p', '--dangerously-skip-permissions', '--setting-sources', 'project,local', '--output-format', 'stream-json', '--verbose', prompt]];
  return ['codex', ['exec', '--skip-git-repo-check', '-s', 'workspace-write', '-c', 'approval_policy="never"', '--json', '-o', path.join(dir, '..', `${path.basename(dir)}.last.txt`), prompt]];
}

function runAgent(agent, prompt, dir) {
  const transcript = path.join(out, `${path.basename(dir)}.jsonl`), log = fs.openSync(transcript, 'w'), err = fs.openSync(path.join(out, `${path.basename(dir)}.err`), 'w');
  const [bin, argv] = command(agent, prompt, dir), started = Date.now();
  return new Promise(resolve => {
    const child = spawn(bin, argv, { cwd: dir, stdio: ['ignore', log, err], detached: true });
    const timer = setTimeout(() => { try { process.kill(-child.pid, 'SIGTERM'); } catch {} }, timeoutMs);
    child.on('close', code => { clearTimeout(timer); resolve({ transcript, exit: code, seconds: Math.round((Date.now() - started) / 1000), timedOut: Date.now() - started >= timeoutMs }); });
  });
}

async function one(fixture, agent) {
  const config = loadFixture(fixture), dir = prepare(fixture, agent);
  if (args.includes('--prepare-only')) return { fixture, agent, dir };
  console.log(`▶ ${fixture} · ${agent}`);
  const run = await runAgent(agent, config.prompt, dir);
  const result = { fixture, agent, dir, ...run, ...grade(dir, { fixture: config, transcript: run.transcript }) };
  fs.writeFileSync(path.join(out, `${fixture}-${agent}.json`), JSON.stringify(result, null, 2));
  console.log(`${result.pass ? '✓' : '✗'} ${fixture} · ${agent} (${run.seconds}s${run.timedOut ? ', timed out' : ''})`);
  return result;
}

fs.mkdirSync(out, { recursive: true });
const queue = fixtures.flatMap(f => agents.map(a => [f, a])), results = [];
await Promise.all(Array.from({ length: Math.min(jobs, queue.length) }, async () => { while (queue.length) { const [f, a] = queue.shift(); results.push(await one(f, a)); } }));
if (args.includes('--prepare-only')) { for (const r of results) console.log(r.dir); process.exit(0); }

const ids = [...new Set(results.flatMap(r => r.checks.map(c => c.id)))];
const lines = [`| Run | ${ids.join(' | ')} | Recommends | Skill words read | Usage |`, `|---|${ids.map(() => '---').join('|')}|---|---|---|`,
  ...results.sort((a, b) => `${a.fixture}${a.agent}`.localeCompare(`${b.fixture}${b.agent}`)).map(r => `| ${r.fixture} · ${r.agent} | ${ids.map(id => { const c = r.checks.find(x => x.id === id); return c ? (c.pass ? '✓' : '✗') : '–'; }).join(' | ')} | ${r.recommendation ?? '–'} | ${r.reading ? `${r.reading.words} (${r.reading.files.length} files)` : '–'} | ${r.usage.costUsd != null ? `$${r.usage.costUsd.toFixed(2)}, ${r.usage.turns} turns` : r.usage.tokens ? `${r.usage.tokens} tokens` : '–'}, ${r.seconds}s |`)];
const failures = results.flatMap(r => r.checks.filter(c => !c.pass || c.details.some(d => d.startsWith('warning'))).map(c => `- ${r.fixture} · ${r.agent} · ${c.id}: ${c.details.join('; ') || 'failed'}`));
const summary = [`# Variant Design evals — ${new Date().toISOString()}`, '', lines.join('\n'), '', failures.length ? '## Details\n\n' + failures.join('\n') : 'All checks passed.', ''].join('\n');
fs.writeFileSync(path.join(out, 'summary.md'), summary);
console.log('\n' + summary + `\nResults: ${out}`);
process.exitCode = results.every(r => r.pass) ? 0 : 1;
