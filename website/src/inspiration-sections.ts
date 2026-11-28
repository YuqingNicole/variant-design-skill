// One reference belongs to exactly one section, and each section is its own page (/browse/<id>). Videos split in two by their tag:
// design work (interaction, motion, brand, illustration, poster, print) is `design-motion`, filtered by design type; a fun,
// creative video that is not design work (maintainer's definition, 2026-11-20) is `videos`, filtered by how it was made.
// Sections are derived from the stored `category`, `tag` and `kind`, so records stay as they are. A section with no
// reference has no tab and no page; the first record that maps to it makes both appear.
type Copy = { zh: string; en: string };
export type VideoType = { id: string; name: Copy };
// `work` is the kind of work a section holds, as a searcher would name it; it goes into each detail page's title.
// `types` is the filter row inside a video section; each type is read from the reference's tag. A section with `ownPage` stands
// apart from Inspiration (2026-11-20): its references are not in the Inspiration feed, counts or tabs, and its page shows only its types.
export type Section = { id: string; name: Copy; work: Copy; title: Copy; intro: Copy; videoGrid: boolean; types?: VideoType[]; ownPage?: boolean };

const designTypes: VideoType[] = [
  { id: 'interaction', name: { zh: '交互', en: 'Interaction' } }, { id: 'motion', name: { zh: '动效', en: 'Motion' } }, { id: 'web', name: { zh: '网页', en: 'Web' } },
  { id: 'branding', name: { zh: '品牌', en: 'Branding' } }, { id: 'illustration', name: { zh: '插画', en: 'Illustration' } }, { id: 'posters', name: { zh: '海报', en: 'Posters' } }, { id: 'print', name: { zh: '印刷', en: 'Print' } },
];
const creativeTypes: VideoType[] = [
  { id: 'animation', name: { zh: '动画短片', en: 'Animation' } }, { id: 'vfx', name: { zh: '特效合成', en: 'VFX' } }, { id: 'craft', name: { zh: '定格与手作', en: 'Stop-motion & craft' } },
  { id: 'generative', name: { zh: '代码与生成', en: 'Generative' } }, { id: 'real-time', name: { zh: '游戏与实时', en: 'Games & real-time' } }, { id: 'live-action', name: { zh: '实拍脑洞', en: 'Live-action ideas' } },
];

export const sections: Section[] = [
  { id: 'web', name: { zh: '网站', en: 'Web' }, work: { zh: '网站设计', en: 'Website design' }, videoGrid: false,
    title: { zh: '网站与落地页灵感', en: 'Website and landing page inspiration' },
    intro: { zh: '真实上线的官网、产品落地页和网站作品，看版面、叙事和转化路径怎么组织。', en: 'Live sites, product landing pages and web work: how layout, narrative and conversion paths are put together.' } },
  { id: 'interface', name: { zh: '产品界面', en: 'Interface' }, work: { zh: '产品界面设计', en: 'Product interface design' }, videoGrid: false,
    title: { zh: '产品界面与关键流程灵感', en: 'Product interface and key flow inspiration' },
    intro: { zh: '编辑器、知识库、项目和分析类产品的界面，以及引导、创建、历史和交付这些关键流程。', en: 'Interfaces for editors, knowledge bases, projects and analytics, plus the onboarding, creation, history and delivery flows.' } },
  { id: 'design-motion', name: { zh: '动态设计', en: 'Design in motion' }, work: { zh: '动态设计', en: 'Design in motion' }, videoGrid: true, types: designTypes,
    title: { zh: '动态设计灵感', en: 'Design in motion inspiration' },
    intro: { zh: '来自 X 和 YouTube 的设计短视频：交互、动效、品牌、插画、海报和印刷作品，每条都能直接看它怎么动、怎么响应。', en: 'Short design videos from X and YouTube: interaction, motion, brand, illustration, poster and print work, each one showing how it moves and responds.' } },
  { id: 'videos', name: { zh: '视频', en: 'Videos' }, work: { zh: '创意视频', en: 'Creative video' }, videoGrid: true, types: creativeTypes, ownPage: true,
    title: { zh: '创意视频', en: 'Creative videos' },
    intro: { zh: '来自 X 和 YouTube 的有趣创意短视频，和设计无关：动画、特效、定格和手作、代码生成、游戏和实时场景，还有实拍的脑洞。', en: 'Fun, creative short videos from X and YouTube that have nothing to do with design: animation, effects, stop-motion and craft, generative work, games and real-time worlds, and live-action ideas.' } },
];

// `landing` is a website; `product` and `flow` are interface work; a social post or a YouTube video is a video, creative when
// its tag is a creative type and design work otherwise. Inside a video section the type is the tag. A social post filed as
// `landing`, `product` or `flow` is a still of that work (one picture of a photo post), so it follows its category instead.
const designByTag: Record<string, string> = { motion: 'motion', interaction: 'interaction', branding: 'branding', brand: 'branding', illustration: 'illustration', poster: 'posters', posters: 'posters', print: 'print' };
// Humor was a tag until 2026-11-28 (a tone, not a medium); a record still carrying it is filed with filmed ideas, never lost to design.
const creativeByTag: Record<string, string> = { animation: 'animation', vfx: 'vfx', craft: 'craft', generative: 'generative', 'real-time': 'real-time', 'live action': 'live-action', humor: 'live-action' };
export function sectionOf(item: { category: string; tag: string; kind?: string }): string {
  if ((item.kind === 'social-post' && item.category === 'practice') || item.kind === 'youtube-video') return creativeByTag[item.tag.toLowerCase()] ? 'videos' : 'design-motion';
  if (item.category === 'product' || item.category === 'flow') return 'interface';
  return 'web';
}
// The type of a video inside its own section; an unknown design tag is a web video.
export const videoTypeOf = (item: { tag: string }) => creativeByTag[item.tag.toLowerCase()] ?? designByTag[item.tag.toLowerCase()] ?? 'web';
// Design types that used to filter `videos`; links that still carry one belong to `design-motion`.
export const designTypeIds = designTypes.map(v => v.id);
// The document title of a reference's detail page: its name, then the kind of work, so the title answers a search like
// "Linear website design". The prerender and the client both use this, so the two never drift.
export function detailTitle(item: { name: string; category: string; tag: string; kind?: string }, language: 'zh' | 'en'): string {
  const work = sections.find(s => s.id === sectionOf(item))!.work;
  return language === 'en' ? `${item.name} — ${work.en} inspiration — Variant Design` : `${item.name} — ${work.zh}灵感 — Variant Design`;
}
export const sectionPath = (id: string) => (id ? `/browse/${id}` : '/');
export const sectionById = (id: string) => sections.find(s => s.id === id);
// The page a reference is listed on: its own-page section (Videos), or '' for Inspiration.
export const pageOf = (item: { category: string; tag: string; kind?: string }) => { const id = sectionOf(item); return sectionById(id)?.ownPage ? id : ''; };
// Only sections that have at least one reference get a tab and a page.
export const activeSections = (items: { category: string; tag: string; kind?: string }[]) => {
  const used = new Set(items.map(sectionOf));
  return sections.filter(s => used.has(s.id));
};

// Up to five other references of the same kind (same section; in Videos, same type), the same tag first, starting after this one so every page links to different neighbours.
export function relatedReferences<T extends { id: string; category: string; tag: string; kind?: string }>(item: { id: string; category: string; tag: string; kind?: string }, rows: T[]): { list: T[]; total: number } {
  const same = (r: T) => sectionOf(r) === sectionOf(item) && (sectionOf(item) !== 'videos' || videoTypeOf(r) === videoTypeOf(item));
  const group = rows.filter(same), at = group.findIndex(r => r.id === item.id);
  const around = [...group.slice(at + 1), ...group.slice(0, Math.max(at, 0))];
  return { list: [...around.filter(r => r.tag === item.tag), ...around.filter(r => r.tag !== item.tag)].slice(0, 5), total: group.length };
}
