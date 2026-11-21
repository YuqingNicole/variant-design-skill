// Facets: several controlled attributes per reference, so collection pages ("pricing page design examples", "dark SaaS
// landing pages", "button micro-interactions") can be derived from data instead of invented as categories. The single
// stored `tag` stays as it is; sections still come from `inspiration-sections.ts`.
//
// Values live in `reference-facets.json`, keyed by reference id. A value must be supported by the record itself (name,
// address, focus, application, analysis, post text) or by public knowledge of what the company does (industry). Visual
// style is never guessed from a name: no evidence, no value. `status` says who checked it: `draft` was proposed from the
// notes and nobody has opened the work yet; `reviewed` means a person opened the work and confirmed every value.
// Only reviewed values may back a public collection page (see `collectionCandidates`).
type Copy = { zh: string; en: string };
type Vocabulary = Record<string, Copy>;

export const industries = {
  'dev-tools': { zh: '开发者工具', en: 'Developer tools' }, 'design-tools': { zh: '设计工具', en: 'Design tools' }, ai: { zh: 'AI 产品', en: 'AI products' }, productivity: { zh: '协作与效率', en: 'Productivity' },
  fintech: { zh: '金融科技', en: 'Fintech' }, commerce: { zh: '电商与零售', en: 'Commerce' }, hardware: { zh: '消费硬件', en: 'Consumer hardware' },
  studio: { zh: '设计工作室', en: 'Design studios' }, portfolio: { zh: '个人作品集', en: 'Personal portfolios' }, media: { zh: '媒体与出版', en: 'Media and publishing' },
  culture: { zh: '文化与艺术', en: 'Culture and arts' }, education: { zh: '教育', en: 'Education' }, health: { zh: '健康', en: 'Health' },
  'food-drink': { zh: '餐饮', en: 'Food and drink' }, fashion: { zh: '时尚与美妆', en: 'Fashion and beauty' }, travel: { zh: '旅行与出行', en: 'Travel and mobility' },
  gaming: { zh: '游戏', en: 'Gaming' }, crypto: { zh: '加密与 Web3', en: 'Crypto and web3' },
} satisfies Vocabulary;

// What the work is, whatever section it is filed under: a video can show a mobile app, a website or a poster.
export const media = {
  website: { zh: '网站', en: 'Website' }, 'web-app': { zh: '网页应用', en: 'Web app' }, 'mobile-app': { zh: '移动应用', en: 'Mobile app' },
  'desktop-app': { zh: '桌面应用', en: 'Desktop app' }, wearable: { zh: '穿戴设备', en: 'Wearable' }, 'brand-identity': { zh: '品牌识别', en: 'Brand identity' },
  print: { zh: '印刷品', en: 'Print' }, poster: { zh: '海报', en: 'Poster' }, illustration: { zh: '插画', en: 'Illustration' },
  'motion-graphics': { zh: '动态图形', en: 'Motion graphics' }, '3d': { zh: '三维作品', en: '3D work' }, film: { zh: '影像短片', en: 'Film' },
} satisfies Vocabulary;

export const pageTypes = {
  homepage: { zh: '首页', en: 'Homepage' }, 'product-page': { zh: '产品介绍页', en: 'Product page' }, pricing: { zh: '定价页', en: 'Pricing page' },
  docs: { zh: '文档页', en: 'Documentation' }, changelog: { zh: '更新日志', en: 'Changelog' }, 'case-index': { zh: '案例列表', en: 'Case index' },
  'case-study': { zh: '案例详情', en: 'Case study' }, store: { zh: '商店列表', en: 'Store' }, 'product-detail': { zh: '商品详情', en: 'Product detail' },
  about: { zh: '关于页', en: 'About page' }, blog: { zh: '博客与文章', en: 'Blog and articles' }, editor: { zh: '编辑器', en: 'Editor' },
  dashboard: { zh: '仪表盘', en: 'Dashboard' }, onboarding: { zh: '引导流程', en: 'Onboarding' }, chat: { zh: '对话界面', en: 'Chat interface' },
  search: { zh: '搜索', en: 'Search' }, settings: { zh: '设置', en: 'Settings' }, auth: { zh: '登录注册', en: 'Sign-in' },
} satisfies Vocabulary;

// Layout and content patterns that a page section is built from.
export const patterns = {
  'product-ui-hero': { zh: '首屏放产品界面', en: 'Product UI in the hero' }, 'code-hero': { zh: '首屏放代码', en: 'Code in the hero' },
  'prompt-hero': { zh: '首屏放输入框', en: 'Prompt box in the hero' }, 'interactive-demo': { zh: '可操作演示', en: 'Interactive demo' },
  'before-after': { zh: '前后对比', en: 'Before and after' }, 'tabbed-features': { zh: '分标签讲功能', en: 'Tabbed features' },
  'bento-grid': { zh: '便当格布局', en: 'Bento grid' }, 'logo-wall': { zh: '客户标志墙', en: 'Logo wall' },
  testimonials: { zh: '用户评价', en: 'Testimonials' }, metrics: { zh: '数据背书', en: 'Metrics as proof' },
  'case-grid': { zh: '作品网格', en: 'Work grid' }, 'filterable-index': { zh: '可筛选索引', en: 'Filterable index' },
  'scroll-story': { zh: '滚动叙事', en: 'Scroll storytelling' }, 'video-hero': { zh: '首屏视频', en: 'Video hero' },
  '3d-hero': { zh: '首屏三维', en: '3D hero' }, 'editorial-type': { zh: '大字号排版', en: 'Editorial type' },
  'install-command': { zh: '安装命令', en: 'Install command' }, comparison: { zh: '对比表', en: 'Comparison' },
  faq: { zh: '常见问题', en: 'FAQ' }, 'closing-cta': { zh: '结尾行动号召', en: 'Closing call to action' },
  'category-entry': { zh: '品类入口', en: 'Category entry points' }, 'template-gallery': { zh: '模板与示例库', en: 'Template gallery' },
} satisfies Vocabulary;

export const components = {
  button: { zh: '按钮', en: 'Button' }, navigation: { zh: '导航与菜单', en: 'Navigation and menus' }, card: { zh: '卡片', en: 'Card' },
  carousel: { zh: '轮播', en: 'Carousel' }, tabs: { zh: '标签页', en: 'Tabs' }, toggle: { zh: '开关', en: 'Toggle' },
  input: { zh: '输入框与表单', en: 'Inputs and forms' }, dropdown: { zh: '下拉与选择器', en: 'Dropdowns and pickers' }, slider: { zh: '滑块', en: 'Slider' },
  modal: { zh: '弹窗与抽屉', en: 'Modals and sheets' }, tooltip: { zh: '提示气泡', en: 'Tooltip' }, notification: { zh: '通知与提示条', en: 'Notifications' },
  chart: { zh: '图表', en: 'Chart' }, sidebar: { zh: '侧栏', en: 'Sidebar' }, gallery: { zh: '图片画廊', en: 'Gallery' },
  list: { zh: '列表', en: 'List' }, calendar: { zh: '日历', en: 'Calendar' }, map: { zh: '地图', en: 'Map' },
  cursor: { zh: '光标', en: 'Cursor' }, loader: { zh: '加载状态', en: 'Loader' }, icon: { zh: '图标', en: 'Icon' },
  logo: { zh: '标志', en: 'Logo' }, text: { zh: '标题与文字', en: 'Headings and text' }, 'media-player': { zh: '播放器', en: 'Media player' },
  'chat-box': { zh: '对话框', en: 'Chat box' }, 'search-bar': { zh: '搜索框', en: 'Search bar' }, widget: { zh: '小组件', en: 'Widget' },
} satisfies Vocabulary;

// How it moves or responds. Mostly for videos; a website gets one only when its notes describe the behavior.
export const techniques = {
  'micro-interaction': { zh: '微交互', en: 'Micro-interaction' }, hover: { zh: '悬停反馈', en: 'Hover' }, 'scroll-driven': { zh: '滚动驱动', en: 'Scroll-driven' },
  transition: { zh: '转场', en: 'Transitions' }, morph: { zh: '形变', en: 'Morphing' }, 'drag-gesture': { zh: '拖拽与手势', en: 'Drag and gestures' },
  'kinetic-type': { zh: '动态文字', en: 'Kinetic type' }, webgl: { zh: '三维与 WebGL', en: '3D and WebGL' }, shader: { zh: '着色器', en: 'Shaders' },
  particles: { zh: '粒子', en: 'Particles' }, physics: { zh: '物理效果', en: 'Physics' }, generative: { zh: '生成式图形', en: 'Generative' },
  'data-viz': { zh: '数据可视化', en: 'Data visualisation' }, 'loading-state': { zh: '加载过程', en: 'Loading states' }, 'ai-interaction': { zh: 'AI 交互', en: 'AI interaction' },
  'sound-haptics': { zh: '声音与触感', en: 'Sound and haptics' },
} satisfies Vocabulary;

export const styles = {
  minimal: { zh: '极简', en: 'Minimal' }, dark: { zh: '深色', en: 'Dark' }, editorial: { zh: '杂志感', en: 'Editorial' },
  technical: { zh: '技术感', en: 'Technical' }, playful: { zh: '俏皮', en: 'Playful' }, retro: { zh: '复古', en: 'Retro' },
  brutalist: { zh: '粗野主义', en: 'Brutalist' }, gradient: { zh: '渐变', en: 'Gradient' }, glass: { zh: '玻璃质感', en: 'Glass' },
  texture: { zh: '颗粒与肌理', en: 'Grain and texture' }, illustrated: { zh: '插画风', en: 'Illustrated' }, photographic: { zh: '摄影主导', en: 'Photographic' },
  'rendered-3d': { zh: '三维渲染', en: '3D rendered' }, monochrome: { zh: '单色', en: 'Monochrome' }, colorful: { zh: '高饱和多彩', en: 'Colourful' },
  warm: { zh: '温暖自然', en: 'Warm and natural' }, luxury: { zh: '高端质感', en: 'Luxury' },
} satisfies Vocabulary;

export const facetVocabulary = { industry: industries, medium: media, pageTypes, patterns, components, techniques, styles } as const;
export type FacetName = keyof typeof facetVocabulary;
export const multiFacets = ['pageTypes', 'patterns', 'components', 'techniques', 'styles'] as const;
export const facetLimit = 3;
export type ReferenceFacets = {
  status: 'draft' | 'reviewed'; reviewedAt?: string; industry: string | null; medium: string;
  pageTypes: string[]; patterns: string[]; components: string[]; techniques: string[]; styles: string[];
};

// Own string keys only: `in` would accept inherited names such as "constructor".
const known = (vocab: Vocabulary, v: unknown) => typeof v === 'string' && Object.hasOwn(vocab, v);
// Returns the problems in one record, empty when it is valid. The file is small, so callers check every record.
export function facetProblems(id: string, f: ReferenceFacets): string[] {
  const out: string[] = [], at = (m: string) => out.push(`${id}: ${m}`);
  if (f.status !== 'draft' && f.status !== 'reviewed') at(`unknown status ${f.status}`);
  if (f.status === 'reviewed' && !/^\d{4}-\d{2}-\d{2}$/.test(f.reviewedAt ?? '')) at('reviewed without reviewedAt');
  if (f.industry !== null && !known(industries, f.industry)) at(`unknown industry ${f.industry}`);
  if (!known(media, f.medium)) at(`unknown medium ${f.medium}`);
  for (const name of multiFacets) {
    const list = f[name], vocab = facetVocabulary[name];
    if (!Array.isArray(list)) { at(`${name} is not a list`); continue; }
    if (list.length > facetLimit) at(`${name} has more than ${facetLimit} values`);
    if (new Set(list).size !== list.length) at(`${name} repeats a value`);
    for (const v of list) if (!known(vocab, v)) at(`unknown ${name} value ${v}`);
  }
  return out;
}

// Every facet value with how many references carry it, split by review status. A collection page needs at least
// `minimum` reviewed references; until then a value is only a candidate.
export function collectionCandidates(all: Record<string, ReferenceFacets>, minimum = 6) {
  const rows: { facet: FacetName; value: string; reviewed: number; draft: number; ready: boolean }[] = [];
  for (const facet of Object.keys(facetVocabulary) as FacetName[]) for (const value of Object.keys(facetVocabulary[facet])) {
    const hits = Object.values(all).filter(f => (Array.isArray(f[facet]) ? (f[facet] as string[]).includes(value) : f[facet] === value));
    const reviewed = hits.filter(f => f.status === 'reviewed').length;
    rows.push({ facet, value, reviewed, draft: hits.length - reviewed, ready: reviewed >= minimum });
  }
  return rows;
}
