# 架构 RFC

| RFC | 状态 | 关联 |
|---|---|---|
| [001 · 基于用户项目的设计与交付工作流](001-project-aware-design-workflow.md) | 提案，待实现 | PRD-000、001、002、003、007；Issue #18、#19、#25 |
| [002 · 设计方向库](002-direction-library.md) | 已接受，P0–P4 已实施 | RFC-001；PRD-006、007；Issue #40、#44 |
| [003 · 设计参考库验证闭环](003-reference-library-validation-loops.md) | 提案，待验证 | RFC-001、002；设计参考库 PRD v0.2 工作稿 |
| [004 · 首页：设计导航站的第一屏](004-landing-first-screen.md) | 已修订，§0 已实施 | RFC-001、002、003 |
| [005 · 网站多语言架构](005-multilingual-architecture.md) | 已接受，P0 已实施 | RFC-002、003 §5 |
| [006 · 产品架构：开源技能、托管生成与设计系统](006-product-architecture.md) | 提案，待确认；§4.1 已实现（#137），付费点未定 | PRD-000、004、005；RFC-001、002 |
| [007 · 设计系统分层：决策、基础值、语义、组件与模式](007-design-system-layers.md) | P0/P1 已实现；Codex 链通过，Claude/视觉及部分选择待验 | RFC-006 §4.1 |
| [008 · 改定位：以设计灵感为主](008-inspiration-first-repositioning.md) | 已接受，P1–P3 已实施，本地验证通过；待审阅/合并 | RFC-003、004、005 |
| [009 · 确认设计系统与应用到已有方向的边界](009-design-system-adoption.md) | 已实现，Codex 真实链通过；Claude/视觉待验 | RFC-006、007；PR #150 |
| [010 · 比较页区域点选与公开代码检查页](010-region-selection-and-public-checks.md) | 具体提案，待维护者分别选择 | TODO 产品项；RFC-001、003、007 |
| [011 · 原生 Vite 预览与交付实测矩阵](011-native-vite-delivery-evaluation.md) | 执行设计草案，未验收 | PRD-003；Issue #19 |
| [012 · 预览文件归属](012-preview-file-ownership.md) | 已实现，真实 Codex 58 项通过；完整验收待审 | Issue #19；PR #159 |
| [013 · 共享依赖闭包](013-shared-dependency-closure.md) | 已实现，真实 Codex 68 项通过；完整验收待审 | Issue #18、#19；PR #160 |
| [014 · 版本绑定交付凭证](014-version-bound-delivery-receipts.md) | 已实现，真实 Codex 78 项通过；完整验收待审 | Issue #18、#19；PR #161 |
| [015 · Agent 自动生成运行检查计划](015-agent-authored-runtime-plans.md) | 实际 HTML 25/25、Vite 27/27 与独立审计通过；完整交付/跨项目门槛待验 | Issue #18、#19、#25 |
| [016 · HTML 交付闭环与逐条失败比较](016-html-handoff-and-diagnostic-comparison.md) | 已实现；实际 Codex 43/43 与独立审计通过，完整 issue 验收待审 | Issue #18、#19 |

RFC 记录设计决策与约束，PRD 记录验收要求；实现状态以对应 Issue 和验证证据为准。
