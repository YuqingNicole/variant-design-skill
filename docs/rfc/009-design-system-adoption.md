# RFC-009 · 确认设计系统与应用到已有方向的边界

- 状态：实施方案，待完整回归与评审；不代表已上线。
- 日期：2026-11-04。
- 关联：RFC-006 §4.1、RFC-007 P1；PR #150；真实 `harbor-chain` 的 `confirm/apply/undo/component` 失败。

## 1. 已复现的问题

`74aa122` 的真实 Codex 六轮运行中，生成、选定、草拟、对比度、分层、应用隔离、撤回字节恢复、新组件等检查通过；但确认后的四轮均因 B 原先的字体记录与新系统不一致，未通过交付检查。原记录是 system-ui / sans-serif / Georgia；确认的系统是 Georgia / Source Sans 3 / system-ui。轨迹保存在 `/Users/nicole/orca/variant-backlog-evidence/ds-evals`。

这是流程矛盾：设计系统流程允许在选定后提出字体改进，且确认不编辑 B；交付检查却立即要求 B 使用新字体。随后普通 apply 在系统锁定时拒绝 token 元数据变化，Agent 只能改代码而留下旧记录；undo 又必须恢复旧代码和旧记录。不能通过删除失败检查、直接改上下文补数或把确认变成一次隐式页面修改来掩盖。

## 2. 目标与不变项

- `ds confirm` 确认新系统，保留 A/B/C 的文件、token、版本、撤回栈和最终选择。
- `apply ds B` 是明确的系统对齐操作：准备候选基准、验证系统身份、在快照后同时写入 B 的代码和 token 记录；只设 activeVariant，不替用户选择。
- `undo B` 同时恢复应用前的文件、token 和系统应用状态，仍保留选定结果。
- 普通 variation 不能借此任意修改已锁定 token；品牌文件的原始字体、颜色和命名仍受原锁约束。
- 所有原有路径、区域、过期候选、持久快照、合作锁、用户后续编辑保护继续成立；不增加 force。
- 上下文仍是 v2。新增可选字段有明确语义；没有该字段的旧上下文保留原有严格检查，不自动解释成“尚未应用”。

## 3. 状态与操作

继续使用 `variant-history.mjs` 的同一把锁和事务/快照，不新建一套页面历史。

### 确认

新增 `confirm-system <root> <metadata.json>`，元数据描述已由用户确认的 `designSystem`（主文件、扩展、字体，及已选定的 source）。读取并校验所有系统文件，不允许把品牌锁换成生成文件；系统文件集合与内容参与身份计算。写上下文前保存并核验原上下文备份。

对于从选定方向派生的生成系统，给该方向记录 `systemBinding: {status:'pending', digest:<system-identity>}`；这只是待应用的事实，不修改该方向的 token、版本或文件。确认本身不添加一次页面 undo。品牌文件仍立即约束字体和颜色；扩展不允许重定义品牌变量。

### 应用

新增 `apply-system <root> <A|B|C> <candidate> <change.json>`，复用普通 apply 的全部基准、区域和快照检查。它只对当前已确认系统执行对齐，不接收任意新 token：所提交的字体集合必须与确认系统一致，颜色值或变量引用必须能在当前系统中找到。普通 `apply` 的 token 锁不变。

`apply-system` 在同一事务里写代码、对齐后的 token 记录和 `systemBinding: {status:'applied',digest:...}`。系统主文件或任何扩展在 prepare 后改变，拒绝写入。快照保存应用前后 binding；一条用户请求仍只撤回一次。

### 撤回与检查

undo 从同一快照恢复 binding，包括“原先没有字段”的状态；不直接根据版本号猜测系统已应用。

交付检查仅对当前生成系统、由确认 helper 明确记下的 pending 来源方向，把新系统尚未应用的字体/颜色差异报告为待应用警告，并保留静态/运行时未验证事实。这不是字体符合新系统的通过结论。应用后恢复严格检查；binding 与系统身份不一致时报告过期，不默默沿用。品牌文件以及没有 binding 的旧上下文保留严格检查。A/C 的原有探索豁免继续按 source 规则处理。

## 4. 验收矩阵

| 场景 | 预期 |
|---|---|
| B 使用旧字体，确认包含新字体的生成系统 | B 文件/token/版本/undo/selection 不变，明确 pending；无伪造字体通过 |
| 普通 apply 请求换 token | 仍拒绝，无写入 |
| apply-system 使用未确认系统、错误字体或系统外颜色 | 拒绝，无写入 |
| prepare 后修改主系统或任一扩展 | 拒绝，无写入，候选保留 |
| apply-system 正常对齐 B | 文件/token/binding 同一快照，版本递增；A/C 与 selection 不变 |
| undo B | 恢复全部原始字节、token 和 pending/缺省 binding；selectedVariant 保留 |
| 用户在应用后编辑 B | undo 拒绝覆盖 |
| 一次 request 分两次 apply-system | 一次 undo 全部恢复 |
| 品牌锁定项目新增扩展 | 不放宽品牌字体/颜色，不重定义品牌；扩展遵守分层 |
| v2 旧上下文没有 binding | 继续严格检查；不静默迁移 |

先用真实 helper 编写以上回归，再重跑完整 Codex harbor-chain 与品牌锁定 ledger。Claude 在当前账号 403 解除后补跑；自动化不替代截图与维护者审阅。只记录实际执行的结果。

## 5. 边界

pending 不代表完成交付，也不是绕过锁的通用入口。确认 helper 只记录用户已明确作出的确认；Agent 不能自动替用户确认。设计系统的审美、运行时字体下载和所有 CSS 别名的语义正确性仍需实际页面验证。外部编辑器竞态与多文件进程崩溃仍遵守现有恢复边界，不声称全局原子性。
