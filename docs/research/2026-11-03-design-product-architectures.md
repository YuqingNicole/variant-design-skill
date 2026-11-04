# 2026-11-03 · 在线设计产品的公开架构

RFC-006 的依据。只读官方公开页面（文档、价格页、博客、更新日志）；Paper 和 Claude Design 只看公开介绍页，没有注册、抓取或测试任何服务。所有事实都于 2026-11-03 核对。标 **[摘录]** 的内容来自搜索引擎对官方页面的摘录，没有通读原页。其中两条已再次直接核对：v0 Design Systems 2.0 的三条规则（`v0.app/docs/design-systems-2`），以及 `google-labs-code/design.md` 仓库（Apache-2.0）。

## 逐个产品

| 产品 | 生成与多方案 | 设计系统 | 预览运行环境 | 编辑与历史 | 交接 | 免费额度 |
|---|---|---|---|---|---|---|
| v0 | 组合模型：检索上下文 + 前沿基础模型 + Quick Edit + 流式 AutoFix + 结束后 lint（[blog](https://vercel.com/blog/v0-composite-model-family)）；没有找到多方案的说明 | 保存为 skill：`v0.json`，最多 3 个只读 GitHub 来源，导入时生成并预览起始应用；“来源里核实不了的组件、属性或 token 不用”；已有项目不会自动更新（[docs](https://v0.app/docs/design-systems-2)）。旧方式是 shadcn registry（[docs](https://v0.app/docs/design-systems)） | Vercel Sandbox 轻量虚拟机（[faq](https://v0.app/docs/faqs)） | 对话 + Design Mode；恢复版本会生成新版本 **[摘录]** | GitHub 工作分支、自动提交、PR 合并（[docs](https://v0.app/docs/github)） | 每天 7 条消息；新用户一次性 $5（[pricing](https://v0.app/pricing)） |
| Figma Make / MCP | 未公开模型 | Make kits = npm 包 + 变量和样式 + 规则说明 **[摘录]**；变量可导入导出 DTCG JSON（部分类型）**[摘录]** | 浏览器内实时预览 | 对话、点选编辑、在预览上标注、版本历史 | 单向推送到 GitHub **[摘录]**；MCP 有 `get_variable_defs`、`create_design_system_rules` 等工具（[docs](https://developers.figma.com/docs/figma-mcp-server/tools-and-prompts/)） | Starter 每天 150 点、每月最多 500 点（[pricing](https://www.figma.com/pricing/)） |
| Subframe | 一次请求出 2–3 个方案；可用自己的 Claude 或 Codex 订阅（[pricing](https://www.subframe.com/pricing)） | 主题与 token，含明暗模式 | — | 可视化画布；生成代码确定、只负责呈现 | `npx @subframe/cli sync` 同步组件；逻辑写在外层包装里（[docs](https://docs.subframe.com/concepts/design-to-code)） | 1 个项目，有限额度 |
| Google Stitch | 画布上并行出多个想法（[blog](https://blog.google/innovation-and-ai/models-and-research/google-labs/stitch-ai-ui-design/)） | 可以从任意网址提取设计系统；DESIGN.md 开放草案：YAML token + 固定顺序的说明段落，CLI 有 `lint`（含对比度检查）、`diff`、`export`（Tailwind/DTCG）（[repo](https://github.com/google-labs-code/design.md)） | — | 生成过程中可以继续调整 | MCP、SDK、导出到 AI Studio、发布到 Netlify | 未找到官方数字 |
| Lovable | — | — | 未公开 | 用 Vite 插件给 JSX 元素打稳定 ID，浏览器内改 AST 再生成代码（[blog](https://lovable.dev/blog/visual-edits)）；历史只回退代码 **[摘录]** | 双向 GitHub 同步 **[摘录]** | 每天 5 点、每月最多 30 点，免费版不能改代码或下载（[docs](https://docs.lovable.dev/introduction/subscription-plans)） |
| Bolt.new | 可选代理 | 从自己的来源编译设计系统，生成 Storybook，同步有修订可回退；自定义系统需 Teams（[docs](https://support.bolt.new/building/design-system/introduction)） | WebContainers，浏览器内跑 Node | 版本时间线 **[摘录]** | — | 每月 1M token、每天 300K（[pricing](https://bolt.new/pricing)） |
| Magic Patterns | `/Inspiration` 出 4 个方案 **[摘录]**；画布并排保留被否决的方向 **[摘录]** | 从 GitHub、npm、Figma、网站导入组件、token、规则和技能（[docs](https://www.magicpatterns.com/docs/documentation/design-systems/overview)） | — | 手动编辑和导出不扣点 | 导出 Figma、MCP **[摘录]** | 每月免费额度，数字未公开 |
| Builder.io Fusion | — | 设计系统索引：组件和 token 编目，并为每项写 AI 说明；Style Strict Mode 把样式修改限制在 token 内（[docs](https://www.builder.io/c/docs/fusion-design-system-intelligence)） | 云端、本地或 Docker | — | 所有修改都以 PR 交付（[docs](https://www.builder.io/c/docs/key-concepts-fusion)） | 每天 15 点、每月最多 60 点（[pricing](https://www.builder.io/pricing)） |
| Framer AI | 画布上的代理；分支用于比较和合并（[blog](https://www.framer.com/blog/framer-3/)） | — | — | 分支 | 未写代码导出 | 500 点（[pricing](https://www.framer.com/pricing)） |
| Claude Design | Opus 4.7；帮助页建议要 2–3 个方案（[support](https://support.claude.com/en/articles/14604416-get-started-with-claude-design)） | 读代码库和设计文件为团队建立设计系统；出结果前对照设计系统检查和修正（[blog](https://claude.com/blog/claude-design-stays-on-brand-for-daily-work)） | — | 内联评论、直接改字、调节旋钮；“还没有版本历史” | 交给 Claude Code 的交接包；ZIP、PDF、PPTX、HTML、Canva；独立站 2026-12-14 关闭 | 包含在订阅里 |
| Paper | — | token 是 CSS 变量，可映射到 Tailwind；没有自动同步，由代理通过 MCP 从 CSS 生成 token（[docs](https://paper.design/docs/tokens)） | HTML/CSS 画布 | — | 本地 MCP，可读写（[docs](https://paper.design/docs/mcp)） | 每周 100 次 MCP 调用（[pricing](https://paper.design/pricing)） |

## 标准

- **DTCG**：第一个稳定版 2025.10（约 2025-10-28）；2026-09-08 的新草案明确说不要按它实现（[designtokens.org](https://www.designtokens.org/)）。
- **shadcn registry**：`registry:base` 表示整个设计系统；`cssVars` 分 `theme`、`light`、`dark` 三组（[docs](https://ui.shadcn.com/docs/registry/registry-item-json)）。

## 共同做法

1. **设计系统是给代理用的上下文，不只是 token。** v0 的 skill、Magic Patterns 的规则、Stitch 的 DESIGN.md、Builder 的索引都把确切的值和使用规则放在一起。
2. **约束靠核对来执行。** v0 不用来源里查不到的东西，Claude Design 出结果前先自查，Builder 有 Strict Mode。
3. **“从一个选定的生成方向提炼完整设计系统”没有任何公开页面写过。** 已有的提炼都从导入开始：Claude Design 从代码和设计文件，Stitch 从网址。
4. **DTCG 用来交换，不用来工作。** 页面直接引用的格式是 CSS 变量或 Tailwind；Stitch 的 DESIGN.md 另用 YAML token 给代理读取。
5. **多方案少见，也不成体系。** 没有哪家写明了结构化的 A/B/C 比较和明确的选定步骤。
6. **撤销基本是线性版本历史。** 没有哪家按“一次请求”撤销，也没有哪家说明修改之前会检查用户有没有动过。
7. **交接走 GitHub PR 和 MCP。**
8. **免费额度的计量周期不统一。** v0、Figma、Lovable、Bolt、Builder 按天计（多数还有月上限）；Magic Patterns 按月，Paper 按周，Subframe 按项目数。见表格最后一列；手动编辑常常不扣点。

## 未核实

Stitch 的额度和模型、Figma Make 的模型、Lovable 的预览运行环境、Bolt 的模型列表；v0 和 Magic Patterns 是否内置多方案生成。
