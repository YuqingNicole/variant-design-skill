// One reference belongs to exactly one section, and each section is its own page (/browse/<id>). Every X video is in `videos`, which
// is filtered by design type inside the page (`videoTypes`); the old interaction, motion, brand, illustration, poster and print tabs became those types.
// Sections are derived from the stored `category` and `tag`, so records stay as they are. A section with no
// reference has no tab and no page; the first record that maps to it makes both appear.
type Copy = { zh: string; en: string };
// `work` is the kind of work a section holds, as a searcher would name it; it goes into each detail page's title.
export type Section = { id: string; name: Copy; work: Copy; title: Copy; intro: Copy; videoGrid: boolean };

export const sections: Section[] = [
  { id: 'web', name: { zh: '网站', en: 'Web' }, work: { zh: '网站设计', en: 'Website design' }, videoGrid: false,
    title: { zh: '网站与落地页灵感', en: 'Website and landing page inspiration' },
    intro: { zh: '真实上线的官网、产品落地页和网站作品，看版面、叙事和转化路径怎么组织。', en: 'Live sites, product landing pages and web work: how layout, narrative and conversion paths are put together.' } },
  { id: 'interface', name: { zh: '产品界面', en: 'Interface' }, work: { zh: '产品界面设计', en: 'Product interface design' }, videoGrid: false,
    title: { zh: '产品界面与关键流程灵感', en: 'Product interface and key flow inspiration' },
    intro: { zh: '编辑器、知识库、项目和分析类产品的界面，以及引导、创建、历史和交付这些关键流程。', en: 'Interfaces for editors, knowledge bases, projects and analytics, plus the onboarding, creation, history and delivery flows.' } },
  { id: 'videos', name: { zh: '视频', en: 'Videos' }, work: { zh: '创意视频', en: 'Creative video' }, videoGrid: true,
    title: { zh: '创意视频灵感', en: 'Creative video inspiration' },
    intro: { zh: '来自 X 和 YouTube 的设计短视频：交互、动效、品牌、插画、海报和印刷作品，每条都能直接看它怎么动、怎么响应。', en: 'Short design videos from X and YouTube: interaction, motion, brand, illustration, poster and print work, each one showing how it moves and responds.' } },
];

// `landing` is a website; `product` and `flow` are interface work; a social post or a YouTube video is a video. Its design type is its tag.
const typeByTag: Record<string, string> = { motion: 'motion', interaction: 'interaction', branding: 'branding', brand: 'branding', illustration: 'illustration', poster: 'posters', posters: 'posters', print: 'print' };
export function sectionOf(item: { category: string; tag: string; kind?: string }): string {
  if (item.kind === 'social-post' || item.kind === 'youtube-video') return 'videos';
  if (item.category === 'product' || item.category === 'flow') return 'interface';
  return 'web';
}
export const videoTypes: { id: string; name: Copy }[] = [
  { id: 'interaction', name: { zh: '交互', en: 'Interaction' } }, { id: 'motion', name: { zh: '动效', en: 'Motion' } }, { id: 'web', name: { zh: '网页', en: 'Web' } },
  { id: 'branding', name: { zh: '品牌', en: 'Branding' } }, { id: 'illustration', name: { zh: '插画', en: 'Illustration' } }, { id: 'posters', name: { zh: '海报', en: 'Posters' } }, { id: 'print', name: { zh: '印刷', en: 'Print' } },
];
export const videoTypeOf = (item: { tag: string }) => typeByTag[item.tag.toLowerCase()] ?? 'web';
// The document title of a reference's detail page: its name, then the kind of work, so the title answers a search like
// "Linear website design". The prerender and the client both use this, so the two never drift.
export function detailTitle(item: { name: string; category: string; tag: string; kind?: string }, language: 'zh' | 'en'): string {
  const work = sections.find(s => s.id === sectionOf(item))!.work;
  return language === 'en' ? `${item.name} — ${work.en} inspiration — Variant Design` : `${item.name} — ${work.zh}灵感 — Variant Design`;
}
export const sectionPath = (id: string) => (id ? `/browse/${id}` : '/');
export const sectionById = (id: string) => sections.find(s => s.id === id);
// Only sections that have at least one reference get a tab and a page.
export const activeSections = (items: { category: string; tag: string; kind?: string }[]) => {
  const used = new Set(items.map(sectionOf));
  return sections.filter(s => used.has(s.id));
};
