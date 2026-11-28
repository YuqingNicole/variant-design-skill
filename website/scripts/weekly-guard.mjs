#!/usr/bin/env node
// Decides whether a scheduled weekly job (run-sites-weekly.sh, run-x-weekly.sh, run-threads-weekly.sh) should go on.
// On 2026-11-27 the gallery job opened #347 with all 10 candidates left pending ("Chrome did not open its DevTools port
// within 45s") while swap stood at ~28 GB on this 8 GB Mac, and 8 of the 10 were already in the still-open #342. So a run
// now stops before it starts when the machine is short on memory or the last weekly pull request is still open, and opens
// no pull request when most candidates could not be read. A skip changes nothing: the candidates stay for the next run.
// Usage: weekly-guard.mjs memory [--tries n] [--wait seconds] | open-pr <source> | results <report-file>
// Exit status: 0 go on, 3 skip this run (the reason is printed), 2 bad usage.
import fs from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { pathToFileURL } from 'node:url';

export const SKIP = 3;
// Pressure level 2 (warn) is this machine's normal state; 4 is critical. 12 GB of swap is 1.5× its RAM (3 GB on a normal day).
export const LIMITS = { level: 4, freePercent: 10, swapMB: 12 * 1024 };

const run = promisify(execFile);
const sh = (file, args) => run(file, args, { timeout: 30000 }).then(r => r.stdout, () => '');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// Reads the three macOS signals; a value the machine does not report stays null and does not count against the run.
export function parseMemory({ level = '', pressure = '', swap = '' } = {}) {
  const num = (re, text) => { const m = re.exec(text); return m ? Number(m[1]) : null; };
  return {
    level: num(/^\s*(\d+)\s*$/, level),
    freePercent: num(/free percentage:\s*(\d+)%/, pressure),
    swapMB: num(/used\s*=\s*([\d.]+)M/, swap),
  };
}

export async function readMemory() {
  const [level, pressure, swap] = await Promise.all([sh('sysctl', ['-n', 'kern.memorystatus_vm_pressure_level']), sh('memory_pressure', ['-Q']), sh('sysctl', ['-n', 'vm.swapusage'])]);
  return parseMemory({ level, pressure, swap });
}

export function memoryVerdict(m, limits = LIMITS) {
  const why = [];
  if (m.level != null && m.level >= limits.level) why.push(`memory pressure is critical (level ${m.level})`);
  if (m.freePercent != null && m.freePercent < limits.freePercent) why.push(`only ${m.freePercent}% of memory is free (under ${limits.freePercent}%)`);
  if (m.swapMB != null && m.swapMB >= limits.swapMB) why.push(`swap holds ${(m.swapMB / 1024).toFixed(1)} GB (limit ${limits.swapMB / 1024} GB)`);
  return { ok: !why.length, reason: why.join('; ') };
}

// Reads memory up to `tries` times, `wait` ms apart, and stops at the first good reading.
export async function waitForMemory({ tries = 3, wait = 600000, read = readMemory, pause = sleep, log = console.log, limits = LIMITS } = {}) {
  let verdict;
  for (let i = 1; i <= tries; i++) {
    verdict = memoryVerdict(await read(), limits);
    if (verdict.ok) return verdict;
    log(`Memory check ${i}/${tries}: ${verdict.reason}.`);
    if (i < tries) await pause(wait);
  }
  return verdict;
}

// `report` is threads-publish.mjs or x-publish.mjs output; its first line is "Accepted a, rejected r, left pending k."
// A run where nothing was decided, or at least half was left pending, is a machine or network fault, not a week's result.
// No summary means the publisher died first (the wrappers pipe it through `tee`, which hides its exit status).
export function resultsVerdict(report) {
  const m = /Accepted (\d+), rejected (\d+), left pending (\d+)\./.exec(String(report ?? ''));
  if (!m) return { ok: false, reason: 'the screening step printed no summary, so it did not finish' };
  const [accepted, rejected, kept] = m.slice(1).map(Number), decided = accepted + rejected, total = decided + kept;
  if (!kept) return { ok: true, reason: '' };
  if (!decided) return { ok: false, reason: `none of ${total} candidates could be screened` };
  if (kept * 2 >= total) return { ok: false, reason: `${kept} of ${total} candidates could not be screened` };
  return { ok: true, reason: '' };
}

// `prs`: open pull requests as `gh pr list --json number,headRefName` gives them.
export function openWeeklyPr(prs, source) {
  const prefix = `codex/${source}-weekly-`;
  return prs.find(pr => String(pr.headRefName ?? '').startsWith(prefix)) ?? null;
}

async function listOpenPrs() {
  const { stdout } = await run('gh', ['pr', 'list', '--state', 'open', '--limit', '1000', '--json', 'number,headRefName'], { timeout: 60000 });
  return JSON.parse(stdout);
}

export async function main(argv, { log = console.log, read = readMemory, pause = sleep, prs = listOpenPrs } = {}) {
  const [command, ...rest] = argv, at = flag => rest[rest.indexOf(flag) + 1];
  if (command === 'memory') {
    const tries = rest.includes('--tries') ? Number(at('--tries')) : 3, wait = rest.includes('--wait') ? Number(at('--wait')) : 600;
    if (!Number.isInteger(tries) || tries < 1 || !(wait >= 0)) return 2;
    const verdict = await waitForMemory({ tries, wait: wait * 1000, read, pause, log });
    if (verdict.ok) return 0;
    log(`Skipped this run: the machine is short on memory (${verdict.reason}); Chrome would not start reliably. No pull request; the next run tries again.`);
    return SKIP;
  }
  if (command === 'open-pr' && /^[a-z]+$/.test(rest[0] ?? '')) {
    const open = openWeeklyPr(await prs(), rest[0]);
    if (!open) return 0;
    log(`Skipped this run: the last ${rest[0]} pull request (#${open.number}, ${open.headRefName}) is still open; merge or close it first, so the same candidates do not land in two pull requests.`);
    return SKIP;
  }
  if (command === 'results' && rest[0]) {
    const verdict = resultsVerdict(await fs.readFile(rest[0], 'utf8'));
    if (verdict.ok) return 0;
    log(`No pull request this run: ${verdict.reason}, most likely Chrome or the network failing on this machine. They stay pending for the next run.`);
    return SKIP;
  }
  console.error('Usage: weekly-guard.mjs memory [--tries n] [--wait seconds] | open-pr <source> | results <report-file>');
  return 2;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) process.exitCode = await main(process.argv.slice(2));
