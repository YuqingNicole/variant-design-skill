# 技能设计参考的迭代清单（草稿）

2026-11-08，代理起草，待维护者确认第 5 节的决定。范围：`references/design-system/`，也就是技能随安装分发给所有用户的设计参考。这份清单只记录审计结果和建议，**没有改任何参考文件**。

依据：

- 对 `references/design-system/` 十个文件的逐项核对，加上 `grep` 取证（行号以 2026-11-08 的 master 为准）。
- 本站动效审计的结论（`docs/design-system.md` 第 6 节和 `CHANGELOG.md` 的 0.2.0）。
- emilkowalski/skills 的审计规则（MIT）：只借鉴想法，用我们自己的话写，不整段搬运。
- 刚安装的 Impeccable 4.8.1 的参考文件目录，只看了文件名和结构，没有逐篇对读。

## 1. 先要知道的约束

十个文件里，**七个是 Impeccable 的原文拷贝**，不能随手改：

| 文件 | 来源 |
|---|---|
| `color-and-contrast.md`、`interaction-design.md`、`motion-design.md`、`responsive-design.md`、`spatial-design.md`、`typography.md`、`ux-writing.md` | Impeccable 提交 `6d8c851`（Apache-2.0），文本"除顶部一行来源注释外未改动"，见 `NOTICE` |

- `scripts/plugin-package.test.py` 会检查：`NOTICE` 里列出的每个文件都以 `<!-- From Impeccable (` 开头，且包里带着许可证和 `NOTICE`。
- 我们自己写的只有三个：`micro-interactions.md`（631 行）、`style-audit.md`（378 行，2026-03-16 之后没动过）、`system-decisions.md`（72 行）。
- Apache-2.0 允许修改，但要在文件里标明改了什么，并更新 `NOTICE` 里"未改动"的说法，同时改那个测试。**直接编辑这七个文件会破坏 `NOTICE` 的陈述。**
- 上游已经变了：Impeccable 现在是 4.8.1，参考目录结构不同（`animate.md`、`typeset.md`、`layout.md`、`polish.md`、`critique.md`、`craft-floor.md` 等，没有 `motion-design.md`）。所以"同步上游"不是重新拷一遍，而是换一套结构，不是刷新。

## 2. 谁在加载这些文件

只有 `skills/variant-generate/actions.md` 把设计参考逐条列出来（第 108–118 行附近），按需读取；`style-audit.md` 由 `variant-analyze` 加载；`system-decisions.md` 由 `variant-design-system` 加载；`micro-interactions.md` 另被 `skills/shared/code-output.md` 引用。动效部分在 `actions.md` 里只有一行摘要："100/300/500 rule、ease-out-expo、退出为进入的 75%、CSS 自定义属性做错峰"。

所以改参考不会影响所有路径，影响的是"用户要求改动效、生成带动效的方向"这几条。

## 3. 发现

### 3.1 我们自己的文件里的问题（可以直接改）

| # | 位置 | 问题 | 与什么冲突 | 建议 |
|---|---|---|---|---|
| R1 | `micro-interactions.md:58` | 示例写 `transition: all 300ms`，会让浏览器动画没打算动的属性 | 本站审计的性能规则；也和同一文件里要求只动 `transform` 和 `opacity` 的原则冲突 | 改为列出具体属性 |
| R2 | `micro-interactions.md:71-74` | "Toggle Switch — With Bounce"，曲线 `cubic-bezier(0.34, 1.56, 0.64, 1)` 带过冲 | `motion-design.md` 写着"避免弹跳和弹性曲线" | 两份参考自相矛盾：改成不过冲的曲线，或明确这是"俏皮型产品"才用，并说明何时用 |
| R3 | `micro-interactions.md:347-370` | 点赞 `scale(1.3)`、`scale(1.6)` 的爆发动画 | 同上 | 标注为低频、偶尔出现的庆祝时刻才能用 |
| R4 | `micro-interactions.md:40` | 水波纹从 `scale(0)` 起 | "不要从 `scale(0)` 出现"的规则 | 水波纹是从点击点扩散，属于特例，加一句说明，不当通则 |
| R5 | `micro-interactions.md:88-181` | 卡片抬升、磁吸光标、3D 倾斜、悬停颜色等悬停动效都没有说明用在哪里 | 高频元素的悬停动效应该少或没有 | 加一条频率规则，见 R9 |
| R6 | 全部设计参考 | 没有一处提到 `(hover: hover) and (pointer: fine)`，悬停动效在触屏上会被点击误触发 | 本站已经按这个写（0.2.0） | 在悬停章节加这条，示例也改 |
| R7 | `style-audit.md:333` | 引用一个现有按钮 `transition: all 200ms ease` 的例子 | 作为"要匹配现有写法"的例子没问题，但读者会把 `all` 当成规范 | 例子换成不含 `all` 的写法，或加注 |

### 3.2 七个拷贝文件里的问题（动之前要先定第 5 节的决定）

| # | 位置 | 问题 | 建议 |
|---|---|---|---|
| R8 | `motion-design.md` 的 Reduced Motion | 给了"整体禁用"的写法 `animation-duration: 0.01ms !important; transition-duration: 0.01ms !important`，下面的"保留什么"又说功能性动画要保留。两者矛盾，而且前者正是本站审计里的一个发现（减少动效不该取消所有反馈） | 不改原文，在我们自己的文件里写明"减少动效是更少、更轻，不是零" |
| R9 | `motion-design.md` | 没有频率规则：一天出现上百次的元素（键盘快捷键、命令面板）不该有动画；每天几十次的悬停要少或没有 | 在我们自己的文件里补 |
| R10 | `motion-design.md` 的时长表 | "入场 500–800ms"没有注明只适用于一次性的页面入场；界面反馈应在 300ms 内 | 补一句限定 |
| R11 | `motion-design.md` | 缺少：按下反馈 `scale(0.97)`、弹出层从触发点缩放（`transform-origin`）、过渡可中途反转而关键帧会从头重播、`@starting-style`、避免 `transition: all`、跨文档 View Transitions | 补 |
| R12 | `interaction-design.md` | 讲了 8 种状态和焦点环，没有说焦点环要在全站统一，也没有对比度的下限（WCAG 2.2 的 3:1） | 补一条，但不要写成合规结论 |

## 4. 建议的做法

**不改那七个文件。** 在我们自己的目录里加一份短文件，例如 `references/design-system/motion-rules.md`，只写我们自己审计出来、而上游没有的规则（R8–R12），用自己的话，注明参考了谁。然后：

1. 修 R1–R7，改的是我们自己的文件，不碰 `NOTICE`。
2. `skills/variant-generate/actions.md` 的动效一行改成指向两份文件，说明什么时候读哪份。
3. `scripts/skill-links.test.mjs` 会检查新文件有路由能到达，所以第 2 步是必须的。
4. 同步描述这些行为的地方：`README.md`、`README_CN.md`、`website/src/DocsGuide.tsx` 如果提到动效参考。
5. `node evals/run.mjs` 跑一次，看加载的技能文本有没有变（`AGENTS.md` 要求改"路由加载什么"之后查这个）。评测会消耗模型用量，要你批准。
6. 更新日志：技能行为变了要升技能版本并写 `CHANGELOG.md`（`docs/versioning.md`）。

预计改动：R1–R7 约 7 处小改动，新文件约 60–80 行，`actions.md` 改 1–2 行。

## 5. 需要维护者定的事

1. **动不动那七个拷贝文件。** 我建议不动（见第 4 节）。如果要改：需要在每个文件里加"已修改"说明，更新 `NOTICE`，并改 `plugin-package.test.py` 的断言。
2. **要不要跟上 Impeccable 的新结构。** 这是换一套文件，不是刷新，会改动很多路由和测试。我建议先不做。
3. **新规则的来源标注。** 用我们自己的话写，但标明"想法来自 emilkowalski/skills（MIT）和本站的动效审计"。
4. **要不要跑评测。** 会消耗模型用量。
5. **要不要升技能版本。** 技能行为变了，按版本规则要升；我建议和第 1 条一起做一个发布。

## 6. 没做的

- 没有逐篇对读 Impeccable 4.8.1 的新参考，只看了目录结构。想对读哪几篇，告诉我。
- 没有核对其余五个参考目录（`references/ux/`、`workflow/`、`domains/` 等）。
- 没有改任何参考，也没有跑评测。
