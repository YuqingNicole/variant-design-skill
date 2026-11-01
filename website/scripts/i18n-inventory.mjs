#!/usr/bin/env node
// Counts what RFC-005 P1 still has to migrate: inline zh/en ternaries, positional [zh, en] reads and pages that
// keep their own language state. Run before and after a P1 change; the totals should only go down. The counts are a
// lower bound: they find the patterns the site uses today, so P1 also ends with a manual search for other forms.
// Usage: node website/scripts/i18n-inventory.mjs [--json]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const src = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src');
const patterns = {
  ternaries: /\bzh\s*\?/g,                         // zh?'…':'…'
  pairReads: /\[(?:ix|0|1)\]/g,                     // value[ix], value[0], value[1] on [zh, en] pairs (over-counts other arrays)
  languageState: /variant-language/g,               // pages reading the preference themselves
};
export function inventory(dir = src) {
  const rows = [];
  for (const file of fs.readdirSync(dir, { recursive: true }).filter(f => /\.(tsx?|mts)$/.test(f) && !f.startsWith('i18n'))) {
    const text = fs.readFileSync(path.join(dir, file), 'utf8'), row = { file };
    for (const [k, re] of Object.entries(patterns)) row[k] = (text.match(re) ?? []).length;
    // Any other index variable derived from the language, e.g. `const i=language==='zh'?0:1`, counts as pair reads too.
    for (const [, name] of text.matchAll(/(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=\s*[^;,\n]*?(?:zh|en|lang|language|locale)[^;,\n]*?\?\s*[01]\s*:\s*[01]/g))
      if (name !== 'ix') row.pairReads += (text.match(new RegExp(`\\[${name.replace(/\$/g, '\\$')}\\]`, 'g')) ?? []).length;
    if (row.ternaries || row.pairReads || row.languageState) rows.push(row);
  }
  const total = Object.fromEntries(Object.keys(patterns).map(k => [k, rows.reduce((n, r) => n + r[k], 0)]));
  return { rows: rows.sort((a, b) => b.ternaries - a.ternaries || b.pairReads - a.pairReads), total };
}
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const { rows, total } = inventory();
  if (process.argv.includes('--json')) console.log(JSON.stringify({ rows, total }, null, 2));
  else { for (const r of rows) console.log(`${String(r.ternaries).padStart(4)} ${String(r.pairReads).padStart(4)} ${String(r.languageState).padStart(2)}  ${r.file}`); console.log(`${String(total.ternaries).padStart(4)} ${String(total.pairReads).padStart(4)} ${String(total.languageState).padStart(2)}  total (ternaries, pair reads, own language state)`); }
}
