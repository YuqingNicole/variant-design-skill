# Codex / Claude Code CLI 实测记录 — 2026-10-26

## 方法

- 宿主：Codex CLI 0.163.0（`codex exec`，`workspace-write` 沙箱，不弹审批）与 Claude Code 2.1.310（`claude -p`，跳过权限确认）。两者都是非交互方式运行，同一会话连续多轮。
- 安装：按 `/docs` 的方式完整克隆，但装在项目级目录（`.codex/skills/`、`.claude/skills/`），不改动全局技能目录。两个 CLI 都能发现技能，已用一条不读文件的探测指令确认。
- 项目：
  - **Tidepool**：Vite + React 19 落地页，`src/tokens.css` 注明了品牌锁定，页面有一个注册表单。
  - **半山面包**：纯 HTML + CSS 的中文单页，有一个预订表单。
- 每个沙箱依次执行 `/docs` 的步骤：第 02 步首次指令 → `B vary subtle — hero` → `undo B` → `pick B` 加第 04 步的接入指令。每一步之后用 git 提交，方便逐步对比。
- 第 1、2 轮用当时的技能；第 3 轮用本次修改后的技能，在新的 Tidepool 项目上两个 CLI 各跑一遍。

## 第 1、2 轮结果

| 沙箱 | 首次生成 | 微调 | 撤回 | 接入 | 累计费用 |
|---|---|---|---|---|---|
| HTML · Codex | 274 s | 84 s | 58 s | 585 s | 约 196 万 token（大部分是缓存） |
| Vite · Codex | 465 s | 110 s | 70 s | 134 s | 约 243 万 token |
| HTML · Claude | 375 s | 123 s | 24 s | 69 s | $3.17 |
| Vite · Claude | 413 s | 207 s | 29 s | 224 s | $4.30 |

说明：Claude 的耗时取 API 时间。它的墙钟时间更长，因为 headless 会话会一直挂着后台预览服务器。

8 次运行都保持了品牌 tokens，都没有改动原有源码，也都没有自动选定方案，`selectedVariant` 只在用户说 `pick B` 之后才写入。Claude 在浏览器里实际检查了两种宽度、表单和焦点；Codex 在沙箱里无法打开预览，每次都如实标注"未验证"。

## 发现与处理

| # | 发现 | 证据 | 处理 |
|---|---|---|---|
| 1 | Codex 沙箱不能监听端口，`file://` 加载不了 React 的 ES 模块。Vite · Codex 只好自己写了一个 esbuild 离线打包脚本 | `vite-codex/variant-output/build-offline.mjs` | `react-preview.mjs --static`：用项目自己的 Vite 打包成 IIFE，再把 JS/CSS 内联进 `_static/`，双击即可打开 |
| 2 | 同一文件里 hero 同时有 HTML 和 CSS 两对标记时，helper 只认第一对，所以 `<head>` 里的 hero 样式永远改不了 | HTML · Claude 第 2 步的报告，指向 `variant-history.mjs:125` | `outsideZone` 改为识别同一区域的每一种标记，并新增测试 |
| 3 | 一次 `B vary subtle — hero` 产生了 3 个版本（补标记、修改、修复连字符），`undo B` 只撤回了连字符修复 | Vite · Claude 第 2、3 步 | 在 `change.json` 中加 `request` 字段：同一请求的多个 apply 一次撤回。同时要求首次生成时就给样式加上 zone 标记 |
| 4 | 4 次接入用了 4 种备份 / 回滚方式：两个不同的 Python 脚本、`variant-output/_backup/`、`.variant-backups/` | 四个沙箱第 4 步的报告 | 新增 `variant-integrate.mjs`：apply 前先持久化备份；rollback 遇到接入后的手动修改时拒绝执行 |
| 5 | 首次指令里的"不要替我选定"让 2/4 次运行连推荐都省略了 | 两个 Vite 运行的 context 中没有 `recommendation` | 文档改为"给出有理由的推荐，但不替我选定" |
| 6 | 工作文件分散在项目根目录的 `work/`、项目外的 `../tidepool-variant-work` 等位置 | 各沙箱的文件树 | 统一放到项目根目录的 `.variant-work/` |
| 7 | `tests/` 锁定的 Rollup 4.64.0 在本机做任何生产构建都会死循环；4.65.0 正常 | 用同一 fixture 对比 4.64.0 和 4.65.0 | `tests/` 升级到 4.65.0；`--static` 放在子进程里构建，180 秒超时后给出明确错误 |

## 第 3 轮复测（修改后的技能）

| 检查项 | Codex | Claude Code |
|---|---|---|
| 首次生成给出推荐但不选定 | ✓ 推荐 A，`selectedVariant` 为空 | ✓ 推荐 A |
| 无法启动服务时的预览 | ✓ 自动用 `--static`，不再自己写打包脚本 | 不需要，实时预览可用 |
| hero 局部微调，一个请求只产生一个版本 | ✓ `request: B-vary-subtle-hero-1` | ✓ 同左，CSS 首次生成时已加标记 |
| `undo B` 回到修改前的版本 | ✓ | ✓ 用校验和确认 A/C 未变 |
| 接入使用统一 helper | ✓ `.integrations/…-B.json` | ✓ 同左 |
| 回滚后源码与原始提交逐字节一致，项目仍能构建 | ✓（在副本上实测） | ✓（在副本上实测） |
| 工作文件放在 `.variant-work/` | ✓ | ✓ |

## 仍未解决

- Codex 沙箱里仍然无法做渲染检查，只能交付静态预览，并把视觉验证标为"未验证"。交互式 Codex 可以申请提权；文档已提示用户可在自己的终端运行预览命令。
- Claude 在 headless 会话中启动的后台预览服务器会超时停止，或者让 `claude -p` 一直不退出。交互式使用没有这个问题。
- 两个 CLI 都没有在真实的手机、屏幕阅读器或非 Mac 系统上测试过。
- 本次没有观察真实用户，只记录了 agent 的行为。PRD-007 要求至少两位外部试用者，这一项仍然没有完成。
