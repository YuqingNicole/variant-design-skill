# RFC-002 · 设计方向库：从"看到喜欢的"到"在自己项目里出三版"

- 状态：提案，待评审。
- 更新：2026-10-27。
- 关联：RFC-001；PRD-006、007；Issue #40、#44。
- 参考：recent.design 公开页面（首页、`/skills`、`/info`），2026-10-27 按普通访客方式阅读。只记录它公开呈现的形态，不抓取、不复制内容。

## 1. 核心决策

把网站从"营销页加若干演示"改成一个**设计方向库**：持续更新、宁缺毋滥的作品流。每件作品都附带一张可执行的**方向卡**，用户复制一条指令，就能让自己的 agent 用 Variant Design 在真实项目里按这个方向出 A/B/C。

recent.design 解决的是"去哪里看好设计"，它只能看、不能用。我们把浏览接到 RFC-001 的工作流上，网站负责被发现和带来流量，技能负责交付。这样内容产品服务于核心工作流，不会变成第二个产品。

```mermaid
flowchart LR
  A[浏览作品流] --> B[作品详情：方向卡]
  B --> C[复制指令到 Claude Code / Codex]
  C --> D[技能读取方向卡]
  D --> E[RFC-001：识别项目 → 三版 → 比较 → 接入]
```

## 2. 参考对象的公开形态

| 方面 | recent.design | 本库的取舍 |
|---|---|---|
| 首页 | 按分类的作品流（界面、品牌、动效、插画、海报、发布视频、网站、App 图标等），署名作者，部分作品是多图轮播 | 采用作品流和署名。分类收窄到我们能交付的：落地页、产品界面、品牌、组件、数据展示 |
| 资源 | Tools、Skills、Jobs。Skills 按 `作者/仓库` 列出，配一句话说明、安装按钮（skills.sh）和安装量 | 做 `/skills`，但只收录与设计交付相关、我们实际试过的技能，并写明试用结论 |
| 策展 | "quality over quantity"，没有公开投稿和授权政策 | 同样宁缺毋滥，但必须公开投稿和授权规则（见第 5 节） |
| 商业 | 赞助位、招聘 | 本阶段不做。等流量有了证据再评估 |
| 交付 | 无 | **差异点**：每件作品都能在用户自己的项目里试 |

## 3. 现状与差距

| 现状 | 问题 |
|---|---|
| 单页应用，整站只有一个 `index.html`，标题固定 | 作品没有独立网址、标题、描述和分享卡片。搜索引擎和社交平台看到的每一页都一样，内容站失去最主要的流量来源 |
| 灵感数据在 `website/src/inspiration-data.ts`，24 条 | 全部标注 `reference-only; no redistribution permission established`，却以截图形式托管在 `public/inspiration/`。小规模演示时风险有限，变成公开内容站后不可接受 |
| 案例写死在 `ContentPages.tsx` 的 `cases`（3 条）里 | 没有统一结构，新增要改组件代码 |
| 七个入口：首页、`/inspiration`、`/showcase`、`/directions`、`/docs`、`/workbench`、`/canvas` | 定位分散。工作台和画布各有一套生成器，与技能重复 |
| 线上开放模型接口（#38） | 公开站点替所有访客付模型费用（#40）。方向库不需要在网站上生成 |

## 4. 信息架构

| 路径 | 内容 |
|---|---|
| `/` | 作品流：精选在前，按分类筛选，无限滚动或分页 |
| `/d/:slug` | 作品详情：多图、署名、出处、方向卡、"在你的项目里试试"、相关作品 |
| `/c/:category` | 分类页 |
| `/skills` | 精选设计技能，Variant Design 本身排第一 |
| `/docs` | 安装与使用（保留现有内容） |
| `/lab/workbench`、`/lab/canvas` | 现有工作台和画布，标为实验，不再扩展 |
| `/submit` | 投稿说明（走 GitHub PR，见第 6 节） |

旧路径 `/inspiration`、`/showcase`、`/directions` 做 301 跳转到新路径，旧链接不失效。

## 5. 内容来源与授权

每件作品必须属于下面三类之一，构建时校验：

| 类别 | 说明 | 能否托管图片 |
|---|---|---|
| `own` | 用 Variant Design 在示例项目里实际跑出来的方向，附 `variant-output` 证据 | 可以 |
| `permission` | 作者授权的投稿，PR 里附授权声明，并记录授权人和日期 | 可以，按授权范围 |
| `link-only` | 公开作品，只有文字分析，加原站链接 | **不托管截图**。卡片用文字和配色排版，不放对方的图 |

第一阶段只上线 `own` 和 `permission`。现有 24 条灵感全部降为 `link-only`，并移除托管的截图。这是上线内容站之前必须完成的第一件事。

## 6. 数据模型

作品存放在仓库里：`content/entries/<slug>.json`，图片放在 `content/media/<slug>/`。新增和修改都走 PR，审核就是代码评审，历史天然可追溯。

```json
{
  "slug": "evidence-first-saas-hero",
  "title": ["证据先行的 SaaS 首屏", "Evidence-first SaaS hero"],
  "category": "landing",
  "tags": ["saas", "editorial"],
  "source": "own",
  "credit": { "name": "Variant Design", "url": "https://github.com/YuqingNicole/variant-design-skill" },
  "permission": null,
  "media": [{ "file": "a.webp", "width": 1600, "height": 1000, "alt": ["…", "…"] }],
  "direction": {
    "intent": ["…", "…"],
    "comparison": { "optimizes": ["…", "…"], "tradeoff": ["…", "…"], "bestFor": ["…", "…"] },
    "rules": { "type": "serif display + sans body", "density": "low", "layout": "single column, proof before features", "color": "neutral ground, one accent" },
    "avoid": ["…"]
  },
  "evidence": { "project": "examples/…", "variant": "B", "revision": 3 },
  "featured": true,
  "publishedAt": "2026-11-01"
}
```

- 双语字段沿用网站已有的 `[zh, en]` 顺序。
- `direction` 就是方向卡，同时提供给人看和给技能读。`comparison` 沿用技能在 `variant-output/.variant-context.json` 里每个方向的 `comparison`（`optimizes`、`tradeoff`、`bestFor`，见 `references/project-context.md`），只是改成双语，两边不各写一套。
- 校验脚本 `website/scripts/content.test.mjs` 检查以下内容，并加入 CI：
  - 必填字段齐全；
  - `source` 与图片托管规则相符；
  - 图片尺寸不超过上限，`alt` 双语齐全；
  - `slug` 唯一；
  - `own` 作品的 `evidence` 指向仓库里真实存在的产出。

## 7. 渲染与部署

- **静态生成**：保留 Vite 加 React，构建时用 `react-dom/server` 为每个路由预渲染一份 HTML，写入各自的标题、描述、canonical 和 Open Graph 信息，浏览器端再接管交互。不迁移框架，现有组件和测试都保留。
  - 只有当预渲染在路由数量或增量更新上撑不住时，才评估迁到 Astro。
- **分享图**：第一阶段直接用作品首图，按 1200×630 裁切；`link-only` 作品用文字排版生成分享图。
- **sitemap 和 RSS**：构建时生成。
- **图片**：仓库里只放已优化的 WebP，校验脚本限制体积。响应式 `srcset` 放到第二阶段。
- **部署**：保持 Vercel 静态部署。网站不再需要模型。公开站点的模型接口默认关闭：只有设置 `PUBLIC_MODEL_ROUTES=1` 时，函数才处理生成请求，否则一律返回 404。这样 #40 的费用风险就不存在了。本地运行不受影响。

## 8. "在你的项目里试试"

详情页给出一条可以直接粘贴的指令，例如：

```
用 variant-design 参考 https://variant-design-skill.vercel.app/d/evidence-first-saas-hero.json 的方向，
给我项目的首页出三版：一版贴近这个方向，两版作为对照。给出有理由的推荐，但不替我选定。
```

- 每件作品同时发布 `/d/:slug.json`，内容就是方向卡。
- 技能新增一份参考文件 `references/direction-cards.md`，说明怎样读取方向卡，并把方向卡当作风格建议，按规则优先级处理：用户约束 → 现有设计系统 → 可访问性 → 方向卡。也就是说，方向卡不能覆盖品牌约束，不能当作复制对方的设计。
- `link-only` 作品的方向卡只包含我们自己写的分析，不包含对方的素材。

## 9. 分期与验收

| 阶段 | 内容 | 验收 |
|---|---|---|
| P0 授权清理 | 24 条灵感降为 `link-only`，移除托管截图；写出投稿和授权规则 | 仓库中没有未授权的第三方截图；`/submit` 有公开规则 |
| P1 数据与校验 | `content/` 结构、校验脚本接入 CI；把 3 个现有案例和网站自身的 A/B/C 迁成 `own` 作品 | 至少 6 件 `own` 作品通过校验，每件都有真实 `evidence` |
| P2 静态页面 | 作品流、详情页、分类页、预渲染、分享图、sitemap、RSS、旧路径跳转 | 每个详情页的 HTML 里直接包含各自的标题和描述；Playwright 覆盖作品流、详情页、手机宽度和旧路径跳转 |
| P3 方向卡进入工作流 | `/d/:slug.json`、`references/direction-cards.md`、"试试"指令 | 在一个一次性项目里，用 Claude Code 和 Codex 各跑一次：技能读取方向卡，出 A/B/C，并且没有覆盖项目的品牌约束。结果记录到 `docs/research/` |
| P4 技能目录与分发 | `/skills`；申请收录到 recent.design Skills 栏目和 skills.sh | 目录上线；收录申请已提交（不把"已提交"说成"已收录"） |
| 之后 | 投稿量、赞助位 | 有流量和投稿的证据后再立项 |

工作台和画布移到 `/lab`，与 P2 一起做。

## 10. 风险

- **偏离核心**：内容站本身很容易做成另一个产品。对策是硬性规定每件作品都必须有能直接使用的方向卡，不能只用来看。
- **内容质量和维护成本**：宁缺毋滥意味着更新慢。对策是先用自产作品撑起内容，让 `own` 作品顺便成为技能的回归样本。
- **版权**：P0 必须先完成。投稿授权要有记录，有人提出撤下请求时，按流程处理并留痕。
- **把展示当成效果证明**：展示页上好看，不等于在用户项目里好用。详情页只陈述实际跑过的证据，不写"提升转化"之类没有验证过的说法。

## 11. 待决定

1. 是否同意在 P0 移除现有 24 张第三方截图。
2. 公开站点是否默认关闭模型接口（第 7 节）。如果关闭，#39 和 #40 就从"必须做"变为"可选"。
3. 是否需要独立域名。
4. 第一批 `own` 作品选哪些行业和页面类型。建议覆盖落地页、产品界面、数据展示各两件。
