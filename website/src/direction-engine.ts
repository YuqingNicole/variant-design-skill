import { getCommunityPalette, type PaletteId } from "./community-palettes";

export type Language = "zh" | "en";

export type DesignDirection = {
  id: "A" | "B" | "C";
  name: string;
  thesis: string;
  typography: string;
  density: string;
  layout: "editorial" | "system" | "expressive";
  layoutLabel: string;
  motion: string;
  reason: string;
  colors: [string, string, string, string];
  sampleTitle: string;
  sampleMeta: string;
};

type Domain = "finance" | "developer" | "wellness" | "luxury" | "education" | "climate" | "community" | "general";
type Tone = "trust" | "playful" | "premium" | "minimal" | "bold" | "warm" | "technical";

const domainSignals: Record<Domain, string[]> = {
  finance: ["finance", "financial", "bank", "banking", "money", "wealth", "investment", "fintech", "财务", "金融", "银行", "投资", "理财"],
  developer: ["developer", "coding", "code", "api", "ai", "software", "saas", "tool", "开发者", "编程", "代码", "人工智能", "软件", "工具"],
  wellness: ["health", "wellness", "meditation", "fitness", "care", "medical", "健康", "冥想", "健身", "医疗", "护理"],
  luxury: ["luxury", "fashion", "jewelry", "beauty", "hotel", "premium", "奢侈", "时尚", "珠宝", "美妆", "酒店", "高端"],
  education: ["education", "learning", "course", "school", "student", "教育", "学习", "课程", "学校", "学生"],
  climate: ["climate", "energy", "sustainable", "environment", "green", "气候", "能源", "可持续", "环保", "绿色"],
  community: ["community", "creator", "social", "event", "culture", "社区", "创作者", "社交", "活动", "文化"],
  general: [],
};

const toneSignals: Record<Tone, string[]> = {
  trust: ["professional", "credible", "trust", "serious", "专业", "可信", "信任", "严肃"],
  playful: ["playful", "fun", "friendly", "youth", "有趣", "好玩", "友好", "年轻"],
  premium: ["premium", "luxury", "elegant", "exclusive", "高端", "奢华", "优雅", "精品"],
  minimal: ["minimal", "simple", "clean", "quiet", "极简", "简洁", "干净", "克制"],
  bold: ["bold", "experimental", "edgy", "different", "大胆", "实验", "前卫", "不同"],
  warm: ["warm", "human", "calm", "gentle", "温暖", "人性", "平静", "柔和"],
  technical: ["technical", "data", "precise", "system", "技术", "数据", "精确", "系统"],
};

const palettes: Record<Domain, Array<[string, string, string, string]>> = {
  finance: [["#102A43", "#D9EAF4", "#00A896", "#F7F4ED"], ["#071B33", "#4BE1C3", "#F3F7FA", "#FFB703"], ["#351431", "#FF6B6B", "#FFE66D", "#F9F2EA"]],
  developer: [["#101014", "#E7E7EA", "#7957FF", "#C9FF57"], ["#071D21", "#66FFE3", "#E8FFF9", "#FF6B35"], ["#231942", "#FF4D8D", "#F9C74F", "#F8F5FF"]],
  wellness: [["#133C3A", "#E9F4EE", "#8BC6A1", "#F4B8A7"], ["#273043", "#EFF6F2", "#57A773", "#F6C85F"], ["#572E54", "#F9E9EC", "#F58F7C", "#B8E0D2"]],
  luxury: [["#17120E", "#F1E7D3", "#B89B5E", "#FBF8F2"], ["#2D1B25", "#F5E9E2", "#D2A679", "#7A9E9F"], ["#0D0D0D", "#FFF8E7", "#D4AF37", "#D95D39"]],
  education: [["#17255A", "#F5F1E8", "#F4C95D", "#2CDA9D"], ["#143642", "#E9F5F2", "#0FA3B1", "#F7A072"], ["#3C1642", "#F4F1DE", "#E07A5F", "#81B29A"]],
  climate: [["#12372A", "#E8F0E5", "#436850", "#FBFADA"], ["#0B3C49", "#E0F2E9", "#38A3A5", "#F4D35E"], ["#263A29", "#F2E8CF", "#E85D04", "#80B918"]],
  community: [["#2B193D", "#F7F3FF", "#FF5C8A", "#FFD166"], ["#14213D", "#F7F7F2", "#FCA311", "#00B4D8"], ["#4A1942", "#FFF0F5", "#F15BB5", "#00BBF9"]],
  general: [["#161616", "#F1EEE6", "#2347FF", "#FF492D"], ["#102A43", "#F5F7FA", "#00A8E8", "#F6AE2D"], ["#321325", "#F8F4E3", "#E84855", "#65AFFF"]],
};

function detect<T extends string>(value: string, signals: Record<T, string[]>, fallback: T): T {
  const normalized = value.toLowerCase();
  let best = fallback;
  let score = 0;
  for (const [key, words] of Object.entries(signals) as [T, string[]][]) {
    const next = words.reduce((total, word) => total + (normalized.includes(word) ? 1 : 0), 0);
    if (next > score) { best = key; score = next; }
  }
  return best;
}

function rotate<T>(items: T[], amount: number): T[] {
  const offset = amount % items.length;
  return [...items.slice(offset), ...items.slice(0, offset)];
}

function hashPrompt(prompt: string) {
  return [...prompt].reduce((total, character) => (total * 31 + character.charCodeAt(0)) >>> 0, 7);
}

export function createDirections(prompt: string, language: Language, paletteId?: PaletteId): DesignDirection[] {
  const clean = prompt.trim();
  if (!clean) throw new Error("empty_prompt");
  if (clean.length > 600) throw new Error("prompt_too_long");

  const domain = detect<Domain>(clean, domainSignals, "general");
  const tone = detect<Tone>(clean, toneSignals, domain === "developer" ? "technical" : "trust");
  const communityPalette = getCommunityPalette(paletteId);
  const selectedPalettes: Array<[string, string, string, string]> = communityPalette
    ? (() => {
        const [ink, accent, paper] = communityPalette.colors.map((color) => color.hex);
        return [
          [ink, paper, accent, paper],
          [ink, accent, paper, accent],
          [ink, paper, accent, ink],
        ];
      })()
    : rotate(palettes[domain], hashPrompt(clean));
  const shortBrief = clean.length > 44 ? `${clean.slice(0, 42)}…` : clean;

  const zhDomain: Record<Domain, string> = { finance: "金融产品", developer: "数字工具", wellness: "健康体验", luxury: "高端品牌", education: "学习产品", climate: "可持续项目", community: "社群平台", general: "这个产品" };
  const enDomain: Record<Domain, string> = { finance: "financial product", developer: "digital tool", wellness: "wellness experience", luxury: "premium brand", education: "learning product", climate: "climate venture", community: "community platform", general: "product" };
  const zhTone: Record<Tone, string> = { trust: "可信", playful: "轻快", premium: "精致", minimal: "克制", bold: "大胆", warm: "温暖", technical: "精确" };
  const enTone: Record<Tone, string> = { trust: "credible", playful: "playful", premium: "refined", minimal: "restrained", bold: "bold", warm: "warm", technical: "precise" };

  if (language === "zh") {
    const product = zhDomain[domain];
    const voice = zhTone[tone];
    return [
      { id: "A", name: `${voice}叙事`, thesis: `先解释“为什么值得相信”，再介绍功能。把${product}写成一篇有节奏的编辑故事。`, typography: "高对比衬线标题 + 中性无衬线正文", density: "低密度 / 大留白", layout: "editorial", layoutLabel: "非对称编辑布局", motion: "克制淡入与滚动揭示", reason: `适合需要为「${shortBrief}」建立理解与信任的首次访问者。`, colors: selectedPalettes[0], sampleTitle: "先建立相信的理由", sampleMeta: "观点 / 证据 / 行动" },
      { id: "B", name: `${voice}系统`, thesis: `把核心价值变成可扫描的界面证据。用网格、指标和清晰状态呈现${product}的能力。`, typography: "紧凑无衬线标题 + 等宽数据字体", density: "高密度 / 强层级", layout: "system", layoutLabel: "模块化系统网格", motion: "状态变化与局部反馈", reason: `适合已经理解问题、希望快速验证「${shortBrief}」是否可靠的用户。`, colors: selectedPalettes[1], sampleTitle: "把能力变成证据", sampleMeta: "状态 / 指标 / 控制" },
      { id: "C", name: `${voice}反差`, thesis: `拒绝行业默认外观，用一个鲜明视觉动作制造记忆，再用简单路径推动用户行动。`, typography: "超大展示字体 + 直接的功能文案", density: "中密度 / 高对比", layout: "expressive", layoutLabel: "表达式舞台布局", motion: "大胆切换与响应式强调", reason: `适合让「${shortBrief}」从同类产品中迅速被记住。`, colors: selectedPalettes[2], sampleTitle: "看起来就不一样", sampleMeta: "态度 / 记忆 / 转化" },
    ];
  }

  const product = enDomain[domain];
  const voice = enTone[tone];
  return [
    { id: "A", name: `${voice} narrative`, thesis: `Explain why this deserves trust before listing features. Frame the ${product} as a paced editorial story.`, typography: "High-contrast serif display + neutral sans body", density: "Low density / generous space", layout: "editorial", layoutLabel: "Asymmetric editorial", motion: "Restrained fades and scroll reveals", reason: `Best for first-time visitors who need context and confidence around “${shortBrief}”.`, colors: selectedPalettes[0], sampleTitle: "Give belief a reason", sampleMeta: "POSITION / PROOF / ACTION" },
    { id: "B", name: `${voice} system`, thesis: `Turn the promise into scannable interface evidence. Use grids, metrics, and clear states to expose the ${product}'s capability.`, typography: "Compact grotesk + monospaced data face", density: "High density / strong hierarchy", layout: "system", layoutLabel: "Modular system grid", motion: "State changes and local feedback", reason: `Best for users who understand the problem and want to verify whether “${shortBrief}” is credible.`, colors: selectedPalettes[1], sampleTitle: "Turn capability into proof", sampleMeta: "STATE / SIGNAL / CONTROL" },
    { id: "C", name: `${voice} contrast`, thesis: `Reject the category default. Use one memorable visual move, then keep the path to action radically simple.`, typography: "Oversized display face + direct utility copy", density: "Medium density / high contrast", layout: "expressive", layoutLabel: "Expressive stage", motion: "Bold transitions and responsive emphasis", reason: `Best when “${shortBrief}” needs to be remembered before it is compared.`, colors: selectedPalettes[2], sampleTitle: "Look unlike the category", sampleMeta: "ATTITUDE / MEMORY / ACTION" },
  ];
}
