import App from "../src/App";
import type { LandingHeroConfig } from "../src/LandingIntroduction";

/* zone:hero:start */
export const hero: LandingHeroConfig = {
  "id": "A",
  "layout": "story",
  "title": {
    "zh": [
      "先看懂，",
      "再做选择。"
    ],
    "en": [
      "Understand it.",
      "Then choose."
    ]
  },
  "description": {
    "zh": "从一个命题展开三种设计取舍。保留相同任务和功能，比较结构与体验，再把合适的方向带进项目。",
    "en": "Explore three trade-offs from one brief. Keep the task and features, compare the structure, then bring a direction into your project."
  },
  "primary": "compare",
  "label": {
    "zh": "比较本站三版",
    "en": "Compare this site"
  },
  "note": {
    "zh": "适合第一次了解 Variant Design 的人。",
    "en": "For your first encounter with Variant Design."
  }
};
/* zone:hero:end */

export default function VariantA() { return <App hero={hero} />; }
