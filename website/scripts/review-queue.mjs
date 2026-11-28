#!/usr/bin/env node
// The review band of the material benchmark (docs/benchmark.md): candidates that scored 60–75% are not published by the weekly
// runs but kept in their inbox as `review`, with the card they would publish (`draft`, plus `draftPreview` for a site). The weekly
// pull request lists them one line each; the owner answers 收 (accept) or 拒 (reject) per id, and this applies the answer.
// Usage: node website/scripts/review-queue.mjs list
//        node website/scripts/review-queue.mjs accept <id>            (or 收)
//        node website/scripts/review-queue.mjs reject <id> [reason]   (or 拒)
// An accepted X post still needs `node website/scripts/x-media.mjs` for its video record, as after a weekly run.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { readItems, appendItems } from './x-publish.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const defaults = { content: path.resolve(here, '../content'), data: path.resolve(here, '../src/inspiration-data.ts'), previews: path.resolve(here, '../src/link-previews.json') };
export const INBOXES = ['x-post-inbox.json', 'youtube-video-inbox.json', 'site-inbox.json', 'threads-post-inbox.json'];

async function readInboxes(content) {
  const out = [];
  for (const name of INBOXES) {
    const file = path.join(content, name);
    let inbox;
    try { inbox = JSON.parse(await fs.readFile(file, 'utf8')); } catch (error) { if (error.code === 'ENOENT') continue; throw error; }
    out.push({ name, file, inbox });
  }
  return out;
}
async function writeJson(file, value) {
  const temporary = `${file}.tmp`;
  await fs.writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`);
  await fs.rename(temporary, file);
}

export async function list({ content = defaults.content } = {}) {
  return (await readInboxes(content)).flatMap(({ name, inbox }) => inbox.candidates.filter(c => c.status === 'review').map(row => ({ inbox: name, row })));
}

// `action` is accept or reject. Only a row in the review band can be decided here; anything else is refused unchanged.
export async function decide({ id, action, reason = '', content = defaults.content, data = defaults.data, previews = defaults.previews, now = new Date() }) {
  if (!['accept', 'reject'].includes(action)) throw new Error('action must be accept or reject');
  const found = (await readInboxes(content)).flatMap(box => box.inbox.candidates.filter(c => c.id === id).map(row => ({ ...box, row })));
  if (!found.length) throw new Error(`No inbox row has id ${id}`);
  if (found.length > 1) throw new Error(`Id ${id} is in more than one inbox (${found.map(f => f.name).join(', ')}); decide it by hand`);
  const [{ file, inbox, row }] = found;
  if (row.status !== 'review') throw new Error(`${id} is ${row.status ?? 'pending'}, not held for review`);
  const today = now.toISOString().slice(0, 10), { draft, draftPreview, reason: held, ...rest } = row;
  let next;
  if (action === 'accept') {
    if (!draft?.id) throw new Error(`${id} has no draft card to publish`);
    const source = await fs.readFile(data, 'utf8');
    if (readItems(source).some(i => i.id === draft.id)) throw new Error(`The library already has an entry ${draft.id}`);
    const entry = { ...draft, checkedAt: today, addedAt: now.toISOString() };
    if (draftPreview) {
      const all = JSON.parse(await fs.readFile(previews, 'utf8'));
      await writeJson(previews, { ...all, [entry.id]: draftPreview });
    }
    await fs.writeFile(data, appendItems(source, [entry]));
    next = { ...rest, status: 'published', entry: entry.id, reviewedAt: today, decidedBy: 'owner' };
  } else {
    next = { ...rest, status: 'rejected', reason: `Rejected by the owner from the review band${reason ? `: ${reason}` : ''}. Screening said: ${held ?? 'no reason recorded'}`, reviewedAt: today, decidedBy: 'owner' };
  }
  inbox.candidates[inbox.candidates.indexOf(row)] = next;
  inbox.updatedAt = now.toISOString();
  await writeJson(file, inbox);
  return next;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [command, id, ...words] = process.argv.slice(2);
  const action = { accept: 'accept', '收': 'accept', reject: 'reject', '拒': 'reject' }[command];
  try {
    if (command === 'list') {
      const rows = await list();
      if (!rows.length) console.log('Nothing is held for review.');
      for (const { inbox, row } of rows) console.log(`~ ${row.id} [${inbox}] ${row.screening ? `${row.screening.total}/${row.screening.max} ` : ''}${row.draft?.name ?? ''}\n  ${row.url ?? row.link ?? ''}\n  ${row.reason ?? ''}`);
    } else if (action && id) {
      const row = await decide({ id, action, reason: words.join(' ') });
      console.log(row.status === 'published' ? `Published ${row.entry}.${/^\d+$/.test(id) ? ' Run node website/scripts/x-media.mjs for its video record.' : ''}` : `Rejected ${id}.`);
    } else {
      console.error('Usage: review-queue.mjs list | accept|收 <id> | reject|拒 <id> [reason]'); process.exit(2);
    }
  } catch (error) { console.error(error.message); process.exit(1); }
}
