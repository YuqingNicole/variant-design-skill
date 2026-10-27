# 自动实测基准 — 2026-10-27

第一次用 `evals/run.mjs` 跑完整矩阵。这组结果用作后续改动的对照基准，特别是"按阶段加载"改造。

## 方法

- 技能版本：master `efcd506`（#59 合并后），从工作区安装到每个项目的项目级目录。
- 宿主：Claude Code 2.1.311（`claude -p --setting-sources project,local`），Codex CLI 0.163.0（`codex exec -s workspace-write`）。
- 项目：`evals/fixtures/` 里的 3 个示例项目，都是我们自己写的。
  - **pulse**：Vite + React 数据周报，`src/tokens.css` 注明品牌锁定。
  - **harbor**：Vite + React 成员与权限页，没有品牌约束。
  - **bakery**：纯 HTML + CSS 的中文面包店页面。
- 指令：`/docs` 第一次生成的原文，加一句"无人值守、不要启动常驻服务器"。
- 3 个项目 × 2 个 agent，共 6 次，同时跑 3 次。

先用 `--setting-sources project,local` 做了一次小实验：项目里放一份改过描述的技能，带 `user` 时 Claude 看到的是全局那份，不带时看到的是项目那份。所以以前记录里"全局安装会覆盖项目安装"的问题，用这个参数就能避开。

## 结果

| 运行 | 检查全部通过 | 推荐 | 读取技能文字 | 用量 | 耗时 |
|---|---|---|---|---|---|
| pulse · Claude | ✓ | A | 14,746 词（9 个文件） | $1.82，34 轮 | 617 s |
| pulse · Codex | ✓ | A | 23,539 词（16 个文件） | 76.9 万 token | 309 s |
| harbor · Claude | ✓ | A | 15,076 词（11 个文件） | $2.46，51 轮 | 1026 s |
| harbor · Codex | ✓ | A | 21,054 词（14 个文件） | 116.5 万 token | 513 s |
| bakery · Claude | ✓ | B | 14,919 词（8 个文件） | $2.00，37 轮 | 589 s |
| bakery · Codex | ✓ | B | 21,300 词（13 个文件） | 58.2 万 token | 324 s |

检查项：生成了记录；`delivery-check` 无错误；没有替用户选定；业务代码没动；质量扫描无错误；pulse 的品牌锁定被识别并保持（两个 agent 都记录了 `src/tokens.css` 和 Inter / JetBrains Mono，变体文件没有声明其他字体）；读的是项目里的那份技能。

Codex 的 token 数包含缓存命中的输入，不能直接换算成费用。

## 发现

| # | 发现 | 证据 | 处理 |
|---|---|---|---|
| 1 | 首次生成前读入的技能文字太多：Claude 约 1.5 万词，Codex 2.1–2.4 万词。两者都用 `cat` 整个文件读。读入的大部分内容是变体动作、局部改动、撤回、导出接入和上线加固，第一次生成用不上 | 各运行的 `reading` 字段 | 按阶段加载改造，见后续 PR |
| 2 | Codex 三次都读了 905 行的 `interactive-patterns.md` 和 `micro-interactions.md` | 读取文件列表 | `code-output.md` 写着"Always load these references before coding"。改造时改成"需要某个模式时只读那一节" |
| 3 | 两个 agent 都读了 `artifact-verification.md`，但没有一次运行生成验证报告 | 读取文件列表 | 总入口最后一节和 `preview-and-history.md` 都指向它。改造时移到导出阶段 |
| 4 | 评分脚本第一版把相对路径（`cat .claude/skills/...`）判成"读了别的副本"，6 次中有 5 次误判失败 | 原始 `summary.md` | 已修复并加测试；本表是修复后重新评分的结果 |
| 5 | harbor · Codex 三个方向都用了 `min-height: 100vh`，质量扫描给出警告 | 质量扫描警告 | 未处理，记录下来 |

## 局限

- 每个组合只跑一次，没有重复，结果会有波动。
- 检查只覆盖可以确定判断的承诺，不判断设计好坏；三个方向是否真的好、推荐是否合理，仍需要人打开预览看。
- 示例项目都很小，是我们自己写的，不是外部用户的真实项目。
