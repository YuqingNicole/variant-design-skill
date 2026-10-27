# 方向卡实测记录 — 2026-10-27

验证 RFC-002 P3：用户从方向库复制一条指令，自己的 agent 读取线上方向卡，再在用户项目里按项目自己的品牌出 A/B/C。

## 方法

- 项目：**Tally**，一家有四间门店的面包店的每周销售报告，读者是周日晚上排下周订货的店主。用 Vite + React 19 搭建，`src/tokens.css` 注明字体和五种颜色由店主锁定，故意和 Pulse 的品牌完全不同。复制成三份，运行前各做一次 git 提交作为基准。
- 方向卡：线上的 `https://variant-design-skill.vercel.app/d/pulse.json`，借鉴 A 方向（Monday Briefing · 周一简报）。
- 安装：用 `git archive` 导出 master `b8e3fb7`，装在项目级的 `.claude/skills/` 和 `.codex/skills/`。
- 指令：方向库详情页上"在你的项目里试试"给出的中文指令原文，末尾加一句无人值守说明（用 `--static`，不启动常驻服务）。
- 三次运行：

| 运行 | 宿主 | 网络 | 耗时 | 用量 |
|---|---|---|---|---|
| Claude | Claude Code 2.1.311，`claude -p` | 有 | 492 s | $2.07，39 轮 |
| Codex 联网 | Codex 0.163.0，`codex exec -s workspace-write`，开启 `network_access` | 有 | 262 s | 76,707 tokens |
| Codex 默认沙箱 | 同上，不开启网络 | 沙箱内命令不能联网 | 350 s | 81,228 tokens |

## 结果

| 检查项 | Claude | Codex 联网 | Codex 默认沙箱 |
|---|---|---|---|
| 读到真实方向卡 | ✓ | ✓ 辅助脚本 | ✓ 但不是通过沙箱：`curl` 无法解析域名，最终用本机安装的浏览器工具（ego-browser）读到了方向卡 |
| 走辅助脚本 | ✓（记录 id `card-pulse-a` 与脚本输出一致） | ✓ `.variant-work/direction-reference.json` | ✗ 浏览器工具读到内容后，存文件失败，于是手写了参考记录 |
| 参考记录 | `borrow`、`rationale` 改写成面包店的场景，`unverified`。但写进了 `.variant-context.json` 顶层 | 写在任务文件里，`unverified` | 手写，`review.status` 标成了 `verified` |
| A 贴近方向卡 | ✓ 两件要处理的事编号置顶，可以标记已处理，并显示进度 | ✓ 同样的结构，换成订货前的语境 | ✓ 同上 |
| 守住项目品牌 | ✓ 9 个页面都用 Georgia 标题和 `#fffaf0` 底色，没有用 Pulse 的 Inter 字体和深蓝配色 | ✓ | ✓ |
| 不复制卡片素材 | ✓ 标题、数据、文案都来自 Tally | ✓ | ✓ |
| 推荐但不选定 | ✓ 推荐 A，`selectedVariant` 为空，并说明"方向卡自己也推荐 A，但我的推荐只看你项目的任务" | ✓ 推荐 A，未选定 | ✓ 推荐 A，未选定 |
| 渲染检查 | ✓ Chrome 无头模式，1200 和 390 两种宽度，打开减少动态效果；交互和焦点都检查了 | ✗ 浏览器策略禁止打开本地文件，如实标为未验证 | ✓ |

9 个静态预览都是我另外用 Chrome 打开的：没有控制台报错，标题字体都是 Georgia，背景都是 `rgb(255, 250, 240)`。

## 发现与处理

| # | 发现 | 处理 |
|---|---|---|
| 1 | 文档没有说参考记录应该放在哪里。Claude 把它写进了 `.variant-context.json`，而上下文的结构里没有这个字段 | `references/direction-cards.md` 写明：创建设计任务时，放进任务的 `brief.designReferences`；不要写进上下文；在比较说明里点名方向卡 |
| 2 | 辅助脚本在沙箱里联不了网。agent 用别的工具读到方向卡后，跳过了脚本，手写记录，还标成了 `verified` | 文档写明：用别的方式读到的方向卡，要原样存到 `.variant-work/cards/<slug>.json`，再用脚本读取这个文件，不要手写记录；读过方向卡不等于 `verified` |
| 3 | 把 `borrow` 改写成用户的场景，比原样照抄方向卡更有用（Claude 就是这么做的） | 文档允许改写 `borrow` 和 `rationale`，其他字段必须保持脚本输出的原样 |
| 4 | 维护者的全局安装 `~/.claude/skills/variant-design` 是指向主工作区的软链接。主工作区当时被另一个会话切到了别的分支，所以全局技能里没有方向卡脚本。Claude 发现后改用了项目级安装 | 不改代码。记录在这里，并告知维护者 |

## 仍未解决

- 所谓"默认沙箱"并不是真的断网：Codex 自带网页搜索，本机还装了浏览器工具。完全断网时会怎样（应该请用户粘贴方向卡），这次没有验证到。
- 只用了一张方向卡（Pulse，数据展示类），而且项目和它同属数据报告。跨类别借鉴，比如把落地页的方向用到设置页，没有测试。
- 项目仍然是我们自己写的小示例。PRD-007 要求的外部试用仍然没有完成。
