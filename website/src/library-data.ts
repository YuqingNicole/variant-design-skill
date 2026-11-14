/// <reference types="vite/client" />
// Direction library entries (RFC-002), validated at build time by scripts/content.mjs.
import { fromPair, type Localized } from './i18n/localized';
import type { Translations } from './i18n/translations';
type Pair = [string, string];
type Text<S> = { id: 'A' | 'B' | 'C'; name: S; preview?: string;
  comparison: { optimizes: S; tradeoff: S; bestFor: S };
  media: { file: string; width: number; height: number; alt: S }[] };
type Stored<S> = { slug: string; title: S; summary: S; brief: S; category: string; tags: string[];
  source: 'own' | 'permission' | 'link-only'; kind?: 'verified' | 'concept'; credit: { name: string; url: string };
  directions: Text<S>[]; recommendation?: { variant: 'A' | 'B' | 'C'; reason: S };
  evidence?: { context: string }; featured: boolean; publishedAt: string; translations?: Translations;
  // How a verified entry was made (scripts/content.mjs): figures copied from the run transcript, the prompt as given, the skill commands the agent ran.
  run?: { agent: string; model?: string; date: string; durationSec?: number; costUsd?: number; turns?: number; prompt?: S; commands?: string[]; record?: string } };
export type Direction = Text<Localized>;
export type Entry = Stored<Localized>;
export const repository = 'https://github.com/YuqingNicole/variant-design-skill';
// Cards are always referenced on the published site, so a copied prompt works from any agent.
export const siteUrl = 'https://variantdesign.xyz';
export const cardUrl = (entry: Entry) => `${siteUrl}/d/${entry.slug}.json`;
export const categories: { id: string; name: Localized }[] = [
  { id: 'landing', name: { zh: '落地页', en: 'Landing pages' } }, { id: 'product', name: { zh: '产品界面', en: 'Product UI' } },
  { id: 'data', name: { zh: '数据展示', en: 'Data' } }, { id: 'brand', name: { zh: '品牌', en: 'Brand' } }, { id: 'component', name: { zh: '组件', en: 'Components' } },
];
const modules = import.meta.glob<Stored<Pair>>('../content/entries/*.json', { eager: true, import: 'default' });
// Entry files and published direction cards keep their [zh, en] pairs (RFC-005 §3.3); pages read keyed values.
const keyed = (e: Stored<Pair>): Entry => ({ ...e, title: fromPair(e.title), summary: fromPair(e.summary), brief: fromPair(e.brief),
  recommendation: e.recommendation && { ...e.recommendation, reason: fromPair(e.recommendation.reason) },
  run: e.run && { ...e.run, prompt: e.run.prompt && fromPair(e.run.prompt) },
  directions: e.directions.map(d => ({ ...d, name: fromPair(d.name), media: d.media.map(i => ({ ...i, alt: fromPair(i.alt) })),
    comparison: { optimizes: fromPair(d.comparison.optimizes), tradeoff: fromPair(d.comparison.tradeoff), bestFor: fromPair(d.comparison.bestFor) } })) });
// Featured first, then newest; the slug keeps the order stable.
export const entries: Entry[] = Object.values(modules).map(keyed).sort((a, b) =>
  Number(b.featured) - Number(a.featured) || b.publishedAt.localeCompare(a.publishedAt) || a.slug.localeCompare(b.slug));
export const mediaUrl = (entry: Entry, file: string) => `/media/${entry.slug}/${file}`;
export const coverDirection = (entry: Entry) => entry.directions.find(d => d.id === entry.recommendation?.variant) ?? entry.directions[0];
export const evidenceUrl = (entry: Entry) => entry.evidence ? `${repository}/tree/master/${entry.evidence.context.replace(/\/[^/]+$/, '')}` : undefined;
