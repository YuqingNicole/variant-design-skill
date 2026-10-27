# 技能分发渠道核查 — 2026-10-27

对应 RFC-002 P4：把 variant-design 送到 recent.design 的 Skills 栏目和 skills.sh。资料来自两个网站的公开页面，以及 skills CLI 在 GitHub 上的 README，都按普通访客的方式阅读；另外在一次性目录里实际安装了一次。

## 两个渠道都没有投稿表单

| 渠道 | 公开页面上的说法 | 结论 |
|---|---|---|
| skills.sh | 首页是按安装量排名的榜单，安装命令是 `npx skills add <owner/repo>`，没有投稿入口。skills CLI 的 README 说，设置 `DISABLE_TELEMETRY=1` 或 `DO_NOT_TRACK=1` 可以关闭"统计与安全审计请求" | 上榜靠用户用 skills CLI 安装，不需要也无法提交。我们要做的是保证这条命令能装对 |
| recent.design | Skills 栏目按 `作者/仓库` 列出技能，安装按钮链接到 skills.sh；`/sponsor` 只有付费赞助：30 天 $5,000，每次最多 4 个合作方；`/info` 没有投稿方式和联系方式 | 没有公开的免费收录渠道。付费赞助不在本 RFC 的范围内 |

所以 P4 里"申请收录"这一项无法通过公开渠道完成。我们没有发送任何申请，也没有付费。

## 实际安装

在一次性 git 目录里关闭统计后安装（`DISABLE_TELEMETRY=1 DO_NOT_TRACK=1`，skills 1.7.4）：

```sh
npx skills add YuqingNicole/variant-design-skill --list               # 找到 1 个技能：variant-design
npx skills add YuqingNicole/variant-design-skill -a claude-code -a codex -y
```

- 完整仓库被复制到 `.agents/skills/variant-design`，大小 5.7 MB，包含 `scripts/`、`references/` 和 `skills/`。Codex 直接使用这个目录，Claude Code 通过 `.claude/skills/variant-design` 软链接指向它。
- 从安装目录运行 `scripts/direction-card.mjs` 读取线上方向卡，正常。
- 让两个 CLI 列出能识别到的技能：Claude Code 只列出 `variant-design`。**Codex 列出了 6 个**：`variant-design`，以及 `variant-analyze`、`variant-component`、`variant-design-system`、`variant-generate`、`variant-ux`。

## 发现与处理

| # | 发现 | 处理 |
|---|---|---|
| 1 | Codex 会递归扫描技能目录，把带有 `name:` 声明的 5 个子流程也注册成独立技能。直接调用它们会绕过路由，而它们引用的 `skills/shared/code-output.md` 等路径，都是相对技能根目录写的。用 `git clone` 安装到 `.codex/skills/` 也有同样的问题 | 去掉子流程文件头部的技能声明，换成一行注释，说明它们只能经由根目录的路由进入，正文不变。修改后重新探测：Codex 和 Claude Code 都只识别出 `variant-design`。新增打包测试：仓库里只有根目录的 `SKILL.md` 可以带技能声明 |
| 2 | 只有 Claude Code 和 Codex 用 skills CLI 实测过；它支持的其他 agent 没有测 | README 只写已经验证过的命令和版本 |
| 3 | skills CLI 默认会上报统计 | README 说明了关闭方法 |

## 仍未解决

- recent.design 没有公开的免费收录渠道。以后如果有，我们可以提供：仓库 `YuqingNicole/variant-design-skill`、分类 Interface、一句话说明"把一个任务做成 A/B/C 三个可比较的方向，并安全接入你自己的项目"，以及安装命令。
- skills.sh 上的排名完全取决于安装量，这次测试关闭了统计，不会计入。
