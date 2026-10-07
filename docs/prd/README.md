# 产品内核打磨 · PRD 与跟进清单

更新日期：2026-10-07。审查基线：master `08d8623`。

本轮完成需求定义和跟踪建档，四项功能均未实现。GitHub Issue 是执行状态与验收证据的记录入口；本目录保存需求基线。范围变动需同时更新 PRD 和对应 Issue，并说明原因。

## 执行顺序

| 顺序 | 优先级 | PRD | 跟踪 | 状态 | 前置依赖 |
|---|---|---|---|---|---|
| 1 | P0 | [PRD-001 · 候选稿基准与修改冲突保护](001-revision-conflicts.md) | [#17](https://github.com/YuqingNicole/variant-design-skill/issues/17) | 待实现 | 无；首先实施 |
| 2 | P1 | [PRD-002 · 与产物版本绑定的验证证据](002-artifact-verification.md) | [#18](https://github.com/YuqingNicole/variant-design-skill/issues/18) | 待实现 | PRD-001 |
| 3 | P1 | [PRD-003 · 可追踪的项目预览、接入与回滚](003-project-integration.md) | [#19](https://github.com/YuqingNicole/variant-design-skill/issues/19) | 待实现 | PRD-001、PRD-002 |
| 4 | P2 | [PRD-004 · 工作台异步状态与持久化一致性](004-workbench-lifecycle.md) | [#20](https://github.com/YuqingNicole/variant-design-skill/issues/20) | 待实现 | 按产品优先级后置；实现可独立 |

## 跟进规则

1. 开始一项时，在对应 Issue 记录负责人、实现分支、当前范围和未决技术选择；不要因为写完 PRD 就标记功能完成。
2. 首先复现该项失败场景，再实现最小可靠改动；已存在的文件历史与项目行为应保持兼容。
3. 实现 PR 引用对应 Issue，逐项填写验收结果和证据；暂未验证的项目明确留空并说明原因。
4. PR 合并、验收清单完成且证据齐全后才能关闭 Issue；只有部分完成时保持打开。
5. PRD-002 与 PRD-003 的前置工作未完成时，可准备测试与项目样本，但不能声称依赖已经满足。
6. 不绑定虚构工期。按依赖与实际验证结果推进；遇到范围变化，保留决策记录。

## 首个执行入口

先处理 PRD-001：旧候选稿覆盖同一区域新编辑的负向用例 → 基准记录与提交前冲突检查 → 正常 apply/undo 回归 → 安装包内运行验证。

完成之后，PRD-002 使用同一内容身份记录验证证据；PRD-003 再把源稿和目标项目接入身份串起来。PRD-004 修正在线演示自身的一致性，不让官网需求牵引插件主内核。

## 证据基线

- 已复现：旧候选稿覆盖新 hero；锁定字体元数据与实际源代码可不一致；隐藏焦点页面通过在线 HTML 审计。
- 静态路径确认、尚待浏览器复现：生成期间恢复工作台历史，迟到结果可能覆盖恢复状态。
- 审查时现有文件历史 Node 测试 7 项、网站 Node 测试 4 项通过。这些结果不能代替上述新增验收。
- 真实项目接入当前只有本站专用流程的证据，不能推广为任意框架支持。

## 需求与代码导航

以下仅为基线导航，不限定实现必须保留当前组织方式：

- 文件历史：[事务与撤回](../../scripts/variant-history.mjs)、[现有回归](../../scripts/variant-loop.test.mjs)。
- 产物验证：[静态 scanner](../../scripts/quality-gate.mjs)、[在线生成与审计](../../website/server/ai.mjs)、[浏览器回归](../../tests/loop.spec.mjs)。
- 项目接入：[React 预览](../../scripts/react-preview.mjs)、[本站专用导出](../../website/scripts/export-landing.mjs)、[发布门槛](../../plugin/release-readiness.md)。
- 工作台：[页面与异步操作](../../website/src/App.tsx)、[当前历史记录](../../website/src/workspace-engine.ts)。

## 范围控制

本批不包含微服务拆分、数据库、自动部署、官网视觉改版、插件公开发布或所有框架支持。下一次实现从第一项开始，无需重新做一轮总体架构审查。
