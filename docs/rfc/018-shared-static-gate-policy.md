# RFC-018：线上与 CLI 的共享静态判定策略

状态：已实现；真实 CLI/线上七组对照及当前技能 Codex 43/43 通过，合并跟踪 #168。关联：Issue #18 V8。

## 实测问题

同一份经过线上清理的 HTML，纯黑背景命中同一个 `pure-black-surface` warning：真实 CLI `--strict --json` 退出 1，线上 `auditGeneratedHtml` 却返回 `passed: true`。规则编号相同不能证明结论一致。合法页面和焦点抑制的正反例也在同一探针中运行，原记录保留于 `variant-backlog-evidence/static-parity-probe/result.json`。

## 决策

- 提取 `summarizeFindings(findings, {strict})`，统一统计 error、warning、review 和门槛结论。CLI 默认仍为 `errors-only`，`--strict` 为 error 或 warning 均阻止通过；review 仍只供设计判断，不阻止严格门槛。
- CLI JSON 显式给出 `policy` 和 `passed`，保持原有计数、findings 和退出码语义。
- 线上 HTML 审计使用相同 strict 策略，返回同一 `staticChecks` 摘要；所有阻止严格门槛的 finding 都进入实际修复诊断。模型构建结果保留该摘要，同时仍将运行行为标为 `unverified`。
- 线上完整文档结构要求是额外检查。共享静态门槛通过不能覆盖缺失 viewport、文档结构等错误，不宣称整体审计与单独 scanner 完全相同。
- 比较边界是清理后的相同输入。原始脚本被线上清理时，不伪称它与 CLI 扫描原始源码等价。实际业务行为仍必须独立浏览器检查。
- warning 被严格门槛阻止，不等于已有 `artifact-verification` 的 warning 观察状态被改为 failed；它仍保持 unverified，检查通过与证据状态分开记录。

## 验证门槛

真实子进程调用 CLI，对比线上返回的同一清理后 HTML；核对规则编号、严重级别、行号、消息、片段、计数、policy、passed 与退出码。覆盖普通 warning、焦点抑制、错误、review-only、清理脚本、合法文档，以及共享门槛通过但线上结构要求失败。先保留真实红灯，再运行现有模型构建修复回归、完整网站/浏览器/安装包检查及实际安装技能 CLI 流程。不得调用托管模型、启用 key 或把静态通过当作浏览器验收。


执行证据：[源版本审计](../research/2026-11-06-static-policy-audit.json)、[实测方法与保留的失败](../research/2026-11-06-static-policy-parity.md)、[完整首期验收映射](../research/2026-11-06-acceptance-map.md)。
