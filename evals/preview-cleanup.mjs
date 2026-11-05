// Host-owned checks for the explicit native-vite-cleanup fixture; no Agent command is executed here.
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { localFile } from '../scripts/variant-history.mjs';
import { readPreviewReceipt } from '../scripts/preview-files.mjs';
import { verifyPhaseArchive } from './phase-archive.mjs';
import { nativeManifest } from './native-vite.mjs';
import { nativeOriginalFiles } from './native-delivery.mjs';

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const digest = (project, file) => hash(fs.readFileSync(localFile(project, file)));
const need = (condition, message) => { if (!condition) throw new Error(message); };
function artifact(project) {
  const files = [], walk = directory => { for (const entry of fs.readdirSync(localFile(project, directory), { withFileTypes: true })) { const file = `${directory}/${entry.name}`; if (entry.isDirectory()) walk(file); else { need(entry.isFile(), 'Variant output must contain regular files'); files.push(file); } } };
  walk('variant-output'); return Object.fromEntries(files.sort().map(file => [file, digest(project, file)]));
}
export function armPreviewCleanup(project, { baselineArchive, manifest = '.variant-work/native-preview.json' } = {}) {
  project = fs.realpathSync(project);
  const value = nativeManifest(project, manifest), group = value.ownershipGroup;
  need(typeof group === 'string' && /^[a-z0-9][a-z0-9-]{0,95}$/.test(group), 'Native preview needs a stable ownershipGroup');
  const pointer = JSON.parse(fs.readFileSync(localFile(project, `.variant-work/preview-files/${group}/current.json`)));
  const receipt = readPreviewReceipt(project, pointer.receipt), { manifest: baseline } = verifyPhaseArchive(baselineArchive);
  const expected = [...value.adapterFiles, manifest];
  need(expected.every(file => receipt.files[file]), 'Ownership receipt must cover every adapter and the native manifest');
  const plan = JSON.parse(fs.readFileSync(localFile(project, `.variant-work/preview-files/${group}/plan.json`)));
  need(plan.files.every(file => !baseline.inventory.files[file]), 'Ownership cannot adopt pre-existing project files');
  for (const [file, record] of Object.entries(receipt.files)) {
    need(file.startsWith('.variant-work/'), 'Native cleanup owns only isolated work files');
    need(!baseline.inventory.files[file], `Receipt claims an original file: ${file}`);
    const stat = fs.statSync(localFile(project, file), { bigint: true });
    need(digest(project, file) === record.sha256 && Number(stat.mode & 0o777n) === record.mode && String(stat.ino) === record.identity.ino && String(stat.dev) === record.identity.dev && String(stat.birthtimeNs) === record.identity.birthtimeNs, `Adapter changed before cleanup probe: ${file}`);
  }
  const edited = value.adapterFiles.find(file => /\.[jt]sx?$/.test(file) && !file.endsWith('.config.ts'));
  need(edited, 'Need an adapter source for the user-edit cleanup control');
  const helper = 'scripts/preview-files.mjs', installedHelper = ['.agents', '.claude', '.codex'].map(prefix => `${prefix}/skills/variant-design/${helper}`).find(file => fs.existsSync(localFile(project, file)));
  const ownHelper = hash(fs.readFileSync(fileURLToPath(new URL('../scripts/preview-files.mjs', import.meta.url))));
  need(installedHelper && digest(project, installedHelper) === ownHelper, 'Installed ownership helper differs from the host implementation');
  const original = Object.fromEntries(nativeOriginalFiles.map(file => [file, digest(project, file)])), variants = artifact(project);
  const source = fs.readFileSync(localFile(project, edited));
  fs.appendFileSync(localFile(project, edited), '\n// Host-simulated later user edit: preserve this adapter during cleanup.\n');
  const unknown = '.variant-work/user-preview-note.txt';
  fs.writeFileSync(localFile(project, unknown), 'User-owned preview note. Keep this file.\n', { flag: 'wx', flush: true });
  return { source: 'host-preview-cleanup-control-v1', at: new Date().toISOString(), project, receipt: pointer.receipt, receiptSha256: digest(project, pointer.receipt), group, edited, editedBeforeSha256: hash(source), editedAfterSha256: digest(project, edited), unknown, unknownSha256: digest(project, unknown), expectedRemoved: Object.keys(receipt.files).filter(file => file !== edited).sort(), ownedHashes: Object.fromEntries(Object.entries(receipt.files).map(([file, record]) => [file, record.sha256])), original, variants, helperSha256: ownHelper };
}
export function observePreviewCleanup(project, armed) {
  const checks = [], add = (id, action) => { try { action(); checks.push({ id, pass: true, details: [] }); } catch (error) { checks.push({ id, pass: false, details: [error.message] }); } };
  if (!armed || armed.error) return { source: 'host-preview-cleanup-observation-v1', pass: false, checks: [{ id: 'armed', pass: false, details: [armed?.error ?? 'No host cleanup controls'] }] };
  project = fs.realpathSync(project); need(project === armed.project, 'Cleanup belongs to a different project');
  add('owned-removed', () => { need(armed.expectedRemoved.length > 0, 'Empty cleanup scope'); for (const file of armed.expectedRemoved) need(!fs.existsSync(localFile(project, file)), `Owned preview remains: ${file}`); });
  add('user-edit-preserved', () => need(digest(project, armed.edited) === armed.editedAfterSha256, 'Later adapter edit was removed or changed'));
  add('unowned-preserved', () => need(digest(project, armed.unknown) === armed.unknownSha256, 'Unowned preview file was removed or changed'));
  add('original-preserved', () => { for (const [file, expected] of Object.entries(armed.original)) need(digest(project, file) === expected, `Original file changed: ${file}`); });
  add('variants-preserved', () => need(JSON.stringify(artifact(project)) === JSON.stringify(armed.variants), 'Cleanup changed variant source, context, history or selection'));
  add('cleanup-recorded', () => {
    need(digest(project, armed.receipt) === armed.receiptSha256, 'Ownership receipt changed');
    readPreviewReceipt(project, armed.receipt);
    const directory = `.variant-work/preview-files/${armed.group}`;
    const operations = fs.readdirSync(localFile(project, directory)).filter(file => file.endsWith('.cleanup.json')).map(file => `${directory}/${file}`);
    need(operations.some(file => {
      const record = JSON.parse(fs.readFileSync(localFile(project, file))), result = JSON.parse(fs.readFileSync(localFile(project, file + '.result.json')));
      return record.receipt === armed.receipt && result.receipt === armed.receipt && result.conflicts.includes(armed.edited) && result.errors.length === 0 && JSON.stringify([...result.removed].sort()) === JSON.stringify(armed.expectedRemoved) && armed.expectedRemoved.every(name => hash(Buffer.from(record.before[name].content, 'base64')) === armed.ownedHashes[name]);
    }), 'Missing complete helper cleanup backup/result with the preserved conflict');
  });
  return { source: 'host-preview-cleanup-observation-v1', at: new Date().toISOString(), pass: checks.every(check => check.pass), checks };
}
export function gradePreviewCleanup(measurement) {
  const report = measurement?.after, ids = ['owned-removed', 'user-edit-preserved', 'unowned-preserved', 'original-preserved', 'variants-preserved', 'cleanup-recorded'];
  return ids.map(id => { const item = report?.checks?.find(check => check.id === id); return { id, pass: report?.source === 'host-preview-cleanup-observation-v1' && item?.pass === true, details: item?.details ?? ['No host cleanup observation'] }; });
}
