// Reads CHANGELOG.md, the single source for /changelog. Chinese is a block-for-block translation in
// changelog-zh.ts; scripts/changelog.test.mjs fails when the two fall out of step.
// Plain data only: the test imports this file without a TS loader for JSX.
export type Block = { kind: 'heading' | 'item' | 'text'; text: string };
export type Release = { version: string; date: string | null; blocks: Block[] };

export function parseChangelog(markdown: string): Release[] {
  const releases: Release[] = [];
  for (const line of markdown.split('\n')) {
    const release = line.match(/^## (.+?)(?: — (\d{4}-\d{2}-\d{2}))?\s*$/);
    if (release) { releases.push({ version: release[1], date: release[2] ?? null, blocks: [] }); continue; }
    const current = releases.at(-1), text = line.trim();
    if (!current || !text) continue;
    if (text.startsWith('### ')) current.blocks.push({ kind: 'heading', text: text.slice(4) });
    else if (text.startsWith('- ')) current.blocks.push({ kind: 'item', text: text.slice(2) });
    else current.blocks.push({ kind: 'text', text });
  }
  return releases;
}

// Splits on code spans, the only inline markup the changelog uses. ``a ` b`` holds a backtick, as in Markdown.
export const inline = (text: string) => text.split(/(``.+?``|`[^`]+`)/).filter(Boolean).map(part => {
  const fence = part.startsWith('``') ? 2 : part.startsWith('`') ? 1 : 0;
  return fence ? { code: part.slice(fence, -fence).replace(/^ (.*) $/, '$1') } : { text: part };
});
// Anchor ids: "1.1.0" → "v1-1-0", "Unreleased" → "unreleased".
export const releaseId = (version: string) => /^\d/.test(version) ? `v${version.replace(/\W+/g, '-')}` : version.toLowerCase().replace(/\W+/g, '-');

// Website entries (docs/versioning.md): an item that starts with "Website package `x.y.z`" opens that package version, and the
// items after it up to the next one belong to it, in the order CHANGELOG.md is written. The page groups the site's own releases on it.
export const packageVersion = (item: string) => item.match(/^Website package `(\d+\.\d+\.\d+)`/)?.[1] ?? null;
export function packageGroups<T extends { en: string }>(items: T[]) {
  const groups: { version: string | null; items: T[] }[] = [];
  for (const item of items) {
    const version = packageVersion(item.en);
    if (version || !groups.length) groups.push({ version, items: [] });
    groups.at(-1)!.items.push(item);
  }
  return groups;
}
// Drops the "Website package `x.y.z`:" lead (or "网站包 `x.y.z`：") once a group header shows the version. A lead that runs
// into its sentence ("… adds a footer") stays, so the sentence still reads.
export const withoutPackageLead = (text: string) =>
  text.replace(/^(?:Website package|网站包) `\d+\.\d+\.\d+`[:：]\s*([a-z])?/, (_, first?: string) => first?.toUpperCase() ?? '');

// Every item reads "Label: what changed" ("标签：…" in Chinese; docs/versioning.md): the page shows the label as the item's title.
// A label is short, holds no code span or sentence end, and follows the package lead when there is one. The body's first letter
// is capitalised because it stands alone under the title.
export function splitItem(text: string): { title: string | null; body: string } {
  const rest = withoutPackageLead(text), lead = rest.match(/^([^`:：。]{2,48}?)[:：]\s*/);
  if (!lead || /\. /.test(lead[1])) return { title: null, body: rest };
  return { title: lead[1], body: rest.slice(lead[0].length).replace(/^[a-z]/, c => c.toUpperCase()) };
}
// The timeline groups releases by month: "2026-11-09" is in "2026-11", written "2026 年 11 月 9 日" or "November 9, 2026".
const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const monthOf = (date: string | null) => date?.slice(0, 7) ?? null;
export function formatDate(date: string, language: string) {
  const [y, m, d] = date.split('-').map(Number);
  return language === 'zh' ? `${y} 年 ${m} 月 ${d} 日` : `${monthNames[m - 1]} ${d}, ${y}`;
}
export const formatMonth = (month: string, language: string) => language === 'zh' ? `${Number(month.slice(5))} 月` : monthNames[Number(month.slice(5)) - 1];
