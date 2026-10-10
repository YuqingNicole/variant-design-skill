# 产品交付与内核打磨 · PRD 跟进清单

更新日期：2026-10-08。审查基线：master `08d8623`。

已记录购买后旅程及四项内核需求，功能均待实现；需求建档不等于能力已上线。GitHub Issue 是执行状态与验收证据的记录入口；本目录保存需求基线。范围变动需同时更新 PRD 和对应 Issue，并说明原因。

## 架构 RFC

[RFC-001 · 基于用户项目的设计与交付工作流](../rfc/001-project-aware-design-workflow.md) 定义项目识别前置能力，补充 PRD-003 和 PRD-007，并为 PRD-002 提供依赖范围与检查计划。状态为提案，尚未实现。

## 购买后旅程与发布门槛

| 次序 | PRD | 跟踪 | 依赖/作用 | 状态 |
|---|---|---|---|---|
| 1 | [付费产品定义与完整旅程](000-paid-product-journey.md) | [#22](https://github.com/YuqingNicole/variant-design-skill/issues/22) | 定义交付物、付费增量与商业门槛 | 待实现 |
| 2 | [购买、权益确认与领取](005-purchase-entitlement.md) | [#23](https://github.com/YuqingNicole/variant-design-skill/issues/23) | 基于 000；未定商业字段阻断真实收费 | 待实现 |
| 3 | [发行包分发与安装验证](006-distribution-installation.md) | [#24](https://github.com/YuqingNicole/variant-design-skill/issues/24) | 基于 000；测试权益可先验证，正式分发接 005 | 待实现 |
| 4 | [首次项目交付引导](007-first-project-delivery.md) | [#25](https://github.com/YuqingNicole/variant-design-skill/issues/25) | 基于 006、001、002、003 | 待实现 |
| 5 | [更新、回退与支持](008-updates-support.md) | [#26](https://github.com/YuqingNicole/variant-design-skill/issues/26) | 基于 005、006；正式销售前完成 | 待实现 |

### 推进阶段

1. **定交付**：以 PRD-000 建立商品与公开版差异清单；为每项 Pro 承诺准备实际资产和演示。
2. **证明安装与内核**：先验证 PRD-006 的真实安装可行性，并按 001 → 002 → 003 修正真实项目流程。支付测试路径可并行准备，禁止先收费后验证分发。
3. **串联测试购买**：用 005 的测试订单连接 006 安装、007 首次交付和 008 更新支持。
4. **封闭验收**：未参与开发的试用者完成 HTML/Vite 两条旅程，修复求助点。
5. **开放销售门槛**：付费增量、商业条款、安装渠道、升级/支持和交付验收全部有证据，再单独执行真实开售。004 在线工作台可后置，不作为购买后的必经入口。

### 开售前待定决策

- [ ] Pro 相对公开版的资产/适配/更新支持增量已存在且可展示。
- [ ] 价格、币种、更新期限长度与支持范围已决定。
- [ ] 收款主体、支付与身份供应商、退款/争议及旧版本保留政策已决定。
- [ ] 实际平台安装与商业分发路径已验证；未假设平台支持付费目录或激活码。
- [ ] 不包含模型调用额度等前提已在付款前展示。
- [ ] 上述五项 PRD 的发布必需验收完成；未通过时保持测试/封闭试用状态。

## 内核执行顺序

| 顺序 | 优先级 | PRD | 跟踪 | 状态 | 前置依赖 |
|---|---|---|---|---|---|
| 1 | P0 | [PRD-001 · 候选稿基准与修改冲突保护](001-revision-conflicts.md) | [#17](https://github.com/YuqingNicole/variant-design-skill/issues/17) | 待实现 | 无；首个内核实现项 |
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

## 内核执行入口

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

本轮仅补需求与跟踪，不实施真实收费、提交市场审核或公开发布。内核工作不包含微服务拆分、自动部署、官网视觉改版或所有框架支持；购买权益的最小持久化需求由 PRD-005 单独评估。
