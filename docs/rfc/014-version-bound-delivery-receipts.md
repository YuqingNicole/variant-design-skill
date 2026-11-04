# RFC-014：绑定版本、接入清单与验证结果的交付凭证

执行范围：#19 的完整交付清单/凭证与 #18 V4/V5，承接 RFC-011～013。当前只有接入备份和实验专用 native-delivery.json，用户没有一个可复查的交付入口。该工作不替代自动检查计划、人工验收或商业发行。

## 目标与现状

`variant-integrate.mjs` 已在写入前持久化包含原始字节、源稿/共享依赖基准和目标动作的备份；rollback 后只更新 rolledBackAt。`artifact-verification.mjs` 已把观察绑定到版本、当前源码/依赖和检查实现。`preview-files.mjs` 已记录适配文件归属。新模块复用这些真源，不能让 Agent 手写的“成功”字段成为验收依据。

新增 `scripts/delivery-receipt.mjs`：在实际接入仍存在时封存只含身份与引用的本地交付凭证，并提供只读 status。凭证包含源稿/版本/约束、完整计划与 staging 文件集合、创建/覆盖/未变动作和前后 SHA-256、接入备份、检查报告、预览归属及恢复 argv。原始源码/备份字节和报告留在原路径，不再复制进凭证；不上传、不执行任何配置中的命令、不启动服务。

## 接口与边界

`createDeliveryReceipt(output, integrationId, {projectRoot, plan, staging, beforeReport?, afterReport?, previewReceipts?})` 和 `inspectDeliveryReceipt(output, receiptFile)`；CLI 为 `record <output> <integration-id> <config.json>`、`status <output> <receipt-file>`。计划/staging 均须位于项目 `.variant-work/`，报告须来自本输出 `.verification/`，凭证只写入本输出 `.deliveries/<uuid>.json`，独占写、flush、读回确认。沿用 history lock；status 只读。

封存前检查真实备份的项目/方向/版本、原始内容摘要、唯一目标集/动作、计划源稿与目标基准、staging 精确集合及摘要、当前目标等于接入后摘要、当前方向源码/元数据等于备份；旧共享依赖除明确的接入目标外不得变化。新的当前闭包仍由真实验证模块采集。仅有手写日志或错误方向/缺少目标覆盖的报告不得升级状态。

可缺少检查报告：凭证仍可交付候选，但 verificationStatus 必须 unverified，并记录缺口。afterReport 必须当前有效、绑定同一方向/版本/项目、明确指纹覆盖全部接入目标，才保留其实际检查状态；失败不转通过。beforeReport 的目标与源稿须等于接入前基准；缺少时不能宣称已区分原有错误。独立呈现 inventoryStatus、verificationStatus、baseline 和 preview 状态，不能把清单完整写成“已验收”。

status 重读所有清单、依赖、检查实现、报告、备份及预览归属。修改、删除、附加 staging、版本变化或检查器变化使凭证失效；选择变化本身不使凭证失效。合法 rollback 的 rolledBackAt 是生命周期事件，保留原凭证并输出 rolled-back/历史结果，不能把恢复后的页面继续当作当前已接入。回滚后的用户修改仍由原 helper 拒绝；凭证不提供 force 或新接入入口。预览清理不会删除凭证；归属文件变化或消失须反映在 status。

凭证为同一用户机器上的内容绑定记录，未经签名，不证明观察者身份或主机可信。借鉴 [in-toto Statement](https://github.com/in-toto/attestation/blob/main/spec/v1/statement.md) 用内容摘要明确声明对象，以及 [SLSA 验证](https://slsa.dev/spec/v1.2/verifying-artifacts) 区分摘要匹配和可信来源；不声称实现这些标准或达到其等级。

## 验证门槛与执行顺序

1. 真实 helper 回归：create/overwrite/unchanged 清单、真实备份与基准、独占封存/只读 status；不改变原项目/上下文/选择。
2. 负向用例：错误方向/版本/计划/目标集、损坏备份、staging 额外文件、前后目标或依赖变化、过期/缺覆盖/错误方向报告、缺失工具、失败检查、符号链接/越界/特殊文件；失败不得写半成品凭证。
3. 真正的回滚及后续修改：原凭证保留，status 正确区分 rolled-back、drift 与当前观察；不静默重写或重签。
4. 同步包、CI、共享技能工作流、生成/设计系统路线和中英文用户文档；运行安装包、相关 Node/Chrome 和网站检查。
5. 在真实安装技能的 CLI 项目中封存接入后的凭证，宿主独立审查清单、执行检查并验证回滚/清理后状态。固定 fixture 的回归不冒充此项。记录失败和新运行，不重写旧记录。

本地可逆实现/实测属于已授权 backlog；生产合并、部署、付费与账号配置仍需此前所列维护者决定。完整 #18/#19 及其它 backlog 保持开放。
