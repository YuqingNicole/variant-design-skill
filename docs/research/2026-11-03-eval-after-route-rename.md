# 实测：子流程改名为 ROUTE.md 之后 — 2026-11-03

目的：确认 #121 把 `skills/*/SKILL.md` 改名为 `ROUTE.md` 之后，真实 Agent 仍能按路由读到生成流程，并完成第一次生成。同时检查评测本身是否与运行者的本机环境隔离。

## 方法

- 技能版本：master `956d07d`，用 `node evals/run.mjs --fixture pulse` 从工作区安装到项目级目录。
- 宿主：Claude Code 2.1.316，Codex CLI 0.166.0-alpha.5.1。
- 示例项目：pulse（Vite + React 周报，品牌锁定）。每个 Agent 一次。Codex 跑了两次：先按原来的命令，再加上隔离参数。

## 结果

| 运行 | 检查全部通过 | 推荐 | 读取技能文字 | 用量 | 耗时 |
|---|---|---|---|---|---|
| pulse · Claude | ✓（7/7） | A | 8,506 词（8 个文件） | $1.93，40 轮 | 1,457 s |
| pulse · Codex（原命令） | ✓（7/7） | A | 7,483 词（7 个文件） | 56.3 万 token | 1,097 s |
| pulse · Codex（隔离后） | ✓（7/7） | A | 8,506 词（8 个文件） | 54.4 万 token | 192 s |

对照上一次记录（`2026-10-27-progressive-loading.md`）：Claude 7,788 词、$1.89、685 s；Codex 8,118 词、307 s。

- 三次运行都读了 `skills/variant-generate/ROUTE.md`，改名后路由正常。
- 读取量和之前同一量级（7.5k–8.5k 词）。
- Claude 的工具调用合计 198 s，其余是模型时间；耗时比上次长，没有发现与技能有关的原因，可能是当时的网络和服务延迟，只跑了一次，不下结论。

## 发现：Codex 评测没有和运行者的环境隔离

原命令下的 Codex 运行加载了运行者自己的 `~/.codex` 配置：

- 调用了本机的 Computer Use MCP 服务（`cua_repl`）去“检查可用的预览环境”。这能操作运行者真实的电脑，评测不该有这个权限，结果也会因为谁在跑而不同。
- 加载了 `hooks.json`，并尝试更新一个无关的插件市场（`chatcut-inc`），网络超时 30 秒。
- 这次运行的模型工作在约 3 分钟内完成，但进程过了约 15 分钟才退出。

处理（本次 PR）：`evals/run.mjs` 给 Codex 加上 `--ignore-user-config --ignore-rules --ephemeral -c features.hooks=false`。先用一个不执行命令的探针确认：加参数后 Computer Use 不再出现、hooks 不再加载、登录仍然有效。之后重跑 pulse，7 项检查全过，耗时从 1,097 s 降到 192 s。

仍未隔离：两个 CLI 都会读运行者的全局说明（`~/.codex/AGENTS.md`、`~/.claude/CLAUDE.md`），没有找到跳过它们的参数。本次两份全局说明里只有 CodeGraph 的用法，没有设计相关的内容。`evals/README.md` 已写明。

## 局限

- 每个组合只跑一次，只用了 pulse；harbor、bakery、ledger 没跑。
- 检查只覆盖确定性的承诺，三个方向的好坏仍需要人看预览。
- Claude Code 插件安装方式（`claude plugin install`）没有跑完整生成，只在 #121 里确认了加载和脚本路径。
