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
