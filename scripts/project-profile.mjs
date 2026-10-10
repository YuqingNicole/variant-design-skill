import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const hash = value => createHash('sha256').update(value).digest('hex');
const excluded = /^(?:\.env(?:\..*)?|\.git|node_modules|dist|build|coverage|\.verification|\.history|secrets?|credentials?|.*\.(?:pem|key|p12))$/i;
function safeFile(root, relative) {
  if (typeof relative !== 'string' || path.isAbsolute(relative) || relative.split(/[\\/]/).some(p => p === '..' || excluded.test(p))) throw new Error('Excluded or outside-project path');
  const file = path.resolve(root, relative);
  let cursor = root;
  for (const part of path.relative(root, file).split(path.sep)) {
    cursor = path.join(cursor, part);
    if (fs.existsSync(cursor) && fs.lstatSync(cursor).isSymbolicLink()) throw new Error('Symlink paths are not inspected');
  }
  if (!fs.statSync(file).isFile() || fs.statSync(file).size > 1024 * 1024) throw new Error('Not a regular source file under 1 MiB');
  return file;
}

// A bounded lexical discovery pass, not a parser or complete dependency graph.
export function discoverProject(projectRoot, entry) {
  const root = fs.realpathSync(projectRoot);
  safeFile(root, entry);
  const files = {}, edges = [], unknowns = [];
  const unknown = (code, file, detail) => unknowns.push({ code, file, detail });
  const pending = [entry];
  for (const name of ['package.json', 'package-lock.json', 'pnpm-lock.yaml', 'yarn.lock', 'AGENTS.md']) if (fs.existsSync(path.join(root, name))) pending.push(name);
  let declarations = {};
  while (pending.length) {
    const relative = pending.shift();
    if (files[relative]) continue;
    if (Object.keys(files).length >= 150) { unknown('coverage-limit', relative, '150 files inspected; remaining dependencies require targeted review'); break; }
    let source;
    try { source = fs.readFileSync(safeFile(root, relative), 'utf8'); }
    catch { unknown('unreadable-or-excluded', relative, 'Not read; review scope without importing sensitive contents'); continue; }
    files[relative] = { sha256: hash(source) };
    if (relative === 'package.json') {
      try {
        const pkg = JSON.parse(source);
        // Store only known framework names; never copy arbitrary scripts, URLs or values.
        for (const name of ['vite', 'react', 'next', 'vue', 'svelte']) if (pkg.dependencies?.[name] || pkg.devDependencies?.[name]) declarations[name] = { declared: true, evidence: 'package.json' };
      } catch { unknown('invalid-package', relative, 'Cannot read package metadata'); }
    }
    if (!/\.(?:[cm]?[jt]sx?|html|css)$/.test(relative)) continue;
    if (/\bimport\s*\(|\brequire\s*\(/.test(source)) unknown('dynamic-or-commonjs', relative, 'Requires source review; runtime resolution is not inferred');
    const refs = [];
    if (/\.(?:[cm]?[jt]sx?)$/.test(relative)) for (const m of source.matchAll(/\b(?:import|export)\s+(?:[^;'"\n]*?\s+from\s*)?['"]([^'"\n]+)['"]/g)) refs.push(m[1]);
    if (/\.html$/.test(relative)) for (const m of source.matchAll(/<(?:script|link)\b[^>]*?\b(?:src|href)\s*=\s*['"]([^'"]+)['"]/gi)) refs.push(m[1]);
    if (/\.css$/.test(relative)) for (const m of source.matchAll(/@import\s+(?:url\(\s*)?['"]([^'"]+)['"]/g)) refs.push(m[1]);
    for (const ref of refs) {
      if (/^(?:https?:|data:|\/\/)/.test(ref)) { unknown('external-resource', relative, 'External resource not fetched'); continue; }
      if (!ref.startsWith('.') && !ref.startsWith('/')) { unknown('package-or-alias', relative, 'Package/alias resolution requires review'); continue; }
      const clean = ref.split(/[?#]/)[0];
      const base = path.posix.normalize(clean.startsWith('/') ? clean.slice(1) : path.posix.join(path.posix.dirname(relative), clean));
      const candidates = [base, ...['.tsx','.ts','.jsx','.js','.mjs','.css','/index.tsx','/index.ts','/index.jsx','/index.js'].map(ext => base + ext)];
      const found = candidates.find(candidate => { try { safeFile(root, candidate); return true; } catch { return false; } });
      if (found) { edges.push({ from: relative, to: found, kind: 'lexical-reference' }); pending.push(found); }
      else unknown('unresolved-reference', relative, 'A local reference could not be safely resolved');
    }
  }
  let workingTree = { status: 'unknown', entries: [] };
  try {
    const gitRoot = execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd: root, encoding: 'utf8', stdio: ['ignore','pipe','ignore'] }).trim();
    if (fs.realpathSync(gitRoot) === root) {
      const entries = execFileSync('git', ['-c','core.fsmonitor=false','status','--porcelain=v1','-z','--untracked-files=normal'], { cwd: root, encoding: 'utf8', stdio: ['ignore','pipe','ignore'], env: { ...process.env, GIT_OPTIONAL_LOCKS: '0' } }).split('\0');
      const statuses = [];
      for (let i = 0; i < entries.length; i++) {
        const item = entries[i]; if (!item) continue;
        const name = item.slice(3);
        if ('RC'.includes(item[0]) || 'RC'.includes(item[1])) i++;
        if (!name.split('/').some(p => excluded.test(p))) statuses.push({ path: name, status: item.slice(0,2) });
      }
      workingTree = { status: 'observed', entries: statuses };
    }
  } catch { /* absence of Git is an explicit coverage limitation */ }
  unknown('semantic-review', entry, 'Brand constraints, routes, providers, shared consumers and essential actions need agent review');
  unknown('runtime-unobserved', entry, 'No commands or browser interactions executed');
  return { schemaVersion: 1, identity: { root, entry, generatedAt: new Date().toISOString(), scanner: hash(fs.readFileSync(new URL(import.meta.url))) }, environment: { declarations, commands: 'not-executed' }, dependencyScope: { files, edges, coverage: 'bounded-lexical-only' }, workingTree, observations: [], unknowns, suitability: { generation: 'needs-task-and-semantic-review', preview: 'unverified', integration: 'unverified' } };
}

export function inspectProfile(profile) {
  if (profile?.schemaVersion !== 1 || !profile.identity?.root || !profile.dependencyScope?.files) throw new Error('Unsupported or malformed project profile');
  const current = discoverProject(profile.identity.root, profile.identity.entry);
  const reasons = [];
  for (const key of ['dependencyScope','workingTree','unknowns']) if (JSON.stringify(current[key]) !== JSON.stringify(profile[key])) reasons.push(key);
  if (current.identity.scanner !== profile.identity.scanner) reasons.push('scanner');
  return { status: reasons.length ? 'stale' : 'current-within-declared-scope', reasons, runtime: 'unverified' };
}
if (process.argv[1] && import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href) {
  try {
    const [command, root, entry] = process.argv.slice(2);
    const result = command === 'scan' ? discoverProject(root, entry) : command === 'status' ? inspectProfile(JSON.parse(fs.readFileSync(root, 'utf8'))) : (() => { throw new Error('Usage: project-profile.mjs scan <root> <entry> | status <profile.json>'); })();
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
    if (result.status === 'stale') process.exitCode = 2;
  } catch { console.error('Project discovery failed. Check arguments, schema and readable project paths.'); process.exitCode = 1; }
}
