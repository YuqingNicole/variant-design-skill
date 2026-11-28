# 2026-11-28 X 发现改为作者名单优先：名单来源与实跑对比

维护者 2026-11-28 批准：视频 tab 的 X 发现先读作者名单，关键词搜索只补剩下的名额。起因是最近四次的收录率：#336 4/18、#337 1/3、#344 0/6、#350 0/8，被拒的大多是别人 IP 的同人作品。做法见 `docs/x-discovery.md`。

## 名单怎么来的（Ego Lite，已登录的 X）

1. 起点：库里视频 tab（Animation、VFX、Craft、Generative、Live action、Humor）的 X 条目 20 条，作者 18 人。去掉两位做别人 IP 的：@sicknire（Charlie and Lola 纸片翻拍）、@Magalyn07（Binding of Isaac 黏土动画）。剩 16 人。
2. 读这 16 人的关注列表（`/following` 滚 10 屏，每人 14 到 72 个账号）。按简介关键词（animat、3DCG、blender、vfx、shader、houdini、stop motion、映像、アニメ 等）筛出约 150 人，挑了 50 人，用 `from:<handle> filter:videos -filter:replies min_faves:50 since:2026-06-01` 看每人最多 8 条热门视频帖。
3. 第一轮收 8 人，再读这 8 人的关注列表，挑 44 人照样看。第二轮收 10 人。
4. 想读转发：个人主页时间线读不出转发标记（`socialContext` 为空），这次只用了关注列表。
5. 不收的典型写进 `authors.declined`（14 个，含上面两位）：全是同人（@IzzybnArt）、拿别人角色做像素画（@LumpyTouch）、官方工作室（@glitch_prod）、初音 MV（@soraosakimura）、教程和工程文件（@Vithagoras）、推自己的游戏（@steelkrill）、卖插件或素材（@JesseMiettinen、@Komaru_hyper）、教材和课程（@techartist_、@bruno_simon）、商业 MV 导演（@Ray_T6L）、动画片尾和周边（@AOSE_KIIRO）。另有很多人近半年没有达到 50 赞的视频帖，或者只发作品集和接活信息，没有写进 declined。

名单 34 人：库里作者 16 人，加新找到的 18 人（每人写了 `from` 和 `why`）。@akella 在新找到的人里，但库里已有 @akella 的一条 Web 设计条目，`x-publish.mjs` 每位作者只收一条，所以和另外 16 位库里作者一样不搜。**实际会被搜的是 17 人**，一批 `from:` 查询（403 字）就够。

## 实跑对比（不发布）

两次发现都在 Ego Lite 里真实跑，写进收件箱的临时副本，仓库里的收件箱没动。今天 10:00 的定时任务已经跑过一次（#350），所以关键词能找到的新帖不多。

| | 之前（master：只有关键词） | 之后（名单优先，补到 20 条） |
|---|---|---|
| 搜索次数 | 8 | 9（名单 1 批 + 关键词 8） |
| 合格的帖子 | 16 | 24 |
| 新候选 | 3 | 13（名单 10、关键词 3）；每位作者只留一条后 9 |
| 预过滤挡掉 | 2 同人、1 给别人做的、1 跳过账号 | 3 同人、1 给别人做的、1 AI 模型展示、3 作者已在库里、1 跳过账号 |
| 模型筛选会收 | **0/3** | **5/9**（名单 5/6，关键词 0/3） |

名单这批 10 条里 @beigesthetic_ 有 4 条、@Yokohara_h 有 2 条；`x-publish.mjs` 每位作者只收一条，多出来的会占名额，所以加了“每位作者只留点赞最多的一条”（`onePerAuthor`）。上表的筛选就是在这 9 条上跑的（`x-publish.mjs` 的 `dryRun`，模型读了每条视频的 6 帧）：

- 会收：@JDGE180112（龙娘新年喷火，Animation）、@Yokohara_h（吉祥物套里钻出蠕虫群，Animation）、@beigesthetic_（实验室里的有翼生物，Animation）、@picassotrigger8（两个女孩和一根棒棒糖，Animation）、@cotterzz（Voronoi 变成吉格尔式怪物，Generative）。
- 会拒：@waltinjapan00（只有镜头缓慢掠过丛林游船，看不出点子，可能是在复刻主题乐园项目）；关键词来的 @Voltaine1（软件界面演示）、@Zayderan（灵感来自别人，角色归属不明）、@shopuwumarket（带货活动短片）。

这只是一天的一次对比，样本小；名单上的人也会发同人或给客户做的东西，筛选照旧把关。

## 没验证的

- `run-x-weekly.sh` 的新分支（不开 PR、拒收记录存到仓库外再放回）只跑过单元测试，没有在定时任务里真跑过。
- 名单搜索窗口 7 天、点赞下限 100 是初值；每天跑、窗口 7 天，同一条帖子靠收件箱去重。
