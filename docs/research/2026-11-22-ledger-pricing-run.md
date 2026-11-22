# 一次真实运行：Ledger 定价页的 A/B/C 与选定（2026-11-22）

为按 ChatCut 拆解文的格式写第一篇“真实运行”文章（`/docs/pricing-page-three-directions-claude-code`）而做的运行。文章里的每个数字和判断都出自这份记录；运行输出（transcript、项目文件）按 `evals/README.md` 的规定没有提交。

## 运行

- 命令：`PLAYWRIGHT_CHANNEL=chrome node evals/run.mjs --agent claude --fixture ledger-pick --out /tmp/vds-run-ledger`
- 技能版本：仓库 `f7e5ae5`（master，2026-11-22），项目级安装（`.claude/skills/variant-design`）
- Agent：Claude Code 2.1.330，模型 `claude-opus-5-5`，`claude -p --setting-sources project,local`（全局 `~/.claude/skills` 里没有 variant-design，全局 CLAUDE.md 不含设计指令）
- 项目：`evals/fixtures/ledger/project`，Next.js 15 App Router 定价页，三档方案（Solo / Studio / Firm），年付 / 月付切换（默认年付、优惠 20%），USD / EUR / GBP，3 条常见问题。品牌锁定在 `app/globals.css`：Source Sans 3 / Source Serif 4，ink `#1d2a24`、paper `#f6f4ee`、accent `#2f6f4f`、muted `#6b746e`，圆角 6px。

两轮，每轮一个新进程，中间只靠项目里的文件衔接：

| 轮次 | 指令 | 花费 | 回合 | 用时 |
|---|---|---:|---:|---:|
| generate | `ledger` fixture 的首轮指令（见下） | $1.96 | 42 | 402 s |
| pick | `pick B` | $1.60 | 34 | 332 s |
| 合计 | | $3.56 | 76 | 739 s（含评分） |

首轮指令原文（`evals/fixtures/ledger-pick/fixture.json`，另附无人值守说明）：

> 使用完整 Variant Design 技能。在当前项目中先检查页面结构和设计系统，再生成保留核心任务的 A/B/C 三个设计方向。已有品牌保持字体与 tokens；没有品牌约束时探索三种鲜明风格。打开三版预览，说明优化、取舍与适用场景，并给出有理由的推荐，但先不要替我选定最终方案。

## 自动检查：20 项通过 19 项

通过：两轮的 `agent-completed`、`delivery-check`、`brand-kept`；`quality-gate`、`generator-habits`、`generated`、`not-selected`；`picked`、`pick-is-not-an-edit`、`ds-drafted`、`ds-waits-for-user`、`ds-contrast`、`ds-decisions`、`ds-use-notes`；`project-untouched`、`skill-under-test`。

没通过：`pick:ds-layers`。选定后起草的 `design-system.css` 里，6 个组件 token 的别名目标不在系统文件里：`--button-height`、`--button-padding-inline`、`--button-primary-fg`、`--button-secondary-border`、`--select-height`、`--select-padding-inline`。

警告：`delivery-check` 无法验证 `--color-text-secondary`（值是 `color-mix(...)`，脚本算不了）和 `--color-muted`（没有声明所在表面）的对比度；pick 之后提醒 `selectedVariant` 是 B（这是用户明确选定的，符合预期）。

技能文本读取：14 个文件、25,904 词。

## 首轮产出

Agent 先读了页面、`components/plans.ts`（结账页和账单设置也在用）、`components/currency.tsx`（全站共用的货币上下文），写下任务契约：主要任务是“小型工作室负责人在试用前比较三个方案，选定后进入 30 天试用注册”；成功标准是“访客能说出所选方案每次实际扣多少、何时开始扣”。设计声明的取舍是 `clarity > persuasion`，不可让步项是“不隐藏年付总额、不改动价格与链接、不新增项目里没有的承诺”。

三版共用 `variant-output/shared/pricing.tsx` 读同一份数据，品牌字体、四个颜色和 6px 圆角都没变，只改结构、层级和信息密度；另写了一份间距和字号扩展 `shared/ledger-extensions.css`，颜色都由品牌色混合得出。三版都在原页面基础上补了“每年实际扣多少”和“第 30 天要卡、之前不扣钱”。

| 方向 | 优化 | 放弃 | 适合 |
|---|---|---|---|
| A 按团队人数推荐 | 先问“工作室有几个人”，在高亮区显示匹配方案的价格、实际扣款和全部功能，其余方案压成一行 | 多一步选择；三个方案的功能不能并排比 | 首次访问、只知道团队人数、想尽快开始试用的人 |
| B 功能对比表 | 把“Everything in Solo”展开成真实功能行，标出每个方案新增的功能，可一键只看差异 | 信息密度最高、引导最少；手机上三列很紧 | 已在认真评估、要逐项核对的人 |
| C 先讲清金额和试用 | 每个方案显示年度总额与节省额；右侧时间线写明今天、第 30 天、试用后、随时、离开时各发生什么，CTA 在时间线下方 | 功能默认折叠；页面更长，扫读比 A 慢 | 对订阅扣款敏感、担心被锁定的人 |

推荐 C，理由是项目注释写明访客是“试用前比较方案的工作室负责人”，三条常见问题里两条问扣费和退出。Agent 同时写明“这是假设，没有转化或可用性数据支持”，并给出何时选 B、何时选 A。`selectedVariant` 保持为空。

Agent 自己做的检查：原项目和三版纳入的临时配置 `tsc --noEmit` 通过；`quality-gate --strict` 0 错误 0 警告；用无界面 Chrome 截了 1280px 和 390px，按截图修了三处（C 的单选框压到文字、C 的提示语以“No.”开头、A 的功能描述首字母没大写）。它写明没在浏览器里实际操作点击、键盘和焦点（项目里没装 Playwright），没测减弱动画、没做跨浏览器测试。

它发现的现有页面问题（没改，留给用户确认）：

1. 价格格式化去掉了小数，年付时 Solo 显示 `$10 / month`，年度总额却是 `$115`（12 × $9.6），不等于 $120。`plans.ts` 结账页也在用，所以没动。
2. EUR / GBP 按固定汇率从美元换算，是按所选货币收费还是参考价，项目里没写，它也没替项目写“仅供参考”。
3. 品牌字体项目从来没有加载（`app/layout.tsx` 没引入），所以截图里是备用字体。

## 第二轮：pick B

`select` 只设了 `selectedVariant`，B 的文件和版本没变（`pick-is-not-an-edit` 通过）。随后从 B 起草了设计系统：`design-system.css`、`design-system-preview.html`、`DESIGN.md`，等待用户 `ds confirm`（`ds-waits-for-user` 通过）。系统写下 5 条决定：方案放表格比较、不加“最受欢迎”徽标；“实际怎么扣款”作为价格下第一行；强调色只表示“包含”和“在这里操作”；衬线体只用于标题和方案名；层级靠分隔线粗细，不加阴影。相对 B 的规范化：12px 的“New in”标签改为 14px，✓ 的字重 700 改为 600。

它在 B 里发现、没有改、留给用户决定的问题：

1. 币种选择器边框和计费开关关闭时的轨道颜色对比度只有 1.84:1，控件至少要 3:1。
2. Solo 列自己的功能格子也被染了“新增”底色，但没有标签（截图里看得到）。
3. 表头设了 `position: sticky`，但在可横向滚动的容器里，实际固定不住。

## 我们另外做的

- 截图：Playwright（本机 Chrome）打开 `variant-output/_static/_preview/A|B|C.html` 截 1280px 整页，B 另截 390px；原页面用 `next dev` 打开 `/pricing` 截 1280px（裁掉开发模式标记）；设计系统预览截首屏。图片放在 `website/public/docs/ledger-pricing-run/`，都是这次运行生成的页面，不含别人的网站。
- 截图里的字体是备用字体（见上面第 3 条），不是品牌字体。
- 没有做的：没有真实用户或转化数据，推荐只是 agent 的推断；没有人工操作过三版的键盘和读屏；只跑了一次，没有比较多次运行的差异。
