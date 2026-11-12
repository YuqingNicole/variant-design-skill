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
