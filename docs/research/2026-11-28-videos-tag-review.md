# 视频 tab 分类复核（2026-11-28）

维护者觉得视频的分类不够好，11-28 批准复核。范围：master 上视频 tab 的全部 20 条（都来自 X，没有 YouTube 条目）。

## 怎么看的

- 每条用 `website/src/x-media.json` 里的视频地址抽 12 帧拼成一张联系表（`ffmpeg`，`fps=12/时长`，4×3），逐张看，同时对照帖子原文（条目里的 `post.text`）。视频没有下载保存，联系表只放在本机临时目录里。
- 帧只能说明画面里有什么；“AI 做的”只按帖子原文自己说的来判断。

## 分类为什么改

原来六类：Animation、VFX、Craft、Generative、Live action、Humor。复核前的分布是 Animation 8、Generative 6、Craft 5、VFX 1、Live action 0、Humor 0。

- **Humor 一条都没有，以后也很难有**：其他五类都是做法，只有它是语气。一条好笑的定格动画该算 Craft 还是 Humor，没有答案。去掉，好笑的视频按做法归类；拍出来的段子归 Live action。代码里旧的 `Humor` 映射到实拍脑洞，不会掉进动态设计。
- **游戏和引擎场景没有地方放**：水墨平台游戏、Unreal 中世纪小城被放在 Generative，但它们不是代码艺术，Generative 因此变成了“和电脑有关的都算”。新增 **Real-time（游戏与实时）**。
- **Live action 保留**：做法成立，只是现在的发现查询偏向动画，还没收到。空分类在页面上不显示筛选项，留着不占地方。
- **边界靠顺序，不靠描述**：VFX → Craft → Generative → Real-time → Animation → Live action，第一条符合的就是答案。皮卡沙地撞车按这个顺序落在 Generative：作者说的是“全部是物理、没有预制动画”，看点是模拟系统本身，不是某个效果，也不是一个让人玩的世界。Roblox 黑洞落在 VFX：看点是一个效果，在引擎里做的也算。

完整定义写进了 `website/scripts/x-publish.mjs` 的 `TAG_GUIDE`（YouTube 共用），中文版在 RFC-008 §8 末尾。

## AI 标记

和分类分开，是一个是或否（`"ai": true`）。标准：帖子正文或画面表明生成式 AI 做了看到的东西的主要部分，包括画面、角色、贴图、模型，或者渲染场景的代码。六条符合，原文依据如下：

| 条目 | 原文依据 |
|---|---|
| Ink-wash platformer made in 24 hours | "using AI … Opus 5.5 + Flux 3 Max + GPT Image + Tripo" |
| Papertrails | "Built with Fable 5.2 and Opus 5.5" |
| A whole medieval town built in Unreal Engine with AI | "Opus 5.5 created this entire city" |
| Ghibli-style stick-figure music video | "AI 自动分镜、生成画面" |
| Illustrated market town as a three.js flythrough | "Opus 5.6 is peak @threejs, no assets" |
| AI felt stop-motion | "Stop-motion using AI" |

卡片左上角显示一个小的「AI」，详情的标签行写「AI 参与制作 / Made with AI」。

## 逐条前后对照

| 条目 | 之前 | 之后 | AI | 说明 |
|---|---|---|---|---|
| Paper stop-motion remake of Charlie and Lola (@sicknire) | Craft | **撤下** | | Lauren Child 的 Charlie and Lola，同人翻拍 |
| The Binding of Isaac: claymation school short (@Magalyn07) | Craft | **撤下** | | Edmund McMillen 的游戏角色 Isaac，同人短片 |
| Crosswalk Turns Into a Staircase in the Sky | VFX | VFX | | 实拍画面合成碎裂和台阶 |
| Unfortunate Allergy – D&D Animated Short | Animation | Animation | | 原创角色，手绘 2D |
| Mini Mizumiya: Munch Time | Animation | Animation | | 保留，见下 |
| Interactive swirling fog shader | Generative | Generative | | shader 是看点 |
| Bigdude Eats Stuff | Craft | Craft | | 笔记改了，见下 |
| Ink-wash platformer made in 24 hours | Generative | **Real-time** | 是 | 可玩的 three.js 游戏 |
| Papertrails: an endless papercraft world | Generative | Generative | 是 | 程序化的无尽世界，生成过程是看点 |
| A whole medieval town built in Unreal Engine with AI | Generative | **Real-time** | 是 | Unreal 里的场景，鸟瞰再接第三人称行走 |
| Ghibli-style stick-figure music video | Animation | Animation | 是 | AI 生成的动画 MV |
| Low-poly cat walk cycle in Blender | Animation | Animation | | |
| Beethoven animation test | Animation | Animation | | 历史人物，不是 IP |
| Pickup truck crash tests in a real-time sand simulation | Generative | Generative | | 物理模拟是看点（见上） |
| Real-time black hole VFX in Roblox | Animation | **VFX** | | 效果作品 |
| Illustrated market town as a three.js flythrough | Generative | **Real-time** | 是 | 浏览器里搭的场景，镜头一路飞过 |
| Friend group animated into a show intro | Animation | Animation | | |
| Beaver Moon Mixed-Media Stop Motion | Craft | Craft | | |
| Handmade fursuit debut with a golden retriever | Craft | Craft | | 原创兽装，手作是看点 |
| AI felt stop-motion: a pirate captain and a giant octopus | Animation | Animation | 是 | 看起来像毛毡定格，其实是 AI 生成，所以不算 Craft |

复核后（18 条）：Animation 7、VFX 2、Craft 3、Generative 3、Real-time 3、Live action 0。

## 同人作品

- **撤下**：Charlie and Lola（帖子原文说是“用纸重做 charlie e lola 的动画”）和 The Binding of Isaac（原文：“Mi amigo y yo amamos tboi”，还 @ 了原作者）。两条都是 2026-11-26 同人规则（`IP_RULE`）之前收进来的。条目、`x-media.json`、`reference-facets.json` 里的记录已删，收件箱两行改成 `rejected` 并写了原因；`x-discovery.json` 的跳过账号原因改成“已撤下”。
- **保留 Mini Mizumiya**：发帖的 @mizumiya_su 是这个 VTuber 自己的账号（`#hololive`，“感想请留在 YouTube”），画的是自己的 Q 版形象，不是“别人的角色”。`x-discovery.json` 的作者名单里也是按“自己角色的短动画”收的。

## 笔记核对

对着联系表逐条核对了 `focus`。只有一条和画面对不上：**Bigdude Eats Stuff** 原来写曲奇“被一点点啃光”，后来积木人“嘴边挂着红色黏糊糊的东西”。帧里是积木人 Bigdude 依次吞下真曲奇、糖霜甜甜圈，最后吞了旁边的小人仔，只剩一地红色碎块。中英文一起改了。其他 17 条的描述和帧一致；D&D 短片笔记里引用的两句台词（"Potion BAD"、"Roll a POISON effect"）在 12 帧里没出现，但也没有矛盾，没有改。

## 留给维护者的问题

- **Ghibli-style stick-figure music video**：帖子在推一个“火柴人 Skill”的新风格，画面右下角有“Made with Stickman Video Director”水印，原文还写“起号绝配赛道”。按现在的拒收规则（工具或产品推广），它可能本来就不该收。这次没有撤，等维护者决定。

## 验证

- `npm test --prefix website`、`npm run build --prefix website` 通过。
- `tests/landing.spec.mjs` 的视频页用例：筛选项和数据里的数量一致，AI 角标数量对得上，详情显示「AI 参与制作」。
- 本地 1440 和 390 宽度截图看过：筛选行显示「游戏与实时」，没有横向滚动，AI 角标不挡标题。Safari 和真实手机没有试。
