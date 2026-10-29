# 首页第一屏自用测试（RFC-004 P1）— 2026-10-29

用 Variant Design 技能为本站首页 `/` 的第一屏生成 A/B/C，按 RFC-004 §8 记录。产出和截图留在本机临时目录，不进仓库。最终方案由维护者选定，本次运行没有选择。

## 方法

- 技能：master `fa9ca51` 中由技能分发的文件（与 `evals/run.mjs` 的分发规则相同），安装在项目级 `website/.claude/skills/variant-design`。
- 项目：`git archive` 导出的同一 master，放在临时目录，提交一次作为基准；在 `website/` 运行 `npm ci`。在 `website/` 中启动，因为网站构建依赖上级目录的 `scripts/`。
- 宿主：Claude Code 2.1.312，模型 `claude-opus-5-5`；`claude -p --dangerously-skip-permissions --setting-sources project,local --output-format stream-json --verbose`。不带 `user` 设置来源，避免全局安装的技能遮蔽项目内的这份。
- 指令：沿用 eval 的首次生成指令，加上任务（首页第一屏）、RFC-004 §4–§7 的约束、输出目录 `variant-output-home/`，并说明已有的 `variant-output/` 是上一轮官网任务的记录、被网站代码引用、不要修改。原文：

> 使用完整 Variant Design 技能。任务：重做本站首页 `/` 的第一屏（website/src/LibraryPage.tsx 中 Feed 的首屏，以及 website/src/HomeCase.tsx）。需求与约束见 ../docs/rfc/004-landing-first-screen.md 的 §4–§7：1440×900 与 390×844 下不滚动即可看到主张、可切换的真实 A/B/C 案例和开始方式；只使用 content/entries 中 kind 为 verified 的技能产出记录，不得虚构数字、logo 或证言；客户端只写已实测的 Claude Code 与 Codex；沿用 src/design-system.css 与 src/site-system.css 的 token。在当前项目中先检查页面结构和设计系统，再生成保留核心任务的 A/B/C 三个设计方向，输出放在新的 variant-output-home/ 目录；已有的 variant-output/ 是上一轮官网任务的记录，并被网站代码引用，不要修改。打开三版预览，说明优化、取舍与适用场景，并给出有理由的推荐，但先不要替我选定最终方案。（这是无人值守运行：用 react-preview.mjs --static 生成可直接打开的预览，不要启动常驻服务器。）

## 结果

| 项目 | 结果 |
|---|---|
| 完成 | 成功，590 秒，44 轮，$2.51 |
| 读取的技能文字 | 6 个文件，6,584 词：`SKILL.md`、`skills/variant-generate/SKILL.md`、`skills/shared/code-output.md`、`references/workflow/preview.md`、`project-context.md`、`project-discovery.md` |
| 产出 | `variant-output-home/`：`VariantA/B/C.tsx` 与 CSS、`shared/home-data.ts`、`.variant-context.json`、静态预览与比较页 |
| 未选定 | `selectedVariant` 为空；推荐 A，并说明理由 |
| `src/` 与 `variant-output/` | 未改动（`git diff` 为空，评分器同样确认） |

三版共用一份数据：Pulse 与 Harbor 两条 `kind: verified` 记录、安装命令（Claude Code / Codex 切换）、"已在 Claude Code 2.1.311、Codex CLI 0.163.0 中实测"并链接 eval 基线记录。三版都没有数字墙、logo 或证言，颜色和字体取自站点 token，只是布局不同：

| 方向 | 形态 | agent 记录的优化与取舍 |
|---|---|---|
| A · 证据舞台 | 左侧主张与安装，右侧大截图，配 A/B/C 页签和重点、取舍 | 截图最大、说明最完整；"三个"需要切换才能体会 |
| B · 三联并排 | 三张缩略图同时可见，选中后在下方显示重点、取舍、适合 | "三个"一眼可见；桌面缩略图约 410 px，截图里的字读不清 |
| C · 会话记录 | 把案例呈现为一次 agent 会话，安装分两步写出 | 最能说明"装上后会发生什么"；截图最小、文字最多 |

我查看了 agent 保存的 1440 与 390 截图，与上面的描述一致。agent 报告它用 Playwright 在 Chrome 中检查过：1440×900 与 390×844 中英文首屏可见、320/390/1440 没有横向滚动、A/B/C 切换与键盘操作、复制成功与失败、主按钮对比度 10.8:1（C 为 12.3:1）、减少动态效果。这些检查由 agent 运行，我没有重跑。

## 评分器结果与解释

`node evals/grade.mjs`（不指定 fixture）：`generated`、`delivery-check`、`not-selected`、`quality-gate` 通过；两项失败，经核对都来自本次运行的设置，不是 agent 的问题：

- `project-untouched`：git 根目录是整个仓库，而项目在 `website/`。agent 写在 `website/.variant-work/` 的检查脚本和截图带着 `website/` 前缀，评分器的允许列表只匹配根目录下的 `.variant-work/`。
- `skill-under-test`：评分器把转录中出现的 `~/.claude/skills/variant-design` 和 `~/.codex/skills/variant-design` 计为"引用了其他副本"。这些路径出现在 agent 写进 `shared/home-data.ts` 的安装命令里，也出现在自动加载的 `AGENTS.md` 文本中，都不是读取操作。全部 45 次技能读取都指向项目内这一份。

后续可以考虑让评分器支持子目录项目，并且只把读取类工具调用算作"引用"。本次没有改评分器。

## 需要人工处理或尚未解决

- 静态预览从文件路径打开，读不到 `/variant-mark.svg`，左上角 logo 显示为坏图。真实站点不受影响。
- 390 宽度下，预览中的站点导航被截断（"开始使用"只显示一部分）。这是预览环境的问题还是线上首页也存在，尚未在真实站点核对。
- Claude Code 的安装命令是 agent 按 `/docs` 的规则拼出来的，因为 `DocsGuide.tsx` 没有导出 `agents`。接入时应导出并共用，满足 RFC-004 §5 的"同一数据源"。
- 320 × 640 下，开始按钮在首屏之外。RFC 只要求这个宽度不出现横向滚动。
- 这是一次运行、一位评审者（维护者）的判断依据，不代表访客测试结果；网站没有分析数据。

## 下一步

维护者比较三版后用 `pick` 选定（或要求混合，例如保留 A 的大截图，加上 B 的缩略图）。然后进入 RFC-004 P2：在真实站点实现选定方向，补齐 §10 的自动验收，并把这一轮作为 `variant-site` 条目的新产出记录。
