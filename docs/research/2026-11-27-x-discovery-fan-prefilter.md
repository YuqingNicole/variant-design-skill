# X 发现：在筛选前挡掉同人和游戏素材帖（2026-11-27）

## 起因

每周 X 发现的通过率一路往下：#336 18 条收 4，#337 3 条收 1，#344 6 条收 0。#344 的 6 条里 4 条是同人，筛选（#338 的 `IP_RULE`）拒得没错：@Ast3rea（#wemmbu 等 Minecraft 创作者系列同人）、@lambdarops（#gunshow）、@ButtercupWinnie（#deadlockfanart）、@Has4gawa（SMG4 的 Mr. Puzzles，绑定是别人做的）。另外两条是 @NothingS_ecial 的 Roblox 动作包（#robloxugc）和一段粗糙的 WIP。

#338 的文字预过滤只认 `fan art`/`fanart`/`fan animation`/`fanmade`/`#fnaf`。`#deadlockfanart` 这种复合标签（`fanart` 前面没有词边界）、同人圈标签、“rig by”和素材销售都漏过去了，每条都花了一次模型筛选。

## 证据

收件箱只存链接和元数据，不存正文，所以 2026-11-27 用 Ego Lite 读了：

- 周组 8 个搜索的结果页（dry run，不写收件箱），拿到真实正文；
- 18 个被拒同人或素材账号的主页最近几条帖子和简介。

这些正文就是测试里的例子。主页里看到的规律：@ButtercupWinnie 连续 6 条都是 `#deadlockfanart`，用 open3dlab 上别人的模型；@NothingS_ecial 整个时间线都在卖 Roblox 动作包和表情；@ttdantell 在卖 Alastor 模型（ko-fi 商店链接）并做 Hazbin Hotel 重制；@AlanbowePro 每条都是《咒术回战》五条 vs 宿傩同人片更新；@CrimsonRakan 全是 Whisper the Wolf 绑定；@Cursed_Nelari 是 Looney Tunes 同人（#wileroad、“ACTOR AU”）；@lambdarops 是 #gunshow 同人；@Ast3rea 简介自称 multifandom。

## 改了什么

- `x-discovery.mjs` 预过滤：
  - fan work：标签里的 fanart/fanmade/fananim/fanwork/fanfic（`#deadlockfanart`）；只以标签形式出现的同人圈名（fnaf、hazbinhotel、helluvaboss、alastor、deltarune、undertale、dandysworld、wemmbu、unstableuniverse、dreamsmp、smg4、mrpuzzles、tlok、looneytunes、wileroad、monsterhunter、deadlock，都来自被拒帖子）；`oc x canon`；区分大小写的“AU”（`#UndertaleAU`、“my … AU”、“ACTOR AU”），不匹配“shipping to AU”和 `#artnouveau`。
  - someone else's rig or model：“rig by”“model by”“face animation by”“rig credit”，但“model by me”“model by hand”不算。
  - asset or commission sale：`#robloxugc`、UGC、“animation/asset/emote/vfx pack”、“on sale”、“available on Roblox/itch/gumroad/ko-fi…”、“commissions open”、ko-fi 商店链接、itch.io、gumroad。
  - made for someone else 补上 “stuff/bits I animated for X's …”（@kirbs428）。
  - 没有匹配 `#RobloxDev`：库里已上线的 @gen_xcx 原创 Roblox 黑洞特效就带这个标签，测试里留了它的原文。
- `x-discovery.json`：`exclude` 加 `-fanart -#fnaf -#hazbinhotel -robloxugc`，最长查询 480 字，低于 500。作品名只排除标签（`-#fnaf`），不排除裸词，原因同预过滤；没加 `-"rig by"`，否则会把“rig by me”的原创帖也挡掉；没加 `-roblox`，原因同上。（初版用的是 `-fnaf -hazbinhotel -"rig by"`，按 CodeRabbit 的意见改了。）`skipHandles` 加上面 8 个账号，各写原因。
- 筛选标准（`x-publish.mjs`）没动。

## 误伤检查

用新旧两版 `skipReason` 跑库里全部 179 条已上线 X 帖子的正文：判定变化 0 条。

## Dry run 对比（Ego Lite，周组，不写收件箱，不发布）

同一天先后跑旧配置和新配置。两次都有 2 个搜索（vfx、animated short）没读到帖子，X 时有时无，和本次改动无关。

| | 改前 | 改后 |
|---|---|---|
| 过赞数线的帖子（去重） | 24 | 24 |
| 预过滤后留下 | 21 | 14（加 `#mrpuzzles` 后 13） |
| 其中收件箱里没有的新帖 | 4 | 3（加 `#mrpuzzles` 后 2） |

下面的“改后”是初版排除词跑的。改后挡掉或不再出现的同人/素材帖：@ttdantell（带 #HazbinHotel，现排除词仍挡）、@NothingS_ecial（#robloxugc，现排除词仍挡）、@Has4gawa（初版被 `-"rig by"` 挡；去掉后由预过滤“rig by: @”挡，测试里有原文）；@Cursed_Nelari、@AlanbowePro、@ButtercupWinnie、@CrimsonRakan（skipHandles）；@kirbs428（给别人视频做的）；@ChimeralArt（#monsterhunter 手作）；@ChefDiabloDex（“model by @…”，新帖）。

改后仍留下、要靠模型筛的：@classicalletty 的 #mrpuzzles 同人（之后已加进标签表）、@Manuclay_ 的 Crash Bandicoot 概念图动画（只提作品名，不带标签，按规则不在预过滤里匹配），以及几条与同人无关的转发或新闻。这只是一次结果，下一周的实际通过率要看 #344 之后的周跑。
