#!/usr/bin/env node
// Keeps the author list in website/content/x-discovery.json (`authors.list`), which x-discovery.mjs searches before any keyword.
// Usage: node website/scripts/x-authors.mjs list
//        node website/scripts/x-authors.mjs add <handle> --from "<how it was found>" --why "<what they post>"
//        node website/scripts/x-authors.mjs remove <handle>
//        node website/scripts/x-authors.mjs suggest
// `suggest` only prints makers of accepted Videos entries who are not listed yet; nothing is added without a person checking
// a few of their posts first (docs/x-discovery.md).
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { validateConfig } from './x-discovery.mjs';
import { readItems, TAGS } from './x-publish.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const paths = {
  config: path.resolve(here, '../content/x-discovery.json'),
  data: path.resolve(here, '../src/inspiration-data.ts'),
};
const same = (a, b) => a.toLowerCase() === b.toLowerCase();

export function addAuthor(config, { handle, from, why, added }) {
  const name = String(handle ?? '').replace(/^@/, '');
  if ((config.skipHandles ?? []).some(entry => same(entry.handle, name))) throw new Error(`@${name} is in skipHandles; remove it there first if it should be searched.`);
  if ((config.authors?.list ?? []).some(author => same(author.handle, name))) throw new Error(`@${name} is already listed.`);
  if ((config.authors?.declined ?? []).some(entry => same(entry.handle, name))) throw new Error(`@${name} is in authors.declined; remove it there first if it should be listed.`);
  const authors = config.authors ?? { days: 7, minLikes: 100, list: [] };
  return validateConfig({ ...config, authors: { ...authors, list: [...authors.list, { handle: name, added, from, why }] } });
}

export function removeAuthor(config, handle) {
  const name = String(handle ?? '').replace(/^@/, '');
  const list = config.authors?.list ?? [];
  if (!list.some(author => same(author.handle, name))) throw new Error(`@${name} is not listed.`);
  return validateConfig({ ...config, authors: { ...config.authors, list: list.filter(author => !same(author.handle, name)) } });
}

// Makers of Videos entries in the library (the tab's tags) who are not listed, declined or skipped, newest entry first.
export function suggestAuthors(config, items) {
  const listed = new Set((config.authors?.list ?? []).map(author => author.handle.toLowerCase()));
  const skipped = new Set([...(config.skipHandles ?? []), ...(config.authors?.declined ?? [])].map(entry => entry.handle.toLowerCase()));
  const byHandle = new Map();
  for (const item of items) {
    const handle = item.post?.handle;
    if (!handle || !TAGS.includes(item.tag) || listed.has(handle.toLowerCase()) || skipped.has(handle.toLowerCase())) continue;
    const seen = byHandle.get(handle.toLowerCase());
    if (!seen || String(item.addedAt ?? '') > String(seen.addedAt ?? '')) byHandle.set(handle.toLowerCase(), { handle, entry: item.id, name: item.name, tag: item.tag, addedAt: item.addedAt });
  }
  return [...byHandle.values()].sort((a, b) => String(b.addedAt ?? '').localeCompare(String(a.addedAt ?? '')));
}

// The file keeps one record per line, as it is written by hand; other keys are written as JSON.stringify would.
const line = value => JSON.stringify(value).replace(/^\{"/, '{ "').replace(/\}$/, ' }').replace(/","/g, '", "').replace(/":/g, '": ').replace(/,"/g, ', "');
const rows = (list, indent) => `[\n${list.map(item => `${indent}  ${line(item)}`).join(',\n')}\n${indent}]`;
export function formatConfig(config) {
  const value = (key, v, indent) => {
    if (['skipHandles', 'list', 'declined', 'queries'].includes(key) && Array.isArray(v) && v.length) return rows(v, indent);
    if (key === 'groups' || key === 'authors' || (key === null && typeof v === 'object')) return block(v, indent);
    return JSON.stringify(v);
  };
  const block = (v, indent) => Array.isArray(v)
    ? `[\n${v.map(item => `${indent}  ${value(null, item, `${indent}  `)}`).join(',\n')}\n${indent}]`
    : `{\n${Object.entries(v).map(([k, item]) => `${indent}  ${JSON.stringify(k)}: ${value(k, item, `${indent}  `)}`).join(',\n')}\n${indent}}`;
  return `${block(config, '')}\n`;
}
const write = async (file, config) => fs.writeFile(file, formatConfig(config));

export async function main(args, { config: configFile = paths.config, data: dataFile = paths.data, today = new Date().toISOString().slice(0, 10), log = console.log } = {}) {
  const [command, handle] = args, value = flag => args.includes(flag) ? args[args.indexOf(flag) + 1] : undefined;
  const config = validateConfig(JSON.parse(await fs.readFile(configFile, 'utf8')));
  if (command === 'list') {
    for (const author of config.authors?.list ?? []) log(`@${author.handle}\t${author.added}\t${author.from}\t${author.why}`);
    log(`${config.authors?.list?.length ?? 0} listed authors`);
  } else if (command === 'add' && handle) {
    await write(configFile, addAuthor(config, { handle, from: value('--from'), why: value('--why'), added: today }));
    log(`Added @${handle.replace(/^@/, '')}.`);
  } else if (command === 'remove' && handle) {
    await write(configFile, removeAuthor(config, handle));
    log(`Removed @${handle.replace(/^@/, '')}. If the account posts fan work or reposts, add it to skipHandles with the reason.`);
  } else if (command === 'suggest') {
    const found = suggestAuthors(config, readItems(await fs.readFile(dataFile, 'utf8')));
    if (!found.length) { log('Author list: no makers of accepted videos left to suggest.'); return; }
    log(`Author list suggestions (not added; check a few recent posts, then: node website/scripts/x-authors.mjs add <handle> --from "library: <entry>" --why "...")`);
    for (const s of found) log(`  @${s.handle}\t${s.entry}\t${s.tag}\t${s.name}`);
  } else {
    throw new Error('Usage: x-authors.mjs list | add <handle> --from "<how it was found>" --why "<what they post>" | remove <handle> | suggest');
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { await main(process.argv.slice(2)); } catch (error) { console.error(error.message); process.exit(error.message.startsWith('Usage') ? 2 : 1); }
}
