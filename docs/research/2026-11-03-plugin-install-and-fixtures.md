# 2026-11-03 · 插件安装评测与其余三个 fixture

接 `2026-11-03-eval-after-route-rename.md`。那一轮只跑了 pulse，也没有经由 Claude Code 插件安装跑过完整生成。本轮补这两项。

## 评测工具改动

- `evals/run.mjs --install plugin`（仅 Claude）：把工作树连同 `.claude-plugin/marketplace.json` 复制到 `<out>/marketplace`，在每个 fixture 项目里以 `--scope local` 执行 `claude plugin marketplace add` 与 `claude plugin install variant-design@variant-design`。这与用户安装的路径相同，只是来源从 GitHub 换成本地目录。
- Claude Code 会在运行者自己的配置里登记 marketplace，并在 `~/.claude/plugins/cache/variant-design/` 写一份副本。因此已有同名 marketplace 时，runner 拒绝启动，跑完后两者都会删除。实测：给两个项目安装后执行一次 `marketplace remove`，`known_marketplaces.json` 与 `installed_plugins.json` 和备份一致。
- 对本地目录 marketplace，Claude Code 直接从 marketplace 目录读插件（Skill 工具返回的 `Base directory` 指向该目录），不读 cache。grader 的 `skill-under-test` 因此接受 `install` 参数，指向 runner 交给它的副本；读到其他技能目录或其他缓存版本，仍判失败。
- 探针（haiku，$0.002）：local 作用域安装后，技能列表只多出 `variant-design:variant-design` 一项。仅在 `.claude/settings.json` 里声明 `extraKnownMarketplaces` 与 `enabledPlugins` 时，`claude -p` 不会自动安装。

## Codex：harbor、bakery、ledger

Codex CLI 0.166.0-alpha.5.1，使用上一轮加入的隔离参数。

| Run | 结果 | 推荐 | 读入技能文本 | 用量 |
|---|---|---|---|---|
| bakery · codex | 6/6 | B | 9,613 词（10 个文件） | 37.8 万 token，145 s |
| harbor · codex | 6/6 | A | 11,086 词（11 个文件） | 59.8 万 token，269 s |
| ledger · codex | 6/7，`brand-kept` 失败 | A | 8,871 词（10 个文件） | 71.5 万 token，252 s |

ledger 失败的原因：品牌字体和颜色都保留了，但 agent 把 `app/globals.css` 复制成 `variant-output/design-system.css`，在副本末尾追加了间距 token，再把副本登记为 `designSystem.file`。这样之后的检查守的是副本：品牌文件一改，副本就过期，而 `prepare` 记录的设计系统摘要也是副本的。

技能文本里没有写“项目已有品牌文件时原地登记”，`project-context.md` 的示例还写着 `variant-output/design-system.css`。修复：

- `skills/variant-generate/ROUTE.md` 锁定段：品牌锁来自项目文件时，原地登记该文件；不要复制进 `variant-output/`，也不要往里加 token。品牌未规定的 token（如间距）放进各方案自己的文件。
- `references/workflow/project-context.md`：已有系统原地登记；`variant-output/design-system.css` 只用于技能生成的系统。

修复后 ledger · codex 重跑两次：两次都 7/7，`designSystem.file` 都是 `app/globals.css`（10,057 词 / 79.6 万 token / 257 s；8,951 词 / 69.5 万 token / 270 s）。上一轮 pulse 未加这条规则也通过了，所以两次通过只说明修复后没再出现，不能证明之前的失败率。

## Claude Code：经插件安装跑 pulse

Claude Code 2.1.316，`node evals/run.mjs --agent claude --fixture pulse --install plugin`。这次运行开始时 ledger 的修复还没写入，所以用的是修复前的技能文本。

| Run | 结果 | 推荐 | 读入技能文本 | 用量 |
|---|---|---|---|---|
| pulse · claude（插件安装） | 7/7 | A | 8,506 词（8 个文件） | $1.79，36 轮，430 s |

- 第一次工具调用就是 `Skill variant-design:variant-design`，之后经 marketplace 目录读入 `skills/variant-generate/ROUTE.md` 与各参考文件。读入的文件和字数与上一轮项目级安装的 Claude 运行完全一致（8,506 词）。
- runner 内存里还是旧版 grader（指向插件 cache），所以运行结束时判 `skill-under-test` 失败、读入 643 词。改用新 grader 重新评分后为 7/7。字数之所以少算，是因为 agent 用 `S=<marketplace 绝对路径>` 起别名，旧代码只展开以 `skills/variant-design` 结尾的别名。grader 现在先把安装目录替换成 `skills/variant-design` 再展开别名，并加了测试。
- 跑完后 `known_marketplaces.json` 里没有 `variant-design`，`~/.claude/plugins/cache/` 下也没有 `variant-design`。
- 重新评分一次要数分钟（delivery check 会真实构建预览），`grade.mjs` 在这里没有挂起。

## 未覆盖

- Claude 只经插件跑了 pulse；harbor、bakery、ledger 的 Claude 运行本轮未做（每次约 $2）。
- 插件来源是本地目录，不是 GitHub。GitHub 安装路径上一轮已在临时项目里手动验证过可安装、可调用，但没跑过完整生成。
- 方案好不好仍需人看预览；检查只覆盖承诺。
