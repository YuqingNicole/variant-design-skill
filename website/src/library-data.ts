/// <reference types="vite/client" />
// Direction library entries (RFC-002), validated at build time by scripts/content.mjs.
export type Pair = [string, string];
export type Direction = { id: 'A' | 'B' | 'C'; name: Pair; preview?: string;
  comparison: { optimizes: Pair; tradeoff: Pair; bestFor: Pair };
  media: { file: string; width: number; height: number; alt: Pair }[] };
export type Entry = { slug: string; title: Pair; summary: Pair; brief: Pair; category: string; tags: string[];
  source: 'own' | 'permission' | 'link-only'; kind?: 'verified' | 'concept'; credit: { name: string; url: string };
  directions: Direction[]; recommendation?: { variant: 'A' | 'B' | 'C'; reason: Pair };
  evidence?: { context: string }; featured: boolean; publishedAt: string };
export const repository = 'https://github.com/YuqingNicole/variant-design-skill';
export const categories: { id: string; name: Pair }[] = [
  { id: 'landing', name: ['落地页', 'Landing pages'] }, { id: 'product', name: ['产品界面', 'Product UI'] },
  { id: 'data', name: ['数据展示', 'Data'] }, { id: 'brand', name: ['品牌', 'Brand'] }, { id: 'component', name: ['组件', 'Components'] },
];
const modules = import.meta.glob<Entry>('../content/entries/*.json', { eager: true, import: 'default' });
// Featured first, then newest; the slug keeps the order stable.
export const entries: Entry[] = Object.values(modules).sort((a, b) =>
  Number(b.featured) - Number(a.featured) || b.publishedAt.localeCompare(a.publishedAt) || a.slug.localeCompare(b.slug));
export const mediaUrl = (entry: Entry, file: string) => `/media/${entry.slug}/${file}`;
export const coverDirection = (entry: Entry) => entry.directions.find(d => d.id === entry.recommendation?.variant) ?? entry.directions[0];
export const evidenceUrl = (entry: Entry) => entry.evidence ? `${repository}/tree/master/${entry.evidence.context.replace(/\/[^/]+$/, '')}` : undefined;
