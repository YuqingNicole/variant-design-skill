# 案例系列第一批：三个夹具上的真实运行（2026-11-13）

维护者 2026-11-13 定下目标"展现 AI design 的全部实力和一些教程性内容"，并选择先做"从 brief 到三版"的案例系列。本文记录第一批三个案例是怎么跑出来的、花了多少、检查结果和没做到的事。案例本身在 `website/content/entries/{bakery,motion,ledger}.json`，证据在 `website/content/evidence/<slug>/variant-output/`。

## 方法

- 代码：worktree `codex/case-series-1`，基于 master `eb75b6b`；技能文件从这棵工作树按项目级安装（`.claude/skills/variant-design`），由 `evals/run.mjs` 完成。
- 命令：`node evals/run.mjs --agent claude --fixture bakery,ledger,motion --jobs 3`，三个运行在同一台机器上并行。
- 宿主：Claude Code 2.1.323，`claude -p --dangerously-skip-permissions --setting-sources project,local`，模型 `claude-fable-5-1`（取自运行记录的 init 事件）。本机没有 `~/.claude/CLAUDE.md`，所以没有全局设计指令混入。Codex 没有安装，这批只有 Claude Code。
- 指令：各夹具 `fixture.json` 里的原文，一字未改；案例页"怎么做出来的"里的中文指令直接读自夹具文件。
- 评分：`evals/grade.mjs` 的确定性检查（见 `evals/README.md`）。好不好看、三版是否足够不同，仍由人打开预览判断。

## 结果

| 夹具 | 项目 | 用时 | 费用 | 轮次 | 推荐 | 检查 |
|---|---|---|---|---|---|---|
| bakery | 纯 HTML/CSS 的面包店单页，品牌在 `style.css` | 13 min 13 s | $5.89 | 50 | A | 7/7 通过 |
| motion | 同一页面，brief 是动效 | 16 min 51 s | $7.00 | 39 | C | 13/13 通过（含 6 项动效检查和 motion-rules 已读） |
| ledger | Next.js App Router 定价页，品牌锁定在 `app/globals.css` | 17 min 58 s | $8.61 | 85 | A | 8/8 通过（含 brand-kept） |

合计 $21.50，并行墙钟约 18 分钟。三个运行都：先扫描项目再生成；三版共用一份数据；`selectedVariant` 为空；没有改项目文件；strict 质量门禁零错误；交付检查通过。

## 每个运行的观察

- **bakery**：识别出 `style.css` 的 flour / crust / ink 三色和 Songti SC，按品牌锁定模式只做结构差异（A 柜台黑板、B 预订台、C 山前小报）。做浏览器自检时，agent 借用了本机另一个项目（`/Users/mac/orca/arti`）里的 Playwright：评测运行器隔离的是技能和项目，隔离不了机器上已有的 node 模块，这一点要写进运行器的说明。
- **motion**：三版都通过了 6 项动效检查（有动效、无 `transition: all`、不从 `scale(0)` 起、悬停只在有悬停的设备上、减少动效下退化），并读了 `references/design-system/motion-rules.md`。agent 自己写了一个 Python 浏览器探针做了 116 项行为检查，这是它的报告，我们没有复跑。静态截图看不出动效差异，案例页靠三段说明文字区分，内容格式目前不支持视频或 GIF。
- **ledger**：Next.js 项目，用 `react-preview.mjs --static --vite-root .variant-work/preview-harness` 生成静态预览；`variant-output/_preview/*.html` 是开发模式页面（引用 `.tsx`，需要服务器），可直接打开的在 `_static/_preview/`。两点要记到技能的待办里：
  1. `.variant-context.json` 的 `recommendation.reason` 是英文，而对话、指令和三个方向的说明都是中文。网站规则要求已验证案例的中文与记录逐字一致，所以中文案例页上这条推荐理由显示为英文。context 的语言应跟随对话语言。
  2. ledger 的 context 里方向没有名字字段，案例页上的方向名（先问人数、逐项比较、先讲扣款）取自 agent 的运行总结，不是 context。

## 截图和证据

- 截图由我们事后用 Chrome 在 1440×900 下对 agent 自己生成的文件截取（脚本在会话临时目录）：bakery 和 motion 直接打开 `variant-output/variant-bakery-{A,B,C}.html`（样式经 `../style.css` 取自项目），ledger 打开 `_static/_preview/{A,B,C}.html`。JPEG，每张不超过 400 KB（内容校验器的上限）。
- 证据目录复制了 `.variant-context.json`、三版源文件和 `shared/`，没有复制 `_compare.html`、`_preview/`、`_static/`。
- 案例页新增"怎么做出来的"：运行环境、日期、用时、费用、轮次、给 agent 的原话和运行中调用的技能命令。命令列表是从运行记录里整理的（去掉了管道和重复），不是逐字的 shell 行。harbor 和 pulse 两个老案例的用时、费用、轮次来自 `2026-10-27-direction-library-dogfood.md`，没有命令列表。

## 没做到的

- 只跑了 Claude Code；Codex 和 DeepSeek Harness 没有跑。
- 没有用户测试，也没有跨浏览器检查；三版"好不好"只有我们看截图的判断和 agent 自述的自检。
- 三个项目都是我们自己写的小夹具，不是外部用户的真实项目；"真实小 brief"的案例还没有做。
- 首页只加了一行入口（标题下"案例：一个任务出三版 →"），没有加带图的案例区：首页手机 LCP 已在上限边上，先等数据拆分。
- 展示技能后半程（`pick`、设计系统、`apply`、`undo`、接入和回滚）的案例还没有：`harbor-chain` 和 `native-vite` 两个多轮夹具可以作为下一批。
