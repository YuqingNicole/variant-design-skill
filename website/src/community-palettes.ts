import type { Language } from "./direction-engine";

export type PaletteId =
  | "ancient-gild-slate"
  | "colonial-cobalt"
  | "vintage-hearth-ash"
  | "ancient-gild-gold"
  | "toxic-nightfall"
  | "vintage-hearth-snow"
  | "electric-tundra";

type LocalizedText = Record<Language, string>;

export type CommunityPalette = {
  id: PaletteId;
  image: string;
  name: LocalizedText;
  mood: LocalizedText;
  colors: readonly [
    { name: LocalizedText; hex: string },
    { name: LocalizedText; hex: string },
    { name: LocalizedText; hex: string },
  ];
};

export const paletteSourceUrl = "https://www.threads.com/share/_4EmJsY_E/";

export const communityPalettes: readonly CommunityPalette[] = [
  {
    id: "ancient-gild-slate",
    image: "/palettes/ancient-gild-slate.jpg",
    name: { zh: "古金 · 岩蓝", en: "Ancient Gild · Slate" },
    mood: { zh: "冷静、矿物感、克制", en: "Quiet, mineral, restrained" },
    colors: [
      { name: { zh: "缟玛瑙黑", en: "Onyx" }, hex: "#0A0A0A" },
      { name: { zh: "蓝灰石", en: "Blue Slate" }, hex: "#536878" },
      { name: { zh: "雪花石灰", en: "Alabaster Grey" }, hex: "#E5E4E2" },
    ],
  },
  {
    id: "colonial-cobalt",
    image: "/palettes/colonial-cobalt.jpg",
    name: { zh: "殖民钴蓝", en: "Colonial Cobalt" },
    mood: { zh: "深邃、戏剧性、电光", en: "Deep, theatrical, electric" },
    colors: [
      { name: { zh: "午夜紫", en: "Midnight Violet" }, hex: "#240A24" },
      { name: { zh: "蓝紫", en: "Blue Violet" }, hex: "#9932CC" },
      { name: { zh: "薰衣草", en: "Lavender" }, hex: "#E6E6FA" },
    ],
  },
  {
    id: "vintage-hearth-ash",
    image: "/palettes/vintage-hearth-ash.jpg",
    name: { zh: "旧日炉火 · 灰麻", en: "Vintage Hearth · Ash" },
    mood: { zh: "旧刊、温和、居所感", en: "Vintage, gentle, domestic" },
    colors: [
      { name: { zh: "深酒红", en: "Dark Wine" }, hex: "#6F1D1B" },
      { name: { zh: "灰烬绿", en: "Ash Grey" }, hex: "#ADBDA8" },
      { name: { zh: "亚麻白", en: "Linen" }, hex: "#F0E6DE" },
    ],
  },
  {
    id: "ancient-gild-gold",
    image: "/palettes/ancient-gild-gold.jpg",
    name: { zh: "古金 · 旧金", en: "Ancient Gild · Old Gold" },
    mood: { zh: "历史感、奢华、温暖", en: "Historic, opulent, warm" },
    colors: [
      { name: { zh: "黑樱桃", en: "Black Cherry" }, hex: "#550003" },
      { name: { zh: "旧金", en: "Old Gold" }, hex: "#B8AB38" },
      { name: { zh: "香草黄", en: "Vanilla Custard" }, hex: "#E0D794" },
    ],
  },
  {
    id: "toxic-nightfall",
    image: "/palettes/toxic-nightfall.jpg",
    name: { zh: "毒性夜幕", en: "Toxic Nightfall" },
    mood: { zh: "灼热、泥土感、亲密", en: "Burnt, earthy, intimate" },
    colors: [
      { name: { zh: "浓缩咖啡", en: "Espresso" }, hex: "#4E2C23" },
      { name: { zh: "焦桃", en: "Burnt Peach" }, hex: "#E27258" },
      { name: { zh: "柔杏", en: "Soft Apricot" }, hex: "#FFDAB9" },
    ],
  },
  {
    id: "vintage-hearth-snow",
    image: "/palettes/vintage-hearth-snow.jpg",
    name: { zh: "旧日炉火 · 雪红", en: "Vintage Hearth · Snow" },
    mood: { zh: "锐利、浪漫、明亮", en: "Sharp, romantic, luminous" },
    colors: [
      { name: { zh: "炽红", en: "Inferno" }, hex: "#AA0003" },
      { name: { zh: "长春花蓝", en: "Periwinkle" }, hex: "#BFB4DC" },
      { name: { zh: "亮雪白", en: "Bright Snow" }, hex: "#FAFBFD" },
    ],
  },
  {
    id: "electric-tundra",
    image: "/palettes/electric-tundra.jpg",
    name: { zh: "电光苔原", en: "Electric Tundra" },
    mood: { zh: "冰冷、数字化、高能", en: "Icy, digital, high-energy" },
    colors: [
      { name: { zh: "普鲁士蓝", en: "Prussian Blue" }, hex: "#050A30" },
      { name: { zh: "纯蓝", en: "Blue" }, hex: "#0000FF" },
      { name: { zh: "青色", en: "Cyan" }, hex: "#00FFFF" },
    ],
  },
] as const;

export function getCommunityPalette(id?: PaletteId) {
  return communityPalettes.find((palette) => palette.id === id);
}
