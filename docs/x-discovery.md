# X 视频发现：作者名单优先

视频 tab 的 X 候选每天由 `website/scripts/run-x-weekly.sh` 找（定时任务 `xyz.variantdesign.x-weekly`，每天 10:00）。2026-11-28 起先读**作者名单**里的人最近发的视频，关键词搜索只补剩下的名额（维护者 2026-11-28 批准）。原因：#336、#337、#344、#350 四次只收了 4/18、1/3、0/6、0/8，大多数候选是别人 IP 的同人作品，正文里带作品名、不带同人标签，关键词搜索绕不开。筛选规则（`IP_RULE`，#338）和预过滤（#345）都起了作用，问题出在候选池。

## 一次运行做什么

1. 读 `website/content/x-discovery.json` 的 `authors.list`，把名单里的账号拼成 `(from:a OR from:b …) -filter:replies -filter:quote filter:videos min_faves:<authors.minLikes> since:<authors.days 天前>`，每批不超过 X 能回答的 500 字。
2. **库里已经有这位作者的视频，就不搜**：`x-publish.mjs` 每位作者只收一条，搜到也会被直接拒掉，只会占名额。名单里现在有一半是库里的作者（作为找人的起点留在名单上），运行日志会写“N listed authors already have an entry in the library and were not searched”。要是以后放开“每位作者一条”，删掉 `planSearches` 里的 `inLibrary` 过滤即可。
3. 名单搜到的新帖每位作者只留点赞最多的一条，带 `watched: true` 和 `group: "authors"` 进收件箱。
4. 还差多少条才到 `--limit`（默认 20，就是 `x-publish.mjs` 每次筛的条数），关键词组（`weekly` 等）就补多少条，按点赞从高到低。名单已经凑满 20 条时，关键词搜索不跑。
5. 预过滤（`SKIP_TEXT`、引用帖、`skipHandles`）、收件箱去重、20 条上限和模型筛选都没变；预过滤多挡一类“作者已在库里”，原因同第 2 条。
6. `x-publish.mjs` 先筛名单来的候选（`watched`），再筛关键词来的，各自按点赞从高到低。

## 没有新视频就不开 PR

- 没有新候选时，`x-discovery.mjs` 不改收件箱文件（连 `updatedAt` 也不改）。
- 筛完一条都没收（`inspiration-data.ts` 没变）、也没有待审时，`run-x-weekly.sh` 不开 PR，只打印 “No new videos today; no pull request opened.”。这次拒掉的候选存到仓库外的 `~/Library/Application Support/variant-design/x-inbox-carry.json`（可用 `X_INBOX_CARRY` 改路径），下次运行开始时放回收件箱，避免同一批帖子每天重筛；等有新视频开 PR 时，这些拒收记录跟着进 PR，文件随后删掉。
- 内存不足、上一个 PR 未合、大半候选读不到时的跳过规则不变（`weekly-guard.mjs`）。
- 2026-11-28 起 `x-publish.mjs` 按素材识别标准逐项打分（`docs/benchmark.md`），收、待审、拒由代码按分数定。有待审（报告里的 `~ ` 行）时即使没有新视频也开 PR，让维护者回“收”或“拒”。

## 维护名单

名单在 `authors.list`，每人一行：`handle`、`added`（加入日期）、`from`（怎么找到的：`library: <条目 id>` 或 `followed by @某人`）、`why`（他们发什么、看过哪条）。看过但不收的账号写进 `authors.declined`（`handle`、`reason`），以后不会再被建议。

```sh
node website/scripts/x-authors.mjs list
node website/scripts/x-authors.mjs add <handle> --from "followed by @kanetaaaaa" --why "Houdini 流体模拟（Two liquids，2.5K）"
node website/scripts/x-authors.mjs remove <handle>
node website/scripts/x-authors.mjs suggest
node website/scripts/x-discovery.mjs --plan            # 不开浏览器，列出会搜什么
website/scripts/run-x-discovery.sh --groups authors     # 只跑名单（Ego Lite）
```

- **加人之前**：在登录的 Ego Lite 里用 `from:<handle> filter:videos -filter:replies` 看最近几条视频。只收自己做原创、非设计的创意视频（动画、特效、定格与手作、代码生成、游戏与实时、实拍脑洞；分类定义见 RFC-008 §8 末尾）的人。同人账号、转发或策展账号（例如 @morrre_dsgn）、卖素材和接委托为主的、教程和课程为主的、官方工作室和 MV 导演，都不收。
- **删人**：同人或转发多了就删掉；只发同人或转发的，再加进 `skipHandles` 写明原因，关键词搜索也会跳过它。
- **建议**：`suggest` 列出视频 tab 里已收条目的作者中，不在名单、`declined` 和 `skipHandles` 里的人；每天的 PR 描述末尾也会附上。只建议，不会自动加。
- `x-authors.mjs` 写回文件时保持一人一行的格式，加一个人只改一行。

## 名单从哪来（2026-11-28）

- 库里视频 tab 的 X 作者 18 人，去掉两位做别人 IP 的（@sicknire 的 Charlie and Lola 翻拍、@Magalyn07 的 Binding of Isaac 黏土动画），留下 16 人。
- 在 Ego Lite 里读了这 16 人的关注列表（每人约 50 个），按简介筛出动画、3DCG、特效、着色器、定格等创作者约 150 人，再读第二轮（新入选的 8 人的关注列表）。对其中约 95 人用 `from:` 搜索看了近半年的视频帖，收 18 人，`declined` 记了 12 个看过不收的典型。另有 @akella（库里已有一条 Web 设计条目）也在名单上，因此不会被搜。
- 读关注者的转发列表没成功：个人主页时间线读不出转发标记，这次只用了关注列表。
- 名单共 34 人，其中 17 人会被搜（另 17 人库里已有作品）。过程和数据见 `docs/research/2026-11-28-x-author-list.md`。
