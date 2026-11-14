# 关键词候选清单

日期：2026-11-09。站点：https://variantdesign.xyz 。

## 1. 范围与局限

- 这份清单是**候选词**，依据是网站现有定位、`2026-11-02-geo-strategy.md` 里的 10 个测量问题，以及 2026-11-09 的两次公开网页搜索（只看了搜索结果里的标题和摘要）。
- **没有任何搜索量、难度或点击率数据。** 没有用到 Ahrefs、Semrush、Keyword Planner 或 Search Console。表里"相对竞争"只是根据搜索结果里同类页面的多少做的主观判断，需要用真实工具核对。
- 没有逐个读过竞品的完整页面，对它们功能的描述只来自目录页和摘要。

## 2. 品牌词风险

搜 "variant design"、"variant ai" 时，结果主要是另一个同名产品 Variant（UI 设计生成网站）及其评测页，另外 mcpmarket 上也有一个叫 variant design 的技能页面。品牌词本身很难带来流量，也容易被误认为同一个产品。

建议：标题和描述里用场景词补充定位，不依赖品牌词。GitHub 描述里已有 "inspired by the Variant design community" 的措辞（见 GEO 策略文档第 1 节），要继续留意是否会让人误解。

## 3. 候选词

"相对竞争"：低、中、高，仅为主观判断。"对应页面"指现有或建议的落地页。

### A. 产品能力词（英文）

| 关键词 | 相对竞争 | 对应页面 |
|---|---|---|
| claude code design skill | 中 | 首页、`/skills` |
| codex design skill / codex ui skills | 低到中 | 首页、`/docs` |
| claude code multiple design variations | 中 | `/guides` 比较方向 |
| generate design directions ai | 中 | 首页 |
| agent skill ui design | 中 | `/skills` |
| ai design variations generator | 高（被 Variant、Stitch 等占据） | 暂不主攻 |

### B. 痛点词（英文）

| 关键词 | 相对竞争 | 对应页面 |
|---|---|---|
| how to make ai generated ui not look generic | 中 | `/guides` 避免千篇一律 |
| avoid generic ai design / ai slop design | 中 | 同上 |
| compare ui variants in codebase | 低 | `/guides` 比较方向 |
| undo ai design changes / rollback ai edits | 低 | `/guides` 撤回修改 |
| design exploration with ai coding agents | 低 | 待写 |

### C. 中文词

| 关键词 | 相对竞争 | 对应页面 |
|---|---|---|
| Claude Code 设计技能 / Codex 设计 skill | 低（未核实） | 首页、`/docs` |
| 一次生成多个设计方案 | 低（未核实） | `/guides` 比较方向 |
| AI 生成设计方案对比 | 低（未核实） | 同上 |
| AI 网页设计千篇一律怎么办 | 低（未核实） | `/guides` 避免千篇一律 |
| 设计灵感 标注来源 | 低（未核实） | `/inspiration` |

中文词的竞争判断没有搜索结果支撑，是推测，优先用工具核实。

### D. 对比词

只用公开可查的事实，不做对方条款禁止的测评，不用对方品牌素材（见 `paper-design-comparison.md`）。

| 关键词 | 备注 |
|---|---|
| design-shotgun alternative | 搜索结果中出现 gstack 的 design-shotgun，描述为生成多个方向并在浏览器并排比较 |
| superdesign alternative | SuperDesign 的目录页称其支持 70 多个 agent |
| design-variations (skills.sh) | 目录页称其生成单组件的多个变体并放进一个对比页 |

这些描述只来自目录页和摘要，写对比页之前要读对方的 README 核实。

## 4. 现状与建议

- 当前首页 `<title>` 是 "Variant Design — 第一稿不是答案。"，没有任何场景词。建议加上 "Claude Code / Codex 设计技能" 一类的说明，具体改写需要先读线上 `<title>` 和 `description`。
- 已有的 3 篇 `/guides`（比较方向、撤回修改、避免千篇一律）正好覆盖 B 类和中文 C 类的主要词。
- 优先补：codex 相关的落地内容（竞争可能较低），以及 "design exploration with ai coding agents"。
- 不建议主攻 "ai design variations generator" 这类通用词。

## 5. 域名与 Search Console

`AGENTS.md` 当前写明生产域名是 `https://variantdesign.xyz`，旧的 `variant-design-skill.vercel.app` 仍指向同一个部署。`2026-11-07-search-console-readiness.md` 的检查和属性方案仍基于 vercel.app。需要确认：

1. 是否用 `variantdesign.xyz` 建立 Search Console 属性并提交 `/sitemap.xml`。
2. 旧域名是否 301 到新域名，canonical、hreflang 和 sitemap 是否已改用新域名。我们没有核实过这些。

## 6. 下一步（用真实数据验证）

1. 建好 Search Console 属性后，看哪些词已经有展示，再调整本清单。
2. 用 Google Keyword Planner 或 Ahrefs、Semrush 免费版查 A、B、C 三类词的搜索量，把数字补进上表，标明来源和日期。（2026-11-14 补充：维护者提供了另外六个英文词的搜索量和难度，记在 `2026-11-14-keyword-candidates.md`；上表的词仍然没有数字；第 4 节说的首页标题后来已改为主打设计灵感，技能类的词由 `/skills` 和 `/docs/install` 的标题承接，见那份记录第 4 节。）
3. 用 Google Trends 比较 "claude code design skill" 与 "codex design skill" 的相对热度。
4. 按 `2026-11-02-geo-strategy.md` 第 3 节的 10 个问题做第一次基线测量，记录在本目录。

## 7. 来源

- https://www.banani.co/blog/variant-ai-review-and-pricing
- https://linkgo.dev/tools/variant-ai-tools-2026-04-24
- https://mcpmarket.com/tools/skills/variant-design
- https://open-design.ai/skills/design-shotgun/
- https://www.sourcepulse.org/projects/32836934
- https://skills.sh/ravnhq/ai-toolkit/design-variations
