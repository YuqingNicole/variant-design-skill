// One reference belongs to exactly one section, and each section is its own page (/browse/<id>).
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
  { id: 'interaction', name: { zh: '交互', en: 'Interaction' }, work: { zh: '交互设计', en: 'Interaction design' }, videoGrid: true,
    title: { zh: '交互与微交互灵感', en: 'Interaction and microinteraction inspiration' },
    intro: { zh: '按钮、滑块、开关、卡片和组件的交互细节，每条都能看到它怎么响应操作。', en: 'Interaction details of buttons, sliders, toggles, cards and components, each showing how it responds to input.' } },
  { id: 'motion', name: { zh: '动效', en: 'Motion' }, work: { zh: '动效设计', en: 'Motion design' }, videoGrid: true,
    title: { zh: '动效灵感', en: 'Motion inspiration' },
    intro: { zh: '循环动画、转场、3D 和着色器作品，重点看节奏、缓动和画面如何随时间变化。', en: 'Looping animation, transitions, 3D and shader work: pacing, easing and how the picture changes over time.' } },
  { id: 'branding', name: { zh: '品牌', en: 'Branding' }, work: { zh: '品牌设计', en: 'Brand identity' }, videoGrid: true,
    title: { zh: '品牌识别灵感', en: 'Brand identity inspiration' },
    intro: { zh: '标志、字体、图形系统和品牌应用，看一套识别如何在不同载体上保持一致。', en: 'Logos, type, graphic systems and brand applications: how an identity stays consistent across media.' } },
  { id: 'illustration', name: { zh: '插画', en: 'Illustration' }, work: { zh: '插画', en: 'Illustration' }, videoGrid: false,
    title: { zh: '插画灵感', en: 'Illustration inspiration' },
    intro: { zh: '插画与图形作品，看风格、构图和色彩如何服务于内容。', en: 'Illustration and graphic work: how style, composition and color serve the content.' } },
  { id: 'posters', name: { zh: '海报', en: 'Posters' }, work: { zh: '海报设计', en: 'Poster design' }, videoGrid: false,
    title: { zh: '海报灵感', en: 'Poster inspiration' },
    intro: { zh: '海报作品，看版式、字体和层级如何在一张图里抓住注意力。', en: 'Poster work: how layout, type and hierarchy hold attention in a single image.' } },
  { id: 'print', name: { zh: '印刷', en: 'Print' }, work: { zh: '印刷设计', en: 'Print design' }, videoGrid: false,
    title: { zh: '印刷物灵感', en: 'Print inspiration' },
    intro: { zh: '书籍、杂志、包装等印刷物，看材质、网格和排版如何落到纸面。', en: 'Books, magazines and packaging: how material, grids and typesetting land on paper.' } },
];

// `practice` records are split by tag; `landing` is a website; `product` and `flow` are interface work.
const byTag: Record<string, string> = { motion: 'motion', interaction: 'interaction', branding: 'branding', brand: 'branding', illustration: 'illustration', poster: 'posters', posters: 'posters', print: 'print' };
export function sectionOf(item: { category: string; tag: string }): string {
  if (item.category === 'product' || item.category === 'flow') return 'interface';
  if (item.category === 'practice') return byTag[item.tag.toLowerCase()] ?? 'web';
  return 'web';
}
// The document title of a reference's detail page: its name, then the kind of work, so the title answers a search like
// "Linear website design". The prerender and the client both use this, so the two never drift.
export function detailTitle(item: { name: string; category: string; tag: string }, language: 'zh' | 'en'): string {
  const work = sections.find(s => s.id === sectionOf(item))!.work;
  return language === 'en' ? `${item.name} — ${work.en} inspiration — Variant Design` : `${item.name} — ${work.zh}灵感 — Variant Design`;
}
export const sectionPath = (id: string) => (id ? `/browse/${id}` : '/');
export const sectionById = (id: string) => sections.find(s => s.id === id);
// Only sections that have at least one reference get a tab and a page.
export const activeSections = (items: { category: string; tag: string }[]) => {
  const used = new Set(items.map(sectionOf));
  return sections.filter(s => used.has(s.id));
};
