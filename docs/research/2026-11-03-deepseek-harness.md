# 2026-11-03 · DeepSeek Harness（dsh）

问题：Variant Design 能不能在 DeepSeek Harness 里用，要不要为它做一个插件。

## dsh 怎么找技能

据官方仓库 `deepseek-ai/deepseek-harness` 的 `docs/subsystems/skills.md`：

- 本地 provider 按顺序扫描：`<项目>/.dsh/skills`（100）、`<项目>/.agents/skills`（200）、`customSkillDirs`（300）、`<dshHome>/skills`（400）、`~/.agents/skills`（500）、内置目录（600）。同名技能取排名靠前的那份。
- 技能是 `<name>/SKILL.md` 目录或 `<name>.md` 文件，名字须为 kebab-case；不支持递归查找嵌套的 `**/SKILL.md`。所以 `skills/*/ROUTE.md` 的改名在 dsh 里同样必要，`variant-design` 也符合命名规则。
- 模型通过 `skill({ name })` 工具加载技能，返回内容里有 `Base directory for this skill`，相对路径按它解析。

“插件”在 dsh 里是另一回事：一个带 `dsh.bundle` 的 npm 包，用 patch 往 profile 里加 Cordis 插件行。打包技能的官方例子是 `@deepseek-ai/dsh-skill-office`：用 `ctx.skills.registerProvider` 注册 `assets/` 下的 SKILL.md。安装用 `dsh plugin --profile <name> add <包>`。从 GitHub 安装时需要用户在 `pnpm-workspace.yaml` 里允许构建，或由作者发布构建好的 npm 包。

## 实测（dsh 0.2.0-rc.2）

- 项目级：把技能放进探针项目的 `.agents/skills/variant-design`，执行 `dsh headless --json` 并要求列出技能目录。结果里 `variant-design` 只出现一次，子流程没有被注册成单独的技能。
- 用户级：临时复制到 `~/.agents/skills/variant-design`，在一个没有 `.agents` 的新项目里问同样的问题，`variant-design` 出现一次。探针结束后已删除这份副本。
- 完整生成：`evals/run.mjs` 新增 `--agent dsh`，安装到 `.agents/skills/variant-design`，执行 `dsh headless --json <prompt>`。

| Run | 结果 | 推荐 | 读入技能文本 | 用量 |
|---|---|---|---|---|
| pulse · dsh | 7/7 | A | 10,397 词（9 个文件） | 1,439 万 token（100 个模型步骤累计，含缓存读取），919 s |

- 第一次工具调用是 `skill {name: "variant-design"}`，接着读 `skills/variant-generate/ROUTE.md`。之后按需读入 `project-discovery`、`project-context`、`dashboard`、`quality-baseline`、`code-output`、`preview` 与 `skills/variant-design-system/ROUTE.md`。比同 fixture 的 Claude 运行（8,506 词）多读了设计系统路由。
- 品牌锁定被识别并保留：输出里有 `✦ DS locked: Pulse · Inter + JetBrains Mono`，`brand-kept` 通过。
- 运行开始时 grader 还不认识 dsh 的事件格式，所以运行结束时“读入”和“用量”两列为空。用新 grader 对同一份 transcript 重新计算，得到上表的数字。
- 用量口径：dsh 每个模型步骤报告一次 `totalTokens`（含缓存读取），表中是 100 步的累计值，和 Codex 每轮的 token 数不能直接对比。

## 结论

不需要为 dsh 单独做插件也能用：现有的 `npx skills add` 项目级安装和克隆到 `~/.agents/skills` 都已验证。本轮把 dsh 写进 README、README_CN 和 /docs 的安装选项卡，并在 `evals/run.mjs` 里加了 `--agent dsh`。

原生 dsh 插件（npm bundle）带来的额外价值要靠代码，不是靠打包本身：例如把 `variant-history` 的 apply/undo、预览服务注册成 dsh 工具，或者在 dsh web 里加一个 A/B/C 对比面板。这些需要维护一个跟随 dsh 版本（`engines.dsh`）的 TypeScript 包，而 dsh 仍是预发布版本。在有用户需要之前不做。

## 未覆盖

- dsh 只跑了 pulse 一次；harbor、bakery、ledger 没跑。
- headless profile 使用运行者自己的 dsh 登录、模型设置和 `~/.agents/skills`，没有隔离参数；评测记录里要注明。
- 没有测 dsh web/TUI 里的交互流程（预览服务、`pick B` 之后的修改与撤销）。
