# X 每周发现改为找"作者本人发的作品"（2026-11-23）

## 问题

2026-11-22 的每周 X 任务（PR #312）找到 6 条候选，`x-publish.mjs` 筛掉了全部 6 条：3 条"18/20 个 GitHub 仓库"的工具清单（Remotion、ComfyUI……），1 条带收入说法的工具推广，2 条转发别人动画（"Who made this 😭"、只谈涨粉不署名）。筛选没问题，问题在发现步骤搜回来的池子。

收件箱里视频 tab 范围内的历史（2026-11-19 至 11-22，`weekly`、`craft`、`vfx`、`generative`、`humor` 五组，56 条）：

- 收的 9 条全是小账号本人发的作品（Magalyn07、sicknire、worldofio、mizumiya_su、r4nM4_64、jammyjanmo、kuro_40、dieegosf）。
- 拒的原因集中在四类：仓库或工具清单（e1genqq 一个号 5 次，flxrnc 2 次，0xMovez、cryptowluha、rachiitgr、Y0urDumble 各 1 次）；聚合号或新闻号转发（ToonHive 3 次，DiscussingFilm、ani_obsessive、CartoonsOTMoon、dailytobytrivia 各 1 次）；广告、预告片、Kickstarter；Blender 或 Unity 的技术演示。
- 旧的 weekly 第一条查询只有题材词（`animation OR animated OR "short film" OR vfx`），点赞下限 1000，高赞的正好是清单帖和转发号。

## 改了什么

- 查询改用作者口吻加题材：`"i made"`、`"i animated"`、`"made this"`、`"my new short"`、`"took me"`、`"animation test"`、`wip` 等，配动画、定格手作、代码生成、特效、幽默五条查询。点赞下限降到 300–500，因为作者本人的帖子通常不如转发号高赞。
- 配置加了顶层 `exclude`，拼到每条关键词查询后面：`-filter:replies -filter:quote -repos -github -prompt -bookmark -thread -tutorial -trailer -kickstarter -"who made" -credit -claude -remotion -comfyui` 等。
- 配置加了 `skipHandles`：上面反复出清单或转发的 9 个账号，每个写了原因。
- 搜索页读帖时顺带读正文和"是不是引用帖"，命中以下任一就不进收件箱，省一次模型筛选：引用帖、`skipHandles` 里的账号、"N 个 repos/tools/skills/prompts/websites"或"bookmark this"或 🧵、github/repo/Remotion/ComfyUI、"who made this"/"credit:"/"via @"、收入或涨粉说法、"link in bio"/Kickstarter/预购/愿望单、"某 AI 模型 + 版本号"。正文只用来判断，不写进收件箱。
- X 网页搜索的查询超过约 500 个字符时什么都不返回（实测 516 个字符的空了，483 个字符的正常）。`planSearches` 现在拒绝超过 500 个字符的查询。
- 同一次运行里，X 有时会让某个搜索页超时，过一分钟再搜又正常（这次一轮 5 个搜索里 3 个超时，单独再搜能读到帖子），所以超时的搜索会重试一次。
- 筛选标准（`x-publish.mjs`）没动。

## 试跑（不发布）

用维护者这台机器上已登录的 Ego Lite 跑真实的 X 搜索，写进临时收件箱副本；再用 `x-publish.mjs` 的 dry run（真实的 syndication 接口、ffmpeg 和 `claude -p`，不写文件）筛选。模型每次判断可能略有不同，下面的数字只是一次结果。

**改之前**（旧配置，同一天）：9 条候选，其中 5 条是以前已拒的（e1genqq、flxrnc、cryptowluha 的清单，magsimich 的转发，pud 的硬件推销），新的 4 条是 jvl3djp、VivixLabs_HQ、mysteropodes、ai_for_success。第二次用旧查询跑时已经带上新的预过滤，候选是 jvl3djp、Visual_Salman、VivixLabs_HQ。这 3 条筛的结果：jvl3djp（低多边形猫走路循环）收，Visual_Salman（Blender 动漫海浪）收，VivixLabs_HQ（AI 工具黑五促销）拒。旧查询一周能带回两三条好作品，但前排被清单号和转发号占着。

**改之后**（最终配置）：5 个搜索得到 14 条候选，搜索时已跳过 1 条资源清单和 1 条转发；按现有标准会收 6 条（约 43%），11-22 那次是 0/6：

| 账号 | 赞 | 结果 |
|---|---|---|
| @Zabudmenyaaa | 4112 | 收（Animation）：《Re:Zero》同人蝎子短片，作者第一部动画 |
| @LitterboxComics | 2115 | 收（Animation）：Litterbox 动画试播片段 |
| @thomasma_labs | 782 | 收（Generative）：浏览器里实时沙地模拟，皮卡碰撞测试 |
| @Beez_1209 | 763 | 收（Animation）：手绘鬼魂女孩动画 |
| @IthzHolub | 464 | 收（Craft）：小蝙蝠玩偶定格 |
| @gen_xcx | 327 | 收（Generative）：Roblox 黑洞特效 |
| @BitzelYT | 28138 | 拒：给别人视频做的镜头合集，Minecraft 风同人 |
| @mi_r3s | 4417 | 拒：可能是游戏里现成的角色模型，镜头偏擦边 |
| @ghosteroven2 | 1193 | 拒：重画知名动画电影的场景，背景像是直接拿来的 |
| @MichaelRusakov | 796 | 拒：画面偏性暗示 |
| @Manuclay_ | 782 | 拒：把别人的概念图做成动态壁纸，没署名 |
| @starssira | 746 | 拒：很粗的同人铅笔动态分镜 |
| @JibrilThe_Thing | 644 | 拒：手机对着屏幕拍的 Blender 绑定测试 |
| @AE1686656626 | 445 | 拒：复刻《崩坏：星穹铁道》的技能特效 |

拒掉的 8 条里已经没有工具清单、收入帖或"who made this"转发了，剩下的是同人作品、未完成的测试和擦边内容，这些只能交给模型看帧来判断。

中间版本曾经混进几条与主题无关的转发（达拉斯体育节目、K-pop 艺人 Instagram 片段、1977 年《小熊维尼》片段、GRWM 聊天）。原因是 `experiment`、裸 `my`、`we filmed` 太宽，最终配置已经去掉这些词。

## 还要注意

- `run-x-weekly.sh` 默认 `--limit 10`，按点赞从高到低筛。上面 14 条里排在前 10 的会收 4 条，IthzHolub、gen_xcx 这类低赞的好作品要等下一周。要不要提高上限，由维护者定（每多一条就多一次 `claude -p`）。
- 幽默那条查询这次一条帖子都没读到（门槛已从 1000 降到 500）。下周看运行报告里的"searches gave nothing"。
- 同一作者不重复收录的规则还在，所以没有把以前收过的作者加成账号搜索。
