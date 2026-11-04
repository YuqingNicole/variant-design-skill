# 2026-11-03 · 选定后提炼设计系统：试跑

改动：`pick B` 之后，从 B 提炼完整的设计系统，生成预览后停下，等用户 `ds confirm`（`skills/variant-design-system/ROUTE.md` Step 1b）。品牌已锁定的项目只补品牌没规定的部分，用 `var(--…)` 引用品牌变量，确认后记入 `designSystem.extensions`。定位依据见 RFC-006 §1、§4。

## 方法

取本日 Codex 评测已生成 A/B/C 的项目（harbor：没有品牌约束；ledger：`app/globals.css` 品牌锁定），换装当前分支的技能，再用同样的隔离参数执行 `codex exec`，提示词为 `pick B（这是无人值守运行：用 react-preview.mjs --static 生成可直接打开的预览，不要启动常驻服务器；需要我确认的地方停下来汇报。）`。Codex CLI 0.166.0-alpha.5.1。两个项目原来都推荐 A，所以 `pick B` 也检验“用户的选择优先于推荐”。

## 结果

| 项目 | `selectedVariant` | `designSystem` | 产物 | 停在确认点 |
|---|---|---|---|---|
| harbor | B | 未改（仍为空） | `design-system.css`（142 行）、`design-system-preview.html` | 是，回复 `ds confirm` 或 `ds edit` |
| ledger（第一次） | B | 未改（仍指向 `app/globals.css`） | `design-system.css`（37 行，扩展）、`design-system-preview.html` | 是 |

- harbor：文件开头列出了归整清单，例如 9/10/11px 的辅助文字统一为 12px，零散间距统一到 4px 步长，34/38px 头像统一为 40px。正文色 `#76604c` 在浅色底上对比度只有 4.47:1，改成 `#745e4a`。B 原来没有阴影和动效，系统补上了，并注明是新增的。
- ledger 第一次：没有重新定义任何品牌变量（逐个检查了 `app/globals.css` 里的变量名）。但扩展部分只是盘点：B 用到的每个值都成了 token（例如 13 个间距 token，其中有 `--space-select:14px`），文件里写着“Normalizations: none”。于是在 Step 1b 的品牌锁定段补了一句：这些层要成体系，不是清单，要像第 2 步一样归整到刻度上，并列出归整了哪些值。

## 重跑 ledger（规则收紧后）

第一次重跑没给 stdin，`codex exec` 一直在等输入，跑了 15 分钟以上；这次的结果作废。加上 `< /dev/null` 后重跑：

- `selectedVariant` 为 B，`designSystem` 仍指向 `app/globals.css`，停在确认点，没有替用户确认。
- 扩展文件 52 行，开头列出归整清单，例如 `9/10/11px gaps → 12px`、`15/17/18px spacing → 16px`、`22/25/26/28/30px spacing → 24/32px`，字号也归整到刻度上。间距 token 从 13 个减到 11 个，而且落在 4px 步长上。
- 没有重新定义任何品牌变量（逐个检查）。
- 不足：品牌里没有红色，所以错误和警告色都映射到正文色 `--color-ink`，只靠文字和图标区分（文件里写明了“never color alone”）。这是品牌本身的限制，技能没有擅自加颜色；要不要补语义色，应该由用户决定。下一步可以在报告里明确提出这个问题。
- ledger 是 Next 项目，`react-preview.mjs --static` 因缺少 Vite、npm 访问网络失败而没成功，agent 改用 Next 静态导出生成了预览。

## token 一致性检查（同日补充）

`delivery-check` 新增两项：品牌锁定时读取 `designSystem.extensions`（扩展重定义品牌变量算错误）；系统确认后，间距、字号、圆角不在刻度上的值（CSS 和 JSX 样式对象都查，`clamp()`、`calc()`、`var()` 跳过）记为警告，并给出最接近的 token。

在真实产出上试：用 Codex 重新生成 harbor（6/6 通过，推荐 A，28.3 万 token，219 s），再 `pick B`，然后在副本里手动把系统标成已确认（`source: "B"`）后运行检查：

- 第一版把 A、C 也拿来对照 B 的系统：A 有 7 个颜色和 19 个长度不在系统里，C 有 8 个颜色，全是噪音，因为 A、C 是系统出现之前的探索。改为：系统记录了 `source` 时只检查那个方向。
- 改后只剩一条有用的警告：B 有 19 个长度不在刻度上（例如 `13px (nearest --text-xs 12px)`），提示 `apply ds B` 会换成 token。B 的颜色没有警告，因为系统保留了 B 的原色。
- 网站自己的 `website/variant-output/`（已确认的 `src/design-system.css`，18 个刻度 token）新旧检查都是 0 条警告：那三个方向用的是网站的 class，没有内联长度。
- 这次 `pick B` 写入了 `designSystem: {confirmed: false}`，而 Step 1b 要求不改 `designSystem`。不会造成锁定（检查只认 `confirmed: true`），但和说明不符；Step 1b 补了“不要写草稿条目”。

## DTCG 导出（同日补充）

`scripts/ds-export.mjs` 把设计系统的 CSS 变量导出为 DTCG 2025.10 JSON。格式按官方 2025.10 报告核对：颜色是 `{colorSpace, components, alpha?, hex?}`（sRGB 分量 0–1，OKLCH 的 L 为 0–1、H 为 0–360），尺寸是 `{value, unit}` 且只允许 px、rem，时长是 ms、s，阴影可以带 `inset`，引用写成 `{group.token}`，文件扩展名用 `.tokens.json`。

真实输入：

| 来源 | 导出 | 未导出 |
|---|---|---|
| Codex 为 harbor 从 B 提炼的系统 | 114 个：颜色 44、尺寸 38、数字 12、阴影 5、时长 5、字重 4、字体 3、缓动 3 | 7 个：1 个 `clamp()` 字号、4 个 `em` 字距、`--shadow-none: none`、1 个 transition 简写 |
| 网站自己的 `website/src/design-system.css` | 38 个，`font-display` 正确导出为对 `font-serif` 的引用 | 7 个：3 个 `clamp()`、2 个 `em` 字距、2 个 border 简写 |

逐组看过，没有分错类型的 token。没有把导出文件导入 Figma 验证；Figma 只支持 DTCG 的部分类型（研究记录 `2026-11-03-design-product-architectures.md`），这一步还要人在 Figma 里试。

## 对比度检查（同日补充）

`scripts/ds-check.mjs` 按 token 名字配对（`text`/`ink`/`fg` 对 `bg`/`surface`/`paper`/`canvas`，`on-X` 对 `X`），按 WCAG 2 相对亮度算对比度，低于 4.5:1 报出；半透明颜色跳过，OKLCH 经 OKLab 换算。测试里的两个期望值先是估算的，跑出来不一致后手算核对（`#777` 对 `#f2f2f2` 为 4.0:1，白色对 `#e85d04` 为 3.50:1），确认代码正确、改了测试。

真实输入：Codex 为 harbor 提炼的系统找到 11 组，最低是 `--color-text-muted` 在 `--color-surface-2` 上 4.62:1，全部通过；网站自己的系统找到 3 组，全部通过。局限：只认名字里带这些词的 token，网站的 `--color-muted` 不在检查范围内，所以 Step 1b 要求按这种方式命名。

已确认系统的不合格组合在 `delivery-check` 里是警告不是错误：用户确认过的系统按规则优先级（用户约束高于无障碍建议）不阻断，但必须报出来。

## 完整链路：生成 → pick B → ds confirm → apply ds B（同日补充）

加了 `DESIGN.md` 规则后，用 Codex 跑完整条链路。四轮都是新的 `codex exec` 进程（`--ephemeral`），没有对话记忆，只能靠项目里的文件接上，这正是技能承诺的用法。

| 轮次 | 状态 | 产物与检查 |
|---|---|---|
| 生成（`evals/run.mjs`） | 6/6 通过，推荐 A；59.2 万 token，198 s | 生成时 B 有一次修改（v2，“Fix TypeScript literal comparisons before delivery”），发生在 pick 之前 |
| `pick B` | `selectedVariant: B`，`designSystem` 未改（为空），B 没有被修改 | `design-system.css`、`design-system-preview.html`、`DESIGN.md` |
| `ds confirm` | `designSystem.confirmed: true`，`source: "B"`，记录了色板和字体 | 新增 `design-system.tokens.json` 和 `design-contract.md`（harbor 涉及权限，属于产品关键工作）；`ds-check.mjs` 通过；`delivery-check` 报 B 有长度不在刻度上，并提示 `apply ds B` |
| `apply ds B` | B 升到 v3，`request: apply-ds-B-20261103`，`activeVariant: B`，选定不变 | `delivery-check` 的长度警告消失，只剩 `selectedVariant` 的提示（用户选过，属正常） |

- `DESIGN.md` 按要求的顺序写了 8 节（Overview、Colors、Typography、Layout、Elevation & Depth、Shapes、Components、Do's and Don'ts），用 token 名而不是原始值，例如“说明文字使用 `--color-text-secondary`，搭配 `--color-bg` 或 `--color-surface`；强调面上只用 `--color-text-on-accent`”“页面标题用 `--text-4xl`，区块标题用 `--text-xl`”。语言跟随用户的中文提示。
- 撤销：在副本上直接运行 `variant-history.mjs undo variant-output B`，B 的文件和 `apply ds B` 之前完全一致（与该轮之前的 git 提交比较无差异），选定仍是 B，长度警告重新出现。`apply ds B` 是一次请求、一次撤销。

## 未覆盖

- 只用了 Codex，Claude Code 和 dsh 没跑这一步。
- 确认后再生成新页面时是否只用系统 token、是否读 `DESIGN.md`，还没测。
- 完整链路只用 Codex 跑了 harbor 一次。
- 设计系统的好坏要人看预览；这里只检查了流程承诺、对比度修正和品牌变量没被覆盖。

## 多轮测试场景与"AI 味"（同日补充）

### 多轮测试场景 `harbor-chain`

`evals/run.mjs` 支持多轮测试场景：每轮开一个新进程，每轮之后记一次快照（上下文、`variant-output/` 每个文件的哈希、delivery-check 结果、各方向偏离已确认系统的值的个数），每轮的检查都对照之前的快照。`harbor-chain` 共六轮：generate → `pick B` → `ds confirm` → `apply ds B` → `undo B` → 在已确认系统上做邀请成员弹窗。Codex CLI 0.166.0-alpha.5.1，以下数字都只来自一次运行。

| 运行 | 结果 | 说明 |
|---|---|---|
| 第一次（675 s，约 293 万 token） | 前五轮全部通过；`component` 三项失败 | 提示词写了"放进这个成员页用"，Codex 把弹窗作为 B 的一次修改（经 `apply` 升到 v5，可撤销），没有单独建组件文件。这是提示词有歧义，不是技能出错；B 偏离系统的值仍是 7 个，没有增加。随后改成"单独做……先做成独立组件，不要改 A/B/C"。 |
| 第二次（671 s，约 252 万 token） | 28 项中 27 项通过 | 唯一失败是 `component-on-system` 把技能脚本生成的 `_compare.html` 里的界面颜色也算了进去；组件本身的 TSX、CSS、HTML 没有任何设计系统以外的颜色或长度。评分器已排除 `_compare.html` 和 `_preview/`。这次运行没有存每轮快照，所以没有重新评分。 |

`apply` 一轮把 B 偏离系统的值从 7 降到 0，`undo` 一轮让 B 的文件和 `apply` 之前完全一致。

### 问题：生成的设计系统 AI 味重

维护者看过第一次运行的产出后，认为"AI 味儿太重"。看截图后归纳出三个原因，都出在技能自己的说明里：

1. **系统是在填模板。** Step 1 给出一套 Tailwind/Material 式的 token 模板（50–900 色阶、z-index 阶梯、Material 缓动、sm/md/lg 阴影），Step 1b 又要求写出 Step 1 的"每一节"。结果是 108 个 token，其中 27 个是色块，9 级字号；预览页是色板网格、"2xl — Harbor 团队协作"字号阶梯和间距条，也就是生成式设计系统的典型样子。
2. **把 B 的 AI 套路原样固化。** B 有大写眉标、设置页上的口号式标题、装饰用的 "04"、米色加鼠尾草绿、每块都套卡片、全部用 `system-ui`，系统把这些直接写成了 token（`--tracking-label: 0.12em`、`--weight-display: 450`）。
3. **没有立场。** 只有数值，没有"这个权限页要突出什么、排除什么"的决策。

改动：新增 `references/design-system/system-decisions.md`，规定四件事：先决策、审查来源、按产品的实际用量确定规模、在使用场景中展示系统。`ds-check.mjs --used-by` 列出预览页从未用到的 token。Step 1 的模板改为只示范层级和命名，不要求填满；Step 1b 加了"决策和审查"一步。

### 复测（Codex，generate → pick）

12 项检查全部通过（345 s，约 97 万 token）。

| | 改之前 | 改之后 |
|---|---|---|
| token 个数 | 108 | 34 |
| 命名 | `--p-brand-50…900`、`--text-2xs…4xl` | `--text-page-title`、`--radius-control`、`--shadow-dialog` |
| 文件开头 | 只有归整清单 | 4 条决策，加上归整清单和 `Dropped:` 清单（眉标、口号式标题、装饰数字、非常规字重） |
| 预览页 | 色板网格、字号阶梯、间距条 | 邀请表单、正在改角色的成员行、移除权限确认框、错误和空状态，每段附一句说明体现了哪条决策 |
| 未使用的 token | 34 个（旧版预览把色阶都摆成了色块） | 0 个 |

仍未解决：

- **B 方向本身的 AI 味没有变。** 口号式标题、"04"、大写眉标、米色加陶土色都还在。这是生成三个方向时的问题，设计系统这一步只能事后丢弃。
- **保留色板和 Georgia 的理由太弱。** 写的是"selected editorial identity"，没有说明它对这个任务有什么用；表单控件也都用 Georgia。说明里已补充："用户选中"只覆盖方向的主张，不覆盖其中每个习惯。
- **token 参考表的"用途"一列是凑的。** 每行都是 "Shared color foundation"。说明里已规定写产品中的具体位置。
- **状态仍是一排孤立的按钮。** 说明里已规定在出现的场景中展示。
- **没有组件层和模式层。** 状态只在预览里演示，没有组件 token。这部分由 RFC-007 讨论。
- 这次只用 Codex 跑了一次，没有跑 Claude Code 或 dsh；补充的这几条说明也还没有复测。

### 分层之后（RFC-007 P0）：Codex 和 Claude Code 各跑一次 generate → pick

按 RFC-007 改写 `system-decisions.md` §4 和 Step 1 的示例：语义层、组件层（只引用语义层）、基础值只在被共用时写，每个语义 token 写 `/* use: … */`，模式写进 `DESIGN.md`。评分器的 `pick` 一轮新增 `ds-decisions` 和 `ds-use-notes` 两项检查，`component` 一轮新增"组件不直接引用 `--p-*`"。

| | Codex（398 s） | Claude Code 2.1.311（957 s，$4.56，92 轮） |
|---|---|---|
| 检查 | 14/14 | 14/14 |
| token | 41 个，其中组件层 6 个（按钮、输入框） | 82 个，其中组件层覆盖按钮（主要、次要、柔和、危险、轻量危险）、输入框、角色选项 |
| 决策 | 4 条 | 5 条，每条写明排除什么 |
| 字体 | 提议把 `system-ui` 换成 Trebuchet MS，理由是"不需要下载远程字体" | 标题用 Outfit，正文用 Figtree |
| 颜色 | 保留陶土色强调色，理由是"延续 B" | 把陶土色强调色换成蓝色，理由是它和危险红色调太近，"颜色表示风险，不表示气氛"；预览顶部注明这一改动需要用户在 `ds confirm` 时决定 |
| 预览 | 邀请加成员列表、移除确认、错误与空状态各一组，附 token 表（"Used for"一列写的是具体位置）；状态仍是一排孤立按钮；每块都套着卡片；"No matching members"一张卡里塞了四种状态 | 按用户时刻组织：改 Ama 的权限（角色选项写明后果，保存前提示）、移除 Ravi 再撤销（toast 是唯一带阴影的元素）、邀请出错、空状态和加载失败分开；组件状态都有标注 |
| `DESIGN.md` 模式 | 4 个 | 有 Patterns 小节 |

评分器修了两处误报：一是 agent 在报告里用 `file://` 链接指向被测副本，被当成了另一份副本；二是 Claude 的系统文件以 `@import` 开头，决策注释在它之后。修正后两次运行都是 14/14。

结论：
- 分层和"先决策"在两个 agent 上都落实了。Claude 的产出已经看不到明显的 AI 套路，整体偏通用 SaaS 风格。
- Codex 暴露了三个说明漏洞，已补进 `system-decisions.md`：
  - 不能为了避免下载而换成另一个过时的系统字体；
  - "延续 B"不算理由；
  - 预览要遵守它自己的决策，并且一组只展示一个场景。
- 以上都是单次运行。审美判断由维护者看截图决定。

### 补过说明后再跑 Codex（generate → pick，427 s，约 119 万 token）

- **上次的三个漏洞都改了：**
  - 字体保留 Georgia，理由换成和任务相关的（"权限说明需要编辑式的阅读节奏"），没有再换成过时的系统字体；
  - 预览不再处处套卡片：成员是带分隔线的行，权限说明放在侧栏，这正是它的决策 1；
  - 每段只展示一个场景：改角色、移除确认、邀请和空状态，控件状态收在折叠区里。
- **40 个 token，组件层 6 个。** `DESIGN.md` 把 Patterns 写成了单独一节，没有放在 Components 下面，和规定的 8 节顺序不一致。
- **两项检查失败：**
  - `ds-decisions` 是误报：决策写成了编号列表，但没有写"Decisions"这个词。评分器改为接受至少两条编号。
  - `pick-is-not-an-edit` 是真问题：Codex 在 pick 这一轮发现 B 的邮箱校验有 bug，就经 `apply` 把 B 升到 v2 修好了（request `pick-B-…`，可以撤销），报告里写了"另已修复 B 的邮箱校验错误"。修的是真 bug，过程也透明，但用户只说了 `pick B`。Step 1b 已补充："`pick` 只选择、不修改；发现 B 的缺陷就在报告里列出，并给出修复用的命令。"补充后还没有复测。另外，B 的这个 bug 是 generate 那一轮留下的。

## 生成方向的 AI 味（同日补充）

问题：同日几次 Codex 生成的 Harbor A/B/C 用的是同一副骨架：
- 大写眉标"DIRECTION A · The team ledger"；
- 自编口号"Your people. One place." / "Make room for good work." / "Every person. Clear access."；
- 右上角巨大的"04 members"；
- 一张"Grow your team / Good work starts with people."宣传卡片。

三个方向只换了配色（米白、荧光绿、深色），而原页面只有标题"Members"和一句说明。

在技能说明里找到的原因：
- 没有确认设计系统时，要求三个方向是"不同工作室的诠释"，又给了一张风格表，于是差异被做在配色上；
- 每个方向都必须有一个"signature detail"，于是出现了装饰数字和眉标；
- 成员页被归入 dashboard 领域，那份参考写着大号指标数字；
- 没有规定已有页面仍然是那个页面。

改动：
- `quality-baseline.md` 新增"Generator habits"清单，生成和设计系统共用，`system-decisions.md` §2 改为引用它。
- `quality-gate.mjs` 新增 `eyebrow-label`、`decorative-number`、`direction-label-in-ui` 三条规则，级别为 `review`：会列出来，但不影响 `--strict`，因为品牌页可能是有意这样用（我们自己的咖啡示例里就有 6 处眉标和 01–04 步骤编号）。`artifact-verification` 的静态状态不受 `review` 影响。
- 生成说明：
  - 已有页面保持原来的作用、名称和文案，不加口号或宣传卡片；
  - 没有确认的系统时，先让三个方向在结构上不同，再配各自的视觉；
  - 风格表只用于营销、编辑和品牌页；
  - signature detail 必须服务于任务；
  - 管理类页面用 dashboard 参考时，不加 KPI 头部。
- 评分器新增 `generator-habits` 检查。10 月录下的 Pulse 产出也没通过：有眉标，还有 `aria-hidden` 的 01、02 编号。

复测 `harbor`（单轮）：

| | Codex（212 s，约 56 万 token） | Claude Code（516 s，$2.30） |
|---|---|---|
| 检查 | 7/7，`generator-habits` 通过 | 7/7 |
| 标题和文案 | "Members"加项目原文，保留应用侧栏 | "Members"加项目原文，保留顶部导航 |
| 三个方向 | A：邀请表单加表格；B：按角色分组，带角色说明；C：深色的邀请区和待接受邀请，下面是表格。A 和 C 结构接近，C 基本是 A 的深色版 | A：密集表格，邀请内嵌在表头，待接受邀请作为一行；B：按角色分组并列出各角色能做什么，邀请时的角色选项带说明；C：深色界面，邀请在前，右侧是操作记录和撤销 |
| 遗留问题 | 主按钮带"↗"外链箭头，但其实不离开页面 | — |

针对这两个遗留问题，清单补了两条："同一布局的浅色和深色版算同一个方向"，以及"不离开页面的按钮不加 ↗"。补充后还没有复测。以上都是单次运行。
