// Modules served by scripts/inspiration-split.mjs: the reference library split for the browser (TODO §6). The data file
// stays the source; these only change what each script carries.
type SplitLink = (typeof import('./inspiration-data').inspirationItems)[number];
type SplitPart = { items: SplitLink[]; previews: Record<string, import('./reference-library').Preview>; media: Record<string, import('./XVideo').XMedia> };
declare module 'virtual:inspiration/index' {
  export const index: Pick<SplitLink, 'id' | 'name' | 'category' | 'tag' | 'source' | 'addedAt' | 'checkedAt'>[];
  export const topics: typeof import('./inspiration-data').inspirationTopics;
}
declare module 'virtual:inspiration/initial' { export const items: SplitPart['items']; export const previews: SplitPart['previews']; export const media: SplitPart['media']; }
declare module 'virtual:inspiration/loader' { export const loadSection: (id: string) => Promise<SplitPart>; }
