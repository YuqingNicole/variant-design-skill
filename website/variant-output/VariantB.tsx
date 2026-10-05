import App from "../src/App";
import type { LandingHeroConfig } from "../src/LandingIntroduction";

/* zone:hero:start */
export const hero: LandingHeroConfig = {
  "id": "B",
  "layout": "proof",
  "title": {
    "zh": [
      "三个方案，",
      "选得明白。"
    ],
    "en": [
      "Three directions.",
      "A clearer choice."
    ]
  },
  "description": {
    "zh": "就用你正在看的这个网站：比较三个完整页面，再回到 agent 对话局部修改、撤回，最后接入项目。",
    "en": "Start with this very website: compare three complete pages, then refine and undo in your agent chat before integrating the result."
  },
  "primary": "compare",
  "label": {
    "zh": "打开三版比较",
    "en": "Compare the three versions"
  },
  "note": {
    "zh": "无需配置模型 · 先比较完整页面",
    "en": "No model setup · Compare complete pages first"
  }
};
/* zone:hero:end */

export default function VariantB() { return <App hero={hero} />; }
