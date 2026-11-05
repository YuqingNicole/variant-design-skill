#!/usr/bin/env node
// Read-only local dependency identity. Project source and config are parsed, never imported.
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { cssReferences, htmlReferences, scriptReferences } from './dependency-references.mjs';

const factsFile = '.variant-work/dependency-resolution.json';
const forbidden = /^(?:\.env(?:\..*)?|\.git|node_modules|dist|build|coverage|\.verification|\.history|\.integrations|\.deliveries|\.runtime-plans|secrets?|credentials?|.*\.(?:pem|key|p12))$/i;
const sha = value => createHash('sha256').update(value).digest('hex');
const need = (test, message) => { if (!test) throw new Error(message); };
const sort = value => Array.isArray(value) ? value.map(sort) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(key => [key, sort(value[key])])) : value;
const identity = value => sha(JSON.stringify(sort(value)));
function safePath(root, relative) {
  need(typeof relative === 'string' && !path.isAbsolute(relative) && !/[\\\0:?#]/.test(relative) && !relative.split('/').some(p => !p || p === '.' || p === '..' || forbidden.test(p)), 'Unsafe dependency path; use safe normalized relative project paths');
  let cursor = root;
  for (const part of relative.split('/')) { cursor = path.join(cursor, part); try { need(!fs.lstatSync(cursor).isSymbolicLink(), 'Symlink dependency path'); } catch (error) { if (!['ENOENT', 'ENOTDIR'].includes(error.code)) throw error; } }
  return cursor;
}
function present(root, relative) { const file = safePath(root, relative); try { return fs.lstatSync(file).isFile(); } catch (error) { if (['ENOENT', 'ENOTDIR'].includes(error.code)) return false; throw error; } }
function bytes(file, maximum, textLimit) {
  const stat = fs.lstatSync(file); need(stat.isFile() && stat.size <= maximum, 'Dependency file limit');
  const digest = createHash('sha256'), chunk = Buffer.alloc(65536), parts = [], fd = fs.openSync(file, 'r'); let length = 0;
  try { let count; while ((count = fs.readSync(fd, chunk, 0, chunk.length, null))) { digest.update(chunk.subarray(0, count)); length += count; if (stat.size <= textLimit) parts.push(Buffer.from(chunk.subarray(0, count))); } } finally { fs.closeSync(fd); }
  need(fs.statSync(file).size === stat.size, 'Dependency changed while reading');
  need(length === stat.size, 'Dependency changed while reading');
  return { sha256: digest.digest('hex'), bytes: stat.size, ...(stat.size <= textLimit ? { text: Buffer.concat(parts).toString('utf8') } : {}) };
}
function compiler(root) {
  try {
    const require = createRequire(path.join(root, 'package.json')), file = require.resolve('typescript'), hash = sha(fs.readFileSync(file)), ts = require('typescript');
    need(Number(ts.version?.split('.')[0]) < 7 && ['createSourceFile', 'forEachChild', 'isStringLiteralLike', 'isImportDeclaration', 'isExportDeclaration', 'isCallExpression', 'isNewExpression', 'isMetaProperty', 'parseConfigFileTextToJson'].every(key => typeof ts[key] === 'function'), 'Unsupported compiler API');
    need(sha(fs.readFileSync(file)) === hash, 'Compiler changed while loading');
    return { ts, identity: { name: 'typescript', version: ts.version, sha256: hash } };
  } catch { return { identity: null }; }
}
const localExtensions = ['', '.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.cts', '.cjs', '.json', '/index.mjs', '/index.js', '/index.ts', '/index.tsx', '/index.jsx', '/index.json'];
const configNames = ['tsconfig.json', 'jsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json', ...['ts', 'mts', 'cts', 'js', 'mjs', 'cjs'].map(ext => `vite.config.${ext}`)];
export function collectProjectDependencies(project, entries, options = {}) {
  const root = fs.realpathSync(project), maxFiles = options.maxFiles ?? 256, maxBytes = options.maxBytes ?? 64 * 1024 * 1024, textLimit = 1024 * 1024;
  need(Number.isSafeInteger(maxFiles) && maxFiles > 0 && Number.isSafeInteger(maxBytes) && maxBytes > 0, 'Invalid dependency limits');
  need(Array.isArray(entries) && entries.length && entries.every(file => typeof file === 'string'), 'List dependency entry paths');
  need(entries.length <= maxFiles, 'Too many dependency entries');
  for (const file of entries) safePath(root, file);
  const files = {}, edges = [], unknowns = [], configFiles = new Set(), mappings = [], pending = [], queued = new Set(), configurations = new Set();
  const unknown = (code, file) => unknowns.push({ code, file });
  const enqueue = (file, config = false) => { safePath(root, file); if (config) configFiles.add(file); if (!queued.has(file)) { queued.add(file); pending.push(file); } };
  const tool = compiler(root), texts = new Map(); let totalBytes = 0, packageNames = new Set(), facts = null;
  const load = file => { if (!Object.hasOwn(files, file)) { need(Object.keys(files).length < maxFiles, 'Dependency file count limit'); const { text, ...record } = bytes(safePath(root, file), maxBytes - totalBytes, textLimit); files[file] = record; totalBytes += record.bytes; if (text !== undefined) texts.set(file, text); } return files[file]; };
  const textFile = file => { load(file); need(texts.has(file), 'Dependency configuration text limit'); return texts.get(file); };
  const parseJSON = (file, text) => { if (tool.ts) { const parsed = tool.ts.parseConfigFileTextToJson(file, text); need(!parsed.error, 'Invalid dependency configuration'); return parsed.config; } return JSON.parse(text); };
  if (present(root, 'package.json')) {
    try { const pkg = JSON.parse(textFile('package.json')); packageNames = new Set(['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'].flatMap(key => Object.keys(pkg[key] ?? {}))); }
    catch { unknown('invalid-package', 'package.json'); }
  }
  for (const file of ['package.json', 'package-lock.json', 'pnpm-lock.yaml', 'yarn.lock']) if (present(root, file)) enqueue(file);
  if (present(root, factsFile)) {
    facts = JSON.parse(textFile(factsFile));
    need(facts.schemaVersion === 1 && Object.keys(facts).every(key => ['schemaVersion', 'entries', 'aliases', 'configFiles'].includes(key)), 'Invalid dependency-resolution schema');
    for (const key of ['entries', 'configFiles']) need(facts[key] === undefined || Array.isArray(facts[key]) && facts[key].every(file => typeof file === 'string'), 'Dependency resolution needs relative path arrays');
    need(facts.aliases === undefined || facts.aliases && typeof facts.aliases === 'object' && !Array.isArray(facts.aliases), 'Dependency aliases must be an object');
    for (const [alias, destination] of Object.entries(facts.aliases ?? {})) { need(/^[\w@~-]+(?:\/[\w@~-]+)*$/.test(alias), 'Use literal alias prefixes'); safePath(root, destination); mappings.push({ pattern: alias, destinations: [destination], prefix: true }); }
    enqueue(factsFile); for (const file of facts.entries ?? []) enqueue(file); for (const file of facts.configFiles ?? []) enqueue(file, true);
  }
  for (const file of configNames) if (present(root, file)) enqueue(file, true);
  for (const file of [...new Set(entries)].sort()) enqueue(file);
  if (options.projectEntry !== false && present(root, 'index.html')) enqueue('index.html');
  const references = (from, parsed) => {
    for (const code of parsed.unknowns ?? []) unknown(code, from);
    if ((parsed.refs?.length ?? 0) > maxFiles) unknown('reference-count-limit', from);
    for (const reference of (parsed.refs ?? []).slice(0, maxFiles)) resolve(from, reference);
  };
  const resolve = (from, { value, kind }) => {
    if (!value || value.startsWith('#') && kind !== 'module-import') return;
    if (value.startsWith('data:')) { if (kind === 'module-import' || kind === 'html-script' || /^data:(?:text\/html|image\/svg)/i.test(value)) unknown('embedded-resource-needs-review', from); return; }
    if (/^[a-z][\w+.-]*:|^\/\//i.test(value)) { if (!value.startsWith('node:')) unknown('external-resource', from); return; }
    let clean;
    try { clean = decodeURIComponent(value.split(/[?#]/)[0]); } catch { unknown('invalid-resource-encoding', from); return; }
    if (/^\/(?:@fs|@id|@vite)(?:\/|$)/.test(clean)) { unknown('runtime-resolved-resource', from); return; }
    if (!clean || clean.includes('\\') || clean.includes('\0') || /[${}*]/.test(clean)) { unknown('dynamic-or-invalid-reference', from); return; }
    let bases = [];
    if (clean.startsWith('.')) bases = [path.posix.normalize(path.posix.join(path.posix.dirname(from), clean))];
    else if (clean.startsWith('/')) bases = [path.posix.normalize(clean.slice(1)), ...(kind !== 'module-import' ? [path.posix.normalize('public/' + clean.slice(1))] : [])];
    else if (kind !== 'module-import') bases = [path.posix.normalize(path.posix.join(path.posix.dirname(from), clean))];
    else {
      for (const map of mappings) {
        const star = map.pattern.indexOf('*'); let suffix = null;
        if (map.prefix && (clean === map.pattern || clean.startsWith(map.pattern + '/'))) suffix = clean.slice(map.pattern.length).replace(/^\//, '');
        else if (!map.prefix && star === -1 && clean === map.pattern) suffix = '';
        else if (!map.prefix && star >= 0 && clean.startsWith(map.pattern.slice(0, star)) && clean.endsWith(map.pattern.slice(star + 1))) suffix = clean.slice(star, clean.length - (map.pattern.length - star - 1));
        if (suffix !== null) for (const destination of map.destinations) bases.push(map.prefix ? path.posix.join(destination, suffix) : destination.replace('*', suffix));
      }
      if (!bases.length) {
        const name = clean.startsWith('@') ? clean.split('/').slice(0, 2).join('/') : clean.split('/')[0];
        if (!packageNames.has(name)) unknown('unresolved-package-or-alias', from);
        return;
      }
    }
    const found = new Set(); let unsafe = false;
    if (kind === 'module-import') bases = [...new Set(bases.flatMap(base => /\.[cm]?jsx?$/.test(base) ? [base, base.replace(/\.[cm]?jsx?$/, '')] : [base]))];
    for (const base of bases) for (const ext of kind === 'module-import' ? localExtensions : ['']) {
      const candidate = base + ext;
      try { if (present(root, candidate)) found.add(candidate); } catch { unsafe = true; }
    }
    if (unsafe) unknown('unsafe-local-reference', from);
    if (!found.size) unknown('unresolved-local-reference', from);
    if (found.size > 1) unknown('ambiguous-local-reference', from);
    for (const file of [...found].sort()) { edges.push({ from, to: file, kind }); enqueue(file); }
  };
  // Read config mappings before traversing imports, including explicit local extends/references.
  const configQueue = [...configFiles];
  const compilerInputs = (file, value) => {
    if (!tool.ts || typeof tool.ts.parseJsonConfigFileContent !== 'function' || typeof tool.ts.matchFiles !== 'function') { unknown('config-input-parser-unavailable', file); return; }
    const ts = tool.ts, base = path.dirname(safePath(root, file)); let directories = 0;
    const relative = full => { const rel = path.relative(root, path.resolve(full)).split(path.sep).join('/'); if (rel) safePath(root, rel); return rel; };
    const entries = directory => {
      try {
        relative(directory); if (++directories > maxFiles) { unknown('config-directory-limit', file); return { files: [], directories: [] }; }
        const found = { files: [], directories: [] };
        for (const item of fs.readdirSync(directory, { withFileTypes: true })) {
          if (forbidden.test(item.name)) continue;
          if (item.isSymbolicLink()) { unknown('linked-config-input', file); continue; }
          if (item.isFile()) found.files.push(item.name); else if (item.isDirectory()) found.directories.push(item.name);
        }
        return { files: found.files.sort(), directories: found.directories.sort() };
      } catch { unknown('unreadable-config-input-directory', file); return { files: [], directories: [] }; }
    };
    const host = { useCaseSensitiveFileNames: ts.sys.useCaseSensitiveFileNames,
      readDirectory: (directory, extensions, excludes, includes, depth) => ts.matchFiles(directory, extensions, excludes, includes, ts.sys.useCaseSensitiveFileNames, root, depth, entries, value => value),
      fileExists: full => { try { return present(root, relative(full)); } catch { return false; } },
      readFile: full => { try { return textFile(relative(full)); } catch { unknown('unreadable-config-input', file); return undefined; } } };
    const { extends: ignoredExtends, references: ignoredReferences, ...config } = value;
    const parsed = ts.parseJsonConfigFileContent(config, host, base, undefined, path.basename(file));
    const inputs = [...parsed.fileNames];
    for (const directory of value.compilerOptions?.typeRoots ?? []) {
      if (typeof directory !== 'string') { unknown('invalid-config-type-root', file); continue; }
      const full = path.resolve(base, directory);
      if (path.relative(root, full).split(path.sep).includes('node_modules')) continue;
      try { relative(full); inputs.push(...ts.matchFiles(full, ['.d.ts'], undefined, ['**/*.d.ts'], ts.sys.useCaseSensitiveFileNames, root, undefined, entries, value => value)); }
      catch { unknown('unsafe-config-type-root', file); }
    }
    const names = [...new Set(inputs)].sort();
    if (names.length > maxFiles) unknown('config-source-count-limit', file);
    for (const full of names.slice(0, maxFiles)) {
      try { const name = relative(full); enqueue(name); edges.push({ from: file, to: name, kind: 'config-source-input' }); }
      catch { unknown('unsafe-config-source-input', file); }
    }
  };
  for (let i = 0; i < configQueue.length; i++) {
    const file = configQueue[i]; if (configurations.has(file)) continue; configurations.add(file);
    if (configurations.size > maxFiles) { unknown('config-count-limit', file); break; }
    if (!file.endsWith('.json')) continue;
    try {
      const value = parseJSON(file, textFile(file));
      if (!/^(?:tsconfig|jsconfig)(?:\.[^/]*)?\.json$/.test(path.posix.basename(file)) && !['compilerOptions', 'include', 'files', 'extends', 'references'].some(key => Object.hasOwn(value, key))) continue;
      compilerInputs(file, value);
      const base = path.posix.join(path.posix.dirname(file), value.compilerOptions?.baseUrl ?? '.');
      for (const [pattern, destinations] of Object.entries(value.compilerOptions?.paths ?? {})) {
        need(Array.isArray(destinations) && destinations.every(item => typeof item === 'string') && (pattern.match(/\*/g)?.length ?? 0) <= 1, 'Invalid paths mapping');
        need(/^[\w@~./*-]+$/.test(pattern), 'Invalid alias pattern');
        const resolved = destinations.map(item => path.posix.normalize(path.posix.join(base, item)));
        for (const item of resolved) { need((item.match(/\*/g)?.length ?? 0) <= 1, 'Invalid paths destination'); safePath(root, item.replace('*', 'placeholder')); }
        mappings.push({ pattern, destinations: resolved, prefix: false });
      }
      const linked = [...(typeof value.extends === 'string' ? [value.extends] : Array.isArray(value.extends) ? value.extends : []), ...(value.references ?? []).map(ref => ref.path)];
      for (const ref of linked) {
        if (typeof ref !== 'string' || (!ref.startsWith('.') && !ref.startsWith('/'))) { unknown('package-config-needs-review', file); continue; }
        const candidate = path.posix.normalize(path.posix.join(path.posix.dirname(file), ref)), found = [candidate, candidate + '.json', candidate + '/tsconfig.json'].filter(name => { try { return present(root, name); } catch { return false; } });
        if (!found.length) { unknown('unresolved-config', file); continue; }
        for (const name of found) { enqueue(name, true); configQueue.push(name); edges.push({ from: file, to: name, kind: 'config-reference' }); }
      }
    } catch { unknown('invalid-or-unreadable-config', file); }
  }
  for (let i = 0; i < pending.length; i++) {
    const file = pending[i];
    if (i >= maxFiles) { unknown('file-count-limit', file); break; }
    let record, text;
    try { record = load(file); text = texts.get(file); if (text !== undefined) need(sha(text) === record.sha256 || !/\.(?:[cm]?[jt]sx?|css|html?|svg|json)$/.test(file), 'Invalid UTF-8 source'); }
    catch { unknown('unreadable-excluded-or-limit', file); continue; }
    if (/\.(?:[cm]?[jt]sx?|css|html?|svg)$/.test(file) && text === undefined) { unknown('source-text-limit', file); continue; }
    if (/\.[cm]?[jt]sx?$/.test(file)) {
      if (!tool.ts) unknown('compiler-unavailable', file); else references(file, scriptReferences(tool.ts, text, file, configFiles.has(file)));
    } else if (/\.css$/.test(file)) references(file, cssReferences(text));
    else if (/\.(?:html?|svg)$/.test(file)) { const parsed = htmlReferences(text); references(file, parsed); for (const script of parsed.scripts) { if (!tool.ts) unknown('compiler-unavailable', file); else references(file, scriptReferences(tool.ts, script, file + '.inline.js')); } }
    else if (/\.(?:vue|svelte|astro|scss|sass|less|styl|stylus|pcss|postcss|mdx|php|ejs|hbs)$/.test(file)) unknown('unsupported-source-syntax', file);
  }
  const unique = list => [...new Map(list.map(value => [JSON.stringify(sort(value)), value])).values()].sort((a, b) => JSON.stringify(sort(a)).localeCompare(JSON.stringify(sort(b))));
  const result = { schemaVersion: 1, entries: [...new Set(entries)].sort(), files: sort(files), edges: unique(edges),
    resolver: { code: Object.fromEntries(['project-dependencies.mjs', 'dependency-references.mjs'].map(file => [file, sha(fs.readFileSync(new URL(file, import.meta.url)))])), compiler: tool.identity },
    resolution: { factsFile: facts ? factsFile : null, aliases: sort(mappings), configFiles: [...configFiles].sort(), moduleCandidateExtensions: localExtensions },
    coverage: { status: unknowns.length ? 'partial' : 'within-supported-static-syntax', unknowns: unique(unknowns), limits: { files: maxFiles, bytes: maxBytes, textBytes: textLimit },
      limitation: 'Local static imports/URLs only. Candidate sets are conservative, not runtime resolution. Installed packages, environment, plugin-generated/dynamic dependencies and data-driven resources require separate review and fresh observations.' } };
  return { ...result, identity: identity(result) };
}
if (process.argv[1] && import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href) {
  try { const [project, ...entries] = process.argv.slice(2); if (!project || project === '--help' || !entries.length) { console.log('Usage: project-dependencies.mjs <project-root> <entry> [more-entries...]'); process.exitCode = project === '--help' ? 0 : 1; } else { const result = collectProjectDependencies(project, entries); console.log(JSON.stringify(result, null, 2)); if (result.coverage.status === 'partial') process.exitCode = 2; } }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
