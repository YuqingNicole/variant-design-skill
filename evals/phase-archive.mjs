// Host-owned, write-once source archives for native fixture phases. No commands are executed.
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { isDeepStrictEqual as same } from 'node:util';
import { localFile } from '../scripts/variant-history.mjs';

const policy = { anyDepth: ['.git', 'node_modules'], root: ['dist'] };
const need = (condition, message) => { if (!condition) throw new Error(message); };
const hash = (bytes, algorithm = 'sha256') => createHash(algorithm).update(bytes).digest('hex');
const canonical = value => Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])])) : value;
const digest = value => hash(JSON.stringify(canonical(value)));
const phaseName = value => typeof value === 'string' && /^[a-z][a-z0-9-]{0,63}$/.test(value);
const sha = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const inside = (root, target) => { const relative = path.relative(root, target); return !relative || (!relative.startsWith('..' + path.sep) && relative !== '..' && !path.isAbsolute(relative)); };
function exists(file) { try { fs.lstatSync(file); return true; } catch (error) { if (error.code === 'ENOENT') return false; throw error; } }

function freshDirectory(target, forbidden) {
  const absolute = path.resolve(target);
  need(!exists(absolute), 'Preserve existing phase archive or destination; use a new path');
  let parent = path.dirname(absolute);
  while (!exists(parent)) parent = path.dirname(parent);
  const resolved = path.join(fs.realpathSync(parent), path.relative(parent, absolute));
  need(forbidden.every(root => !inside(root, resolved)), 'Archive and materialization must stay outside their source roots');
  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  fs.mkdirSync(resolved, { mode: 0o700 });
  return resolved;
}

function inventory(root, exclude) {
  const directories = [], files = [], excluded = [];
  const walk = (directory, prefix = '') => {
    for (const name of fs.readdirSync(directory).sort()) {
      const relative = prefix ? `${prefix}/${name}` : name;
      need(!relative.includes('\\'), `Use normalized archive paths: ${relative}`);
      if (exclude && (policy.anyDepth.includes(name) || (!prefix && policy.root.includes(name)))) { excluded.push(relative); continue; }
      const file = localFile(root, relative), stat = fs.lstatSync(file);
      need(!stat.isSymbolicLink(), `Symlink not allowed in archive source: ${relative}`);
      if (stat.isDirectory()) { directories.push([relative, stat.mode & 0o777]); walk(file, relative); }
      else {
        need(stat.isFile(), `Only regular files and directories may be archived: ${relative}`);
        const bytes = fs.readFileSync(file);
        files.push([relative, { sha256: hash(bytes), bytes: bytes.length, mode: stat.mode & 0o777 }]);
      }
    }
  };
  walk(root);
  return { rootMode: fs.statSync(root).mode & 0o777, directories: Object.fromEntries(directories.sort(([a], [b]) => a.localeCompare(b))), files: Object.fromEntries(files.sort(([a], [b]) => a.localeCompare(b))), excluded: excluded.sort() };
}
const contents = ({ rootMode, directories, files }) => ({ rootMode, directories, files });

function copySource(from, to, recorded) {
  for (const file of Object.keys(recorded.directories).sort((a, b) => a.split('/').length - b.split('/').length)) fs.mkdirSync(localFile(to, file));
  for (const [relative, expected] of Object.entries(recorded.files)) {
    const file = localFile(from, relative), stat = fs.lstatSync(file);
    need(stat.isFile(), `Source is no longer a regular file: ${relative}`);
    const bytes = fs.readFileSync(file);
    need((stat.mode & 0o777) === expected.mode && bytes.length === expected.bytes && hash(bytes) === expected.sha256, `Source changed before archiving: ${relative}`);
    const destination = localFile(to, relative);
    fs.writeFileSync(destination, bytes, { flag: 'wx', mode: expected.mode }); fs.chmodSync(destination, expected.mode);
  }
  for (const [file, mode] of Object.entries(recorded.directories).sort(([a], [b]) => b.split('/').length - a.split('/').length)) fs.chmodSync(localFile(to, file), mode);
  fs.chmodSync(to, recorded.rootMode);
}

function checkSnapshot(root, snapshot) {
  need(snapshot && typeof snapshot === 'object' && !Array.isArray(snapshot) && Object.hasOwn(snapshot, 'context') && snapshot.files && typeof snapshot.files === 'object' && !Array.isArray(snapshot.files), 'Need the full host grader snapshot');
  const contextFile = localFile(root, 'variant-output/.variant-context.json');
  let context = null, contextError;
  if (exists(contextFile)) { try { context = JSON.parse(fs.readFileSync(contextFile, 'utf8')); } catch (error) { contextError = error.message; } }
  need(same(context, snapshot.context), 'Grader context differs from archived source');
  for (const [file, expected] of Object.entries(snapshot.files)) {
    need(file.startsWith('variant-output/') && /^[a-f0-9]{40}$/.test(expected), 'Invalid grader source fingerprint');
    need(hash(fs.readFileSync(localFile(root, file)), 'sha1') === expected, `Grader snapshot is stale: ${file}`);
  }
  return contextError;
}

function validateInventory(value) {
  const mode = value => Number.isInteger(value) && value >= 0 && value <= 0o777;
  need(value && mode(value.rootMode) && value.directories && value.files && !Array.isArray(value.directories) && !Array.isArray(value.files) && Array.isArray(value.excluded), 'Invalid phase inventory');
  for (const directoryMode of Object.values(value.directories)) need(mode(directoryMode), 'Invalid directory mode');
  for (const file of Object.values(value.files)) need(file && sha(file.sha256) && Number.isSafeInteger(file.bytes) && file.bytes >= 0 && mode(file.mode), 'Invalid file record');
}

export function createPhaseArchive(project, { directory, phase, snapshot } = {}) {
  need(phaseName(phase), 'Invalid archive phase');
  need(snapshot && typeof snapshot === 'object' && !Array.isArray(snapshot), 'Need the full host grader snapshot');
  const source = fs.realpathSync(project), snapshotText = JSON.stringify(snapshot, null, 2) + '\n';
  const savedSnapshot = JSON.parse(snapshotText), before = inventory(source, true);
  checkSnapshot(source, savedSnapshot);
  const root = freshDirectory(directory, [source]), copy = path.join(root, 'source'); fs.mkdirSync(copy, { mode: 0o700 });
  copySource(source, copy, before);
  need(same(contents(before), contents(inventory(copy, false))), 'Archive copy differs from source');
  need(same(before, inventory(source, true)), 'Project changed during archive capture');
  const contextError = checkSnapshot(copy, savedSnapshot);
  fs.writeFileSync(path.join(root, 'snapshot.json'), snapshotText, { flag: 'wx', flush: true });
  const manifest = { schemaVersion: 1, phase, project: source, createdAt: new Date().toISOString(), environment: { node: process.version }, policy, inventory: before, sourceDigest: digest(before), snapshot: { file: 'snapshot.json', sha256: hash(snapshotText) }, ...(contextError ? { contextError } : {}) };
  const text = JSON.stringify(manifest, null, 2) + '\n'; fs.writeFileSync(path.join(root, 'archive.json'), text, { flag: 'wx', flush: true });
  const data = { schemaVersion: 1, phase, directory: root, manifestSha256: hash(text), snapshotSha256: hash(snapshotText), sourceDigest: manifest.sourceDigest };
  const receiptText = JSON.stringify(data, null, 2) + '\n'; fs.writeFileSync(path.join(root, 'receipt.json'), receiptText, { flag: 'wx', flush: true });
  const receipt = { ...data, receiptSha256: hash(receiptText) };
  verifyPhaseArchive(receipt);
  return receipt;
}

export function verifyPhaseArchive(receipt) {
  need(receipt?.schemaVersion === 1 && phaseName(receipt.phase) && typeof receipt.directory === 'string' && path.isAbsolute(receipt.directory) && sha(receipt.manifestSha256) && sha(receipt.snapshotSha256) && sha(receipt.sourceDigest) && sha(receipt.receiptSha256), 'Missing or invalid phase archive receipt');
  const absolute = path.resolve(receipt.directory), parent = fs.realpathSync(path.dirname(absolute)), root = localFile(parent, path.basename(absolute));
  need(fs.statSync(root).isDirectory(), 'Archive root is not a directory');
  need(same(fs.readdirSync(root).sort(), ['archive.json', 'receipt.json', 'snapshot.json', 'source']), 'Unexpected phase archive entries');
  const rawReceipt = fs.readFileSync(localFile(root, 'receipt.json')), { receiptSha256, ...expected } = receipt;
  need(hash(rawReceipt) === receiptSha256 && same(JSON.parse(rawReceipt), expected), 'Archive receipt changed');
  const text = fs.readFileSync(localFile(root, 'archive.json'));
  need(hash(text) === receipt.manifestSha256, 'Archive manifest changed');
  const manifest = JSON.parse(text);
  need(manifest.schemaVersion === 1 && manifest.phase === receipt.phase && typeof manifest.project === 'string' && path.isAbsolute(manifest.project) && same(manifest.policy, policy) && manifest.snapshot?.file === 'snapshot.json', 'Invalid phase archive manifest');
  validateInventory(manifest.inventory);
  need(digest(manifest.inventory) === manifest.sourceDigest && manifest.sourceDigest === receipt.sourceDigest, 'Archive source digest differs');
  const raw = fs.readFileSync(localFile(root, 'snapshot.json'));
  need(hash(raw) === manifest.snapshot.sha256 && hash(raw) === receipt.snapshotSha256, 'Archive snapshot changed');
  const source = localFile(root, 'source'); need(fs.statSync(source).isDirectory(), 'Archive source is not a directory');
  need(same(contents(inventory(source, false)), contents(manifest.inventory)), 'Archived files, directories or modes changed');
  const snapshot = JSON.parse(raw), contextError = checkSnapshot(source, snapshot);
  need(Boolean(contextError) === Boolean(manifest.contextError), 'Archived context parsing changed');
  return { manifest, snapshot, source };
}

export function materializePhaseArchive(receipt, directory) {
  const archive = verifyPhaseArchive(receipt), target = freshDirectory(directory, [archive.manifest.project, fs.realpathSync(receipt.directory)]);
  copySource(archive.source, target, archive.manifest.inventory);
  need(same(contents(inventory(target, false)), contents(archive.manifest.inventory)), 'Materialized source differs from archive');
  verifyPhaseArchive(receipt);
  return { directory: target, snapshot: archive.snapshot, sourceDigest: receipt.sourceDigest };
}

export function gradePhaseArchives(receipts, reports) {
  return ['baseline', 'generate', 'deliver'].map(phase => {
    try {
      const { manifest } = verifyPhaseArchive(receipts?.[phase]);
      need(manifest.phase === phase, 'Archive belongs to a different phase');
      const fingerprint = reports?.[phase]?.fingerprint;
      need(fingerprint && typeof fingerprint === 'object' && !Array.isArray(fingerprint) && Object.keys(fingerprint).length, 'Missing host observation fingerprints');
      for (const [file, expected] of Object.entries(fingerprint)) need(sha(expected) && manifest.inventory.files[file]?.sha256 === expected, `Observation differs from phase archive: ${file}`);
      return { id: `archive:${phase}`, pass: true, details: [] };
    } catch (error) { return { id: `archive:${phase}`, pass: false, details: [String(receipts?.[phase]?.error ?? error.message)] }; }
  });
}
