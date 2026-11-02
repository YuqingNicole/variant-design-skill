# 竞品对比：Agent 设计技能、AI 界面生成工具和设计参考库

日期：2026-11-02。基线：master `7f67968`。目的：对照同类产品，重排 `TODO.md` 的优先级。

## 方法和限制

- 只读公开网页，每个网址一次普通请求，并试取 `/llms.txt`。没有登录、注册或运行对方产品，没有批量抓取，也没有测评条款禁止测评的服务（见 `paper-design-comparison.md`）。
- 资料由一个调研代理收集。下面标 ✓ 的几条，维护会话又打开原始页面核对过；其余以调研代理的读取为准，没核实的写“未核实”。star 数和安装量随时变化，只用来看数量级。
- 本文不判断谁的产品更好，只记录公开可查的事实和我们的差距。

## 1. 最接近的对手是 Impeccable

[Impeccable](https://github.com/pbakaus/impeccable)：Apache-2.0，约 9.98 万 star ✓。它是给编码 Agent 用的设计命令集，带一个识别通用 AI 设计模式的检测器 ✓。它的 `generate` 命令默认生成 3 个变体，可选 1–8 个，接受后改动写进源码 ✓（[文档](https://impeccable.style/docs/generate)）。文档只说接受前可以 Discard 恢复原样，没写接受之后怎么撤回 ✓。

这说明“一次出三版”已经不是我们独有的。我们能站住的区别是：

- **三个完整方向，不是一个元素的变体。** Impeccable 针对页面上一个具名区域出变体；Taste Skill 从 20 个方向里抽 3 个，再由 Agent 选一个；Magic Patterns 用控件切换变体。我们是同一个任务、同一份数据的三个完整版本，并写明各自的取舍。
- **撤回和接入的安全规则。** 按方向撤回、拒绝覆盖用户没看过的改动、可回滚的接入、修改不等于选定。在同类开源技能里没有看到成文的同类规则；Lovable、v0、Figma Make 有版本历史，但只在它们自己的托管产品里。
- **公开实测记录和“没做过对照实验”这类限制说明。**
- **真正的中英文站点，带 `hreflang`。** 同类里只看到 UX Pilot 这样做；Open Design 和 UI UX Pro Max 只翻译了 README。

## 2. 对照表（摘要）

| 产品 | 类别 | 多方向 | 在用户自己的代码里 | 撤回 | 价格 | 公开内容和分发 |
|---|---|---|---|---|---|---|
| Impeccable | 开源技能 | 默认 3 个变体（1–8）✓ | 是，需开发服务器 ✓ | 只写了接受前 Discard ✓ | 免费 | llms.txt、每个命令一页文档、反模式目录 `/slop`、gallery、changelog、案例；支持 19+ 个 Agent |
| Taste Skill | 开源技能 | 抽 3 个方向，Agent 选 1 个 | 是 | 未说明 | 免费 | 文档、changelog、展示页；Claude 和 Codex 插件 |
| UI UX Pro Max | 开源技能 | 推荐一套设计系统 | 是 | 只有 `--dry-run` | 免费＋付费高级版 | README 6 种语言 |
| frontend-design | Anthropic 官方插件 | 选一个明确方向 | 是 | 无 | 免费 | 官方插件市场 |
| Open Design | 开源工作台 | 新项目 5 个视觉方向 | 是 | 未说明 | 免费，自带密钥 | README 14 种语言；首页标题自称 Claude Design 的开源替代 |
| Claude Design | Anthropic Labs 产品 | “多个方向” | 读代码库，交给 Claude Code | 未说明 | 含在付费订阅里 | 条款禁止测评，只记公开事实 |
| Subframe | 托管＋代码库 | 首页演示 3 个变体 | 是 | 未核实 | 免费／Pro 每人每月 $20 | 博客、changelog、JSON-LD |
| v0、Lovable | 托管应用生成 | 不是重点 | 否（托管） | 有版本历史 | 付费 | 模板页、changelog、替代品对比页 |
| UX Pilot | 托管设计生成 | 每个任务多个方向 | 经 MCP 和 Figma | 未核实 | 免费额度／Pro $29 | 约 13 种语言 `hreflang`；llms.txt 列出约 20 个对比页 |
| variant.com | 托管 AI 设计信息流 | 滚动浏览 | 否 | 未核实 | 未核实（第三方说 Pro $20） | 客户端渲染，任何路径都返回首页标题 |
| Mobbin、Refero、Curated、Land-book | 设计参考库 | — | — | — | Mobbin Pro 每月 $10；Curated Pro 每月 $9 | 多数有 llms.txt；Mobbin、Refero、Curated 提供 MCP；都没看到 `hreflang` |

Bolt、Uizard 和类似的应用生成器没有多方向功能，没列入；Lapa Ninja 返回 403，没有核实；Godly 现在跳转到 recent.design。

## 3. 我们缺的公开内容

- **对比和替代页。** 例如 UX Pilot 的 [Google Stitch 对比](https://uxpilot.ai/google-stitch)、Lovable 的 [替代品专题](https://lovable.dev/guides/category/app-alternatives)。
- **反模式目录。** Impeccable 的 [/slop](https://impeccable.style/slop)。我们有 `quality-gate.mjs` 的规则，但没有公开页面。
- **案例或模板库。** v0 和 Lovable 的 templates，Impeccable 的 gallery。
- **Changelog 页面。** v0、Impeccable、Subframe、Taste 都有；我们只有仓库里的 `CHANGELOG.md`。
- **每个命令一页文档。** Impeccable 的 `/docs/generate` 等。
- **告诉 Agent 怎么用的 llms.txt。** 例如 Mobbin、Refero、UX Pilot 的 llms.txt。

## 4. GEO 问题的竞争情况（问题见 `2026-11-02-geo-strategy.md`）

- **竞争激烈：** 问题 3（AI 界面千篇一律）有 Impeccable `/slop`、frontend-design 和 Taste；问题 6（Claude Code 生成 A/B/C）有 Impeccable 的文档；问题 7（Codex 怎么装技能）属于 OpenAI 官方文档。
- **有人在争：** 问题 4（现有项目里比较方案）和问题 8（开源的 AI 设计探索工具）。
- **还有空间：** 问题 1、2（完整方向和取舍）、问题 5（我们自己的安装）、问题 9（带来源和核对日期的参考站）、问题 10（在自己仓库里撤回 Agent 的修改）。

## 5. 风险

- **名称和 variant.com 容易混淆。** README、`README_CN.md` 和 GitHub 描述都写着“受 Variant 设计社区启发”，而 variant.com 是商业产品；第三方评测里它的操作名（vary strong/subtle、remix colors 等）和我们的命令很像。读者可能以为两者有关联。✓（仓库文字已核对）
- **Impeccable 的署名义务。** README 写“powered by the Impeccable design system”，Impeccable 是 Apache-2.0。需要确认我们有没有复制它的文字，以及是否要附 NOTICE 或署名。本文没有核对。
- **价格页和事实不一致。** 价格页在卖“托管生成额度”，而 `llms.txt` 写着“没有托管服务”。✓ 按 `AGENTS.md` 的诚实要求，这要么标成计划中，要么拿掉。
- **技能页只列了我们自己。** `/skills` 承诺“只收实际跑过的设计技能”，但目前只有 1 条。✓
- **体量差距。** 同类开源技能是 10 万 star 级别，我们是 47 ✓。列表式的 AI 回答会被它们占据；现实的机会在问题 5、9、10 和“在自己仓库里比较完整方向”。
