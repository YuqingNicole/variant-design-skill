import App from "../src/App";
import type { LandingHeroConfig } from "../src/LandingIntroduction";

/* zone:hero:start */
export const hero: LandingHeroConfig = {
  "id": "C",
  "layout": "install",
  "title": {
    "zh": [
      "把方向，",
      "带进项目。"
    ],
    "en": [
      "Bring a direction",
      "into your project."
    ]
  },
  "description": {
    "zh": "安装完整技能，沿用项目的技术栈和设计系统。从三个可比较的方案出发，每次局部修改都保留撤回路径。",
    "en": "Install the complete skill and keep your stack and design system. Start with three comparable directions and preserve a way back through every local edit."
  },
  "primary": "install",
  "label": {
    "zh": "复制完整安装命令",
    "en": "Copy the install command"
  },
  "note": {
    "zh": "适合已经确定要在项目里使用的人。",
    "en": "For people ready to use it in a project."
  }
};
/* zone:hero:end */

export default function VariantC() { return <App hero={hero} />; }
