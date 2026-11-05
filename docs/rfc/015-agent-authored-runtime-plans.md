# RFC-015：Agent 自动生成任务检查计划并执行真实观察

执行范围：#18 自动 runtime plans、V4～V7/V9，以及 #19/#25 的真实交付检查。承接 RFC-014；保留完整 backlog 和既有人工决定。当前工作树基于 PR #161 `19e6ccc`，不改变生产或商业配置。

## 问题与目标

`browser-verification.mjs` 的 `verificationPlan(url)` 故意返回空期望；调用者必须手写 selector、回调和断言。已有实际 Codex 交付虽然保留诚实的未验证项，却不能自动组织新产物的检查。目标是让用户的 Agent 根据实际任务、源码、品牌和观察生成可审查计划，使用本地已有浏览器执行，并将计划、基准和当前产物绑定。

语义判断仍由用户 Agent 完成，不增加模型服务/key，不用关键词规则猜产品目标，不以正则把每个 button 变成“已经覆盖”的功能。确定性模块负责结构验证、路径/资源边界、声明式动作解释、内容绑定和检查结果。现有 taskContract/可用任务档案仍是真源，不另造业务 brief。

## 设计

新增 `scripts/verification-plan.mjs`。Agent 在 `.variant-work/` 写计划 draft，`record` 只读其内容并独占封存新 bundle。bundle 记录实际任务/品牌、变体与源稿指纹、目标入口、逐项依据、每项 requiredFunction 的覆盖/未知说明、原始 draft 摘要、工具身份和可选基准报告引用。`status` 重读输入，`runVerificationPlan` 使用调用者已有 Playwright Page 与可信 ready/projectChecks 回调执行。模块不安装浏览器/依赖、启动服务、执行 Agent 命令字符串或导入 Agent JavaScript。

计划继续使用现有 brand/focus/motion/scope 断言结构。新增稳定定位器：role+精确 name、label、testId 和明确 CSS。声明式动作只允许 click/fill/select/press 和有界的断言等待；不接受 evaluate、任意代码、导航或 shell。预览路径必须属于项目，临时 HTTP 基址来自执行者，file URL 必须指向当前登记入口。ready 必须确认当前预览身份；缺少浏览器、ready 或项目检查时相应结果未验证。

`basis` 把每个已计划检查关联实际文件和理由，`coverage` 覆盖当前 taskContract.requiredFunctions 的每项，缺口说明原因。模块只验证引用与结构，不把这些声明当成产品覆盖已获证明。所有缺失计划/回调保留 unverified，不自动生成 not-applicable 或全站合规声明。

## 修改前基准与当前证据

首次计划运行可作为 baseline：实际执行 scope 动作并保存原始期望/观测，但 scope-preservation 状态仍为 unverified，说明只是本轮基准。修改后 Agent 审查并封存新 bundle，引用真实 baseline 报告；task/品牌、scope 动作/断言身份和视口必须匹配，基准中的断言必须实际观测成功。随后执行相同动作/断言，才可标记声明范围内的 preservation passed。源稿变更使旧 bundle stale，不能静默重绑或用修改后的页面重新发明旧期望。

对基准等非源码证据输入，扩展 `artifact-verification.mjs` 的可选 `inputs`：项目内普通文件的独立哈希进入 fingerprint，不把历史报告当成待解析源码闭包。报告保留输入列表；run 前后及 status 都重新读取。旧调用不需额外输入；检查实现变化仍使旧证据过期，不回填。这样改基准或 draft/bundle 同样会使观察失效。

所有产物、计划、基准、动作和视口均在报告内可定位；计划中的“覆盖了”不是已执行证据。可信回调/本机边界和静态依赖覆盖限制延续既有模块，不声称签名身份、全环境新鲜度或通用框架支持。

## 依据、风险与验收

已读现有 verification/task/profile/receipt 模块、生成路线和真实运行记录。官方 Playwright [locators](https://playwright.dev/docs/locators) 与 [best practices](https://playwright.dev/docs/best-practices) 支持按用户可感知角色/名称定位和可重试断言；[ARIA snapshots](https://playwright.dev/docs/aria-snapshots) 可辅助 Agent 读取结构，但快照不是用户期望或正确性的真源。实际兼容以项目锁定 Playwright 1.56.1 API 和测试为准，不依赖最新 AI snapshot API。

门槛：

1. 真实文件/模块回归：计划结构/任务覆盖、稳定定位器、输入/源码/约束/版本/工具漂移、源路径/符号链接/资源拒绝、只读 status、独占封存；不写应用或选择。
2. 真实 Chrome：品牌、键盘、初始/切换 reduced-motion、非修改区动作；无基准不能宣称 preservation。基准/动作/视口不匹配、文件变化和负向渲染都不能通过。保留真实失败，不能修改期望来消除失败。
3. 同步包/CI、共享工作流、生成/设计系统路线和中英文说明。
4. 实际安装技能后由真正 Agent 根据新产物生成 draft，宿主在 HTML 与品牌 Vite 场景执行并审查计划、数据/权限/动效/未修改区行为，保留源/报告/阶段归档；先前手写 fixture 不替代此项。缺工具场景明确未知。
5. 完整 #18/#19、展示质量、更多项目/技术栈与人工试用继续逐项验收；本 RFC 的实现/单项通过不能关闭整个 backlog。
