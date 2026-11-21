// Collection pages (/collections/<slug>): references that share facet values (reference-facets.ts), each page with a
// hand-written intro. A collection goes public only when at least `minimumReviewed` of its references have reviewed
// facets: production leaves the others out entirely (no page, no link, no sitemap line), while local builds and Vercel
// previews build every collection, list draft members too and mark the page noindex, so it can be read before review.
// Plain data and functions only: the prerender imports this without a TS loader for JSX.
import type { FacetName, ReferenceFacets } from './reference-facets';
import { sectionOf } from './inspiration-sections';
type Copy = { zh: string; en: string };
// `section` narrows a collection to one library section (inspiration-sections.ts), e.g. sites only for a "websites" page.
export type Collection = { slug: string; where: Partial<Record<FacetName, string>>; section?: string; short: Copy; title: Copy; intro: Copy };
type Row = { id: string; category: string; tag: string; kind?: string };
export const minimumReviewed = 6;

export const collections: Collection[] = [
  { slug: 'dark-websites', where: { medium: 'website', styles: 'dark' }, section: 'web',
    short: { zh: '深色网站', en: 'Dark sites' },
    title: { zh: '深色网站设计灵感', en: 'Dark website design inspiration' },
    intro: { zh: '深色背景把注意力交给产品截图、代码和少量强调色，但也更考验层级：灰阶要分出三到四档，正文对比度不能为了“高级感”牺牲。看这些网站时，留意它们怎么在深色上区分卡片、分隔线和可点击元素。', en: 'A dark ground hands attention to product screenshots, code and a few accent colours, but it is harder on hierarchy: the greys need three or four distinct steps, and body text cannot trade contrast for mood. As you look, notice how each site separates cards, dividers and clickable elements on dark.' } },
  { slug: 'developer-tool-websites', where: { industry: 'dev-tools', medium: 'website' }, section: 'web',
    short: { zh: '开发者工具', en: 'Dev tools' },
    title: { zh: '开发者工具网站设计灵感', en: 'Developer tool website design inspiration' },
    intro: { zh: '开发者先看能不能用、怎么接入，再看口号。这一组网站多数在首屏或紧接着放出安装命令、代码片段或真实界面，用文档式的克制排版建立信任。看它们怎么在“一句话说清价值”和“马上能试”之间排先后。', en: 'Developers look for whether it works and how to integrate it before they read the slogan. Most of these sites put an install command, a code sample or the real interface in or right after the first screen, and earn trust with restrained, documentation-like layout. Notice how each orders “say the value in one line” against “try it now”.' } },
  { slug: 'ai-product-websites', where: { industry: 'ai', medium: 'website' }, section: 'web',
    short: { zh: 'AI 产品', en: 'AI products' },
    title: { zh: 'AI 产品网站设计灵感', en: 'AI product website design inspiration' },
    intro: { zh: 'AI 产品最难讲的是“它到底会做什么”。好的落地页不堆形容词，而是给一个具体任务、一个输入框或一段真实输出。看这一组怎么把抽象能力落到可感知的例子上，以及在哪里交代限制和价格。', en: 'The hardest thing for an AI product to say is what it actually does. Good landing pages skip the adjectives and show one concrete task, an input box or a real output. Notice how these sites turn an abstract capability into a tangible example, and where they state limits and pricing.' } },
  { slug: 'fintech-design', where: { industry: 'fintech' },
    short: { zh: '金融科技', en: 'Fintech' },
    title: { zh: '金融科技设计灵感', en: 'Fintech design inspiration' },
    intro: { zh: '涉及钱的界面，信任先于惊艳：数字要对齐、状态要明确、每一步操作都要能确认和撤回。这一组包括官网和应用里的交互细节，看它们怎么用动效交代金额变化，而不是制造焦虑。', en: 'When money is involved, trust comes before spectacle: numbers align, states are explicit, and every step can be confirmed or undone. This collection covers both marketing sites and in-app interactions; notice how motion explains a change in amount instead of creating anxiety.' } },
  { slug: 'design-studio-websites', where: { industry: 'studio' }, section: 'web',
    short: { zh: '设计工作室', en: 'Studios' },
    title: { zh: '设计工作室网站灵感', en: 'Design studio website inspiration' },
    intro: { zh: '工作室官网本身就是作品集的第一件作品。这一组在“展示案例”和“说明我们是谁”之间做了不同取舍：有的用可筛选的索引，有的让一个大案例占满首屏。看案例怎么被组织、怎么被找到。', en: 'A studio’s site is the first piece in its portfolio. These sites weigh showing work against explaining who they are in different ways: some use a filterable index, others let one large project fill the first screen. Notice how the work is organised and how a visitor finds it.' } },
  { slug: 'product-ui-hero', where: { patterns: 'product-ui-hero' },
    short: { zh: '首屏产品界面', en: 'Product UI hero' },
    title: { zh: '首屏放产品界面的落地页', en: 'Landing pages with the product UI in the hero' },
    intro: { zh: '把真实产品界面直接放进首屏，等于用交付物代替承诺。难点是截图要足够大能看清、又不能压过标题。看这一组怎么裁切界面、怎么在截图上加标注或动效，以及截图之后第一段讲什么。', en: 'Putting the real product interface in the first screen replaces a promise with the deliverable. The hard part is making the screenshot large enough to read without drowning the headline. Notice how these pages crop the interface, how they annotate or animate it, and what the first section after it says.' } },
  { slug: 'tabbed-feature-sections', where: { patterns: 'tabbed-features' },
    short: { zh: '分标签功能', en: 'Tabbed features' },
    title: { zh: '分标签讲功能的设计灵感', en: 'Tabbed feature section inspiration' },
    intro: { zh: '功能多、阶段多的产品常用标签页把介绍切成几段，每段配一张对应的界面。它省空间，但被折叠的内容很多人不会点开。看这一组怎么命名标签、默认停在哪一页、切换时界面怎么跟着变。', en: 'Products with many features or stages often split the explanation into tabs, each paired with its own view. It saves space, but many visitors never open the hidden tabs. Notice how these sites name the tabs, which one is open by default, and how the view changes on switch.' } },
  { slug: 'testimonial-sections', where: { patterns: 'testimonials' },
    short: { zh: '用户评价', en: 'Testimonials' },
    title: { zh: '用户评价区块设计灵感', en: 'Testimonial section design inspiration' },
    intro: { zh: '评价区块有用的前提是可信：真实姓名、职位和公司，具体的结果胜过泛泛的夸奖。看这一组把评价放在页面哪里、配不配头像和标志、一屏放几条，以及怎么避免它变成没人读的轮播。', en: 'A testimonial section only helps if it is believable: a real name, role and company, and a specific result rather than generic praise. Notice where these pages place testimonials, whether they add photos and logos, how many fit on a screen, and how they avoid a carousel nobody reads.' } },
  { slug: 'micro-interactions', where: { techniques: 'micro-interaction' },
    short: { zh: '微交互', en: 'Micro-interactions' },
    title: { zh: '微交互设计灵感', en: 'Micro-interaction design inspiration' },
    intro: { zh: '微交互是一次操作的反馈：按下、切换、完成、出错。好的微交互短、可预期、能被关掉，并且告诉用户刚才发生了什么。这一组多是设计师发布的短视频，看节奏、缓动和状态之间怎么衔接，再想想放进你的产品里是否会拖慢操作。', en: 'A micro-interaction is the feedback for one action: a press, a toggle, a completion, an error. Good ones are short, predictable, can be turned off, and tell you what just happened. Most of these are short videos from designers; watch the timing, easing and how states connect, then ask whether it would slow your product down.' } },
  { slug: 'grain-texture', where: { styles: 'texture' },
    short: { zh: '颗粒肌理', en: 'Grain' },
    title: { zh: '颗粒与肌理风格设计灵感', en: 'Grain and texture design inspiration' },
    intro: { zh: '颗粒、噪点和纸张肌理让平面的数字界面有了材质感，也最容易做脏。看这一组肌理的强度、只用在背景还是也用在图形上，以及在小屏幕和深色模式下是否还清楚。', en: 'Grain, noise and paper texture give flat digital surfaces a sense of material, and they are also the easiest way to make a design look dirty. Notice how strong the texture is, whether it stays in the background or reaches the graphics, and whether it still reads on small screens and dark mode.' } },
  { slug: 'illustrated-design', where: { styles: 'illustrated' },
    short: { zh: '插画风', en: 'Illustrated' },
    title: { zh: '插画风设计灵感', en: 'Illustrated design inspiration' },
    intro: { zh: '插画能给产品一个别人抄不走的声音，但它需要一整套规则：线条、配色、人物比例和使用场合。这一组横跨网站、品牌和动效，看插画承担的是装饰、解释还是情绪，以及它和界面文字怎么分工。', en: 'Illustration can give a product a voice nobody else can copy, but it needs a full system: line, palette, figure proportions and where it is used. This collection spans websites, brands and motion; notice whether the illustration decorates, explains or sets a mood, and how it shares the work with interface text.' } },
];

export const matches = (c: Collection, f: ReferenceFacets) => (Object.entries(c.where) as [FacetName, string][])
  .every(([facet, value]) => Array.isArray(f[facet]) ? (f[facet] as string[]).includes(value) : f[facet] === value);
// Members in the order of `rows` (the library's order), split by review status.
export function collectionState(c: Collection, facets: Record<string, ReferenceFacets>, rows: Row[]) {
  const members = rows.filter(r => facets[r.id] && matches(c, facets[r.id]) && (!c.section || sectionOf(r) === c.section)).map(r => r.id);
  const reviewed = members.filter(id => facets[id].status === 'reviewed');
  return { members, reviewed, ready: reviewed.length >= minimumReviewed };
}
// What a build shows: production only ready collections with their reviewed members; previews everything.
export function visibleCollections(facets: Record<string, ReferenceFacets>, rows: Row[], showDrafts: boolean) {
  return collections.flatMap(c => { const s = collectionState(c, facets, rows);
    return showDrafts || s.ready ? [{ ...c, ready: s.ready, items: showDrafts ? s.members : s.reviewed, reviewed: s.reviewed.length }] : []; });
}
export const collectionBySlug = (slug: string) => collections.find(c => c.slug === slug);
