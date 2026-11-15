# Impeccable 的 Live Mode 怎么实现，对我们有什么启发（2026-11-15）

维护者让调研 <https://impeccable.style/designing/> 讲的工作流程，特别是“在页面上点选一个元素、出几个版本、选一个写回代码”是怎么做到的。来源只有两个：官网公开页面（`/designing/`、`/live-mode`、`/docs/generate`），以及 GitHub `pbakaus/impeccable` 仓库里写给 agent 的说明 `.claude/skills/impeccable/reference/live.md` 和 `live-setup.md`。仓库是 Apache-2.0 许可的公开源码，读到的两个文件与 commit [`1d0d782`](https://github.com/pbakaus/impeccable/tree/1d0d78228a7f4df69e9b35feeb2277a2d6671ada/.claude/skills/impeccable/reference) 中的版本逐字节一致（按文件哈希核对）。没有运行它，也没有读 Rust 源码本身，所以下面写的是它的说明文件怎么描述机制，不是我们验证过的行为。

## 机制

1. **启动**：`impeccable live --allow-missing-context --dev-url --auto-config`。
   - 在本机起一个辅助 HTTP 服务，默认端口 8400，提供 `/live.js`、`/poll` 和 SSE。
   - 按 `.impeccable/live/config.json` 往页面外壳里插一行 `<script>`：Vite 或纯 HTML 插 `index.html`，Next.js App Router 插 `app/layout.tsx`。SvelteKit、Nuxt、TanStack Start 各有适配器，插入记录写进 `.impeccable/live/inject-journal.json`，`live-server stop` 时删除。
   - 项目有 CSP 时，先问用户，再加一条只在开发环境生效的 `localhost:8400` 放行。
2. **浏览器覆盖层**：用户点选元素，可以写批注、画圈，再输入要求，按 Go。事件带上元素的 outerHTML、计算样式；有批注时还带一张截图。
3. **agent 长轮询**：agent 一直跑 `impeccable live-poll`（Claude Code 里作为后台任务，超时 600000 ms）。事件分为 `generate`、`steer`（整页方向）、`accept`、`discard`、`prefetch`、`manual_edit_apply`、`variant_mount_failed` 和 `exit`。
4. **生成**：
   - `live-wrap` 用 id、class、标签和前约 80 个字符的文本，在源码里定位元素，原地写一个带 `impeccable-variants-start/end` 标记的 wrapper，并保留原元素作为恢复用的备份。
   - agent 一次写完全部版本，每版是完整替换这个元素的 HTML，CSS 用 `@scope ([data-impeccable-variant="N"])` 隔开，除第一版外都是 `display:none`。开发服务器热更新后，覆盖层用 MutationObserver 显示“1 / 3”。
   - 说明文件规定：生成后不截图、不自检，页面预览本身就是检查，完整检查只在 accept 时对选中的那一版做一次。
5. **旋钮**：每版可以声明 0–4 个参数（`data-impeccable-params`，分 `range`、`steps`、`toggle` 三种），驱动 CSS 变量或 data 属性，调整时不用重新生成。
6. **接受和清理**：
   - `live-accept` 是确定性的：保留选中的版本，删掉其他版本。
   - 然后 agent 做“carbonize”：把临时 CSS 搬进项目真正的样式表，把参数值写死，拆掉 wrapper。
   - `live-complete` 在源码里还有残留时拒绝结束（`source_dirty`）。
   - discard 用备份恢复原元素。
7. **恢复**：会话日志记在 `.impeccable/live/sessions/`，可以用 `live-status` 和 `live-resume` 接着做。另外有源码锁；生成文件和运行时注入的元素走 agent 回退流程；Svelte 走单独的组件编译路径。
8. **规模**：仓库的 `crates/live/src` 下大约 60 个 Rust 文件，另有浏览器打包、各框架适配和端到端测试。

## 生成时的设计规则

- 生成前先写一句“品牌锁定”：主色和强调色的真实值、字体、布局形态、质感、文案语气。取值来源依次是 `DESIGN.md`、CSS 变量、计算样式和相邻组件。
- 默认模式在品牌内变化，只有用户明确要求重做时才换风格。
- 三版各自只在一个不同的主方向上变化：层级、布局形态、字体系统、用色、密度、结构拆分。
- 交付前做“眯眼测试”：三版太像，或者某版偏离品牌，就重做。
- 说明文件写着“聊天是开销”：不复述，不做教学式输出。

## 和我们的差别

| | Impeccable Live | Variant Design |
|---|---|---|
| 粒度 | 一个元素，在真实页面里原地出版本 | 整页三版，在 `variant-output/` 里并排比较 |
| 写在哪里 | 预览期间往用户源码里写临时标记 | 接入（integrate）之前不改用户文件 |
| 撤回 | discard 恢复原元素 | 每次修改都有快照，接入后还能回滚 |
| 依赖 | 本地端口、长轮询、开发服务器热更新 | Node 22；Codex 沙箱里退成静态预览 |

## 对我们的启发

值得学的：

- 只对选中的方向做完整检查。
- 辅助脚本的输出直接写明下一步。
- 机械步骤交给确定性脚本，agent 只写设计。
- 生成前锁住品牌，三版落在不同的变化方向上。
- 用旋钮做不需要重新生成的微调。
- 不在对话里复述。

不该学的：

- 预览期间往用户源码写临时标记：这违反“接入之前不碰用户文件”。
- 依赖本地端口和长轮询：Codex 沙箱里绑不了端口，见 `AGENTS.md`。
- 在页面上改单个元素：这是它的主场，我们的差异在于整个方向的比较和可撤回的历史。

如果做点选，放在我们自己生成的比较页和预览页里，不往用户项目注入任何东西。第一版只生成一句可复制的命令，对应已有的 zone。

据此列出的待办在 `TODO.md` 第 5 节。

## 顺带发现

`/designing/` 的介绍语是“describe what you want to build or improve, and it helps plan the design and carry it into code”。#266 上线的安装页主句“Tell it what you want to make better. It works out the design with you, then carries it through to code.”和它几乎一样，中文是对应的翻译。已列入 TODO，待维护者换成我们自己的说法。
