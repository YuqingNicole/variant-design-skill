# 灵感库第五批新增（2026-11-13）

灵感库从 169 条增至 209 条：11 条 X 视频帖、29 个官方网站。分类：网站 79→109、交互 36→38、动效 29→31、品牌 13→14，产品界面不变（12）；插画 0→3、海报 0→2，这两个 tab 第一次出现。印刷仍是 0 条（见末尾）。

## 候选从哪来

1. **每周发现**：`website/scripts/run-x-discovery.sh` 在维护者已登录的 Ego Lite 里跑了一次（2026-11-13）：关键词搜索加 7 个关注账号，15 条合格、6 条新进收件箱，`lochieaxon` 本周没有。
2. **加搜**：为了补插画、海报、印刷、品牌，另搜了 6 组关键词（和上一批同类，但加了 `-tutorial -course -free -prompt` 排除教程和清单）和 15 个设计师账号（插画、字体、海报类）。账号名单是本次临时列的：10 个账号搜索页没有读出帖子（账号不存在、没有视频帖或超时），读出的 5 个是 @JamesJeanArt、@Kuvshinov_Ilya、@itsnicethat、@motionographer、@posterlad。共 59 条，去掉上一批已看过和已在库里的作者后 43 条。脚本仍是一次性的；规则与每周发现相同：只存链接和公开数据，人看过再写笔记。
3. **网站**：人工列了 70 个候选（开发者平台、AI、SaaS、知识工具、电商、工作室），每站在无头 Chrome 里以 1280×800 访问一次，存前三屏为一张图，分享预览（og 标签）从同一次加载里读。

## 怎么筛

- X 帖子：把每条视频流到本机临时目录，抽 6 帧拼成一张图，看图写笔记；没有完整播放。同一作者只收一条；转发他人视频、原作者不明的不收；资源清单、教程、新闻、AI 工具推销和粉丝转发的电影物料不收。发布方账号（Motionographer）按帖文署名设计者，与上一批 Rebrand Gallery 的做法相同。
- 网站：只看截图里的前三屏，没有交互，没有看手机。被拦截、没有分享预览、JS 没渲染出内容、整页弹窗或进入闸门盖住页面的、从本机被切到日文版的不收。
- 每条笔记写"看什么"和"用在哪"，中英文各一句。

## 收件箱 6 条的处理

| 帖子 | 处理 | 原因 |
|---|---|---|
| @abu_uiuxdesign 2120407931837690328 | 收录 `x-abu_uiuxdesign-690328`（动效） | 几十个 iOS 实时活动小组件成列滚动 |
| @nono_ai_archive 2120448953074286698 | 收录 `x-nono_ai_archive-286698`（网站） | 虚构生鲜店的网站；作者自述布局是自己的、交互由 Claude 生成，笔记里写明 |
| @jakubkrehel 2120574303687073874 | 不收 | 作者已在库里 |
| @BardhylBytyqi 2120284239245500777 | 不收 | 工具和模板清单 |
| @steveruizok 2120269681303134354 | 不收 | 代理工作流演示，画面是放在画布上的截图 |
| @mattgperry 2120522305424302136 | 不收 | 帧率教学，画面只有一个旋转的方块 |

处理结果写回了收件箱：`status` 改为 `published`（带 `entry`）或 `rejected`（带 `reason`），加 `reviewedAt`。加搜收下的 9 条也以 `published` 进了收件箱，`query` 字段记着来源查询；收件箱现在 37 条，没有 `pending`。

## 加搜 43 条的处理

收 9 条：铅笔肖像延时（@NahoGraphics，插画）、重画两年前的插画（@99kahoy，插画）、洋红双色延时（@Kuvshinov_Ilya，插画）、《饥饿游戏》海报过程（@JamesJeanArt，海报）、角度变色的印刷海报（@posterlad，海报）、被否掉的 Indent 识别（@ayushsoni_io，品牌）、调酒游戏的菜单（@SpecialS3241，交互）、做成地毯的官网首屏（@egorvert，交互）、食物森林动画（@motionographer 发布，设计者 Freek Freriks，动效）。

不收 34 条，按原因：

- 粉丝转发的电影动态海报 8 条（@Cine_Uncensored、@iamfreaksrk、@aaryan840、@Freak4Salman、@BeingSohail__、@Being_Nehu12、@ayaanpanda1、@TheSidMathur，同一部片）。
- 转发影片或他人作品、原作者不明 6 条（@CDReferences ×3 的动画片段、@0xrinx、@songsong、@threejs 官方账号的无文字视频）。
- 资源清单和 AI 工具推销 5 条（@okapi_fukugyo、@HeLi8866、@HorizonxSo、@MayaLeClarke、@bei351009016）。
- 广告帖 3 条（@itsnicethat ×3，均带 #ad）。
- 新闻、开箱、偶像周边 3 条（@eMTBrides、@yilingmoon、@H2H_NEWS）。
- 同一账号只收一条 7 条（@NahoGraphics 另 3 条、@Kuvshinov_Ilya 另 1 条、@JamesJeanArt 另 1 条、@posterlad 另 3 条中的 2 条……以帖文里最能看出过程的一条为准）。
- 游戏技能特效，不是界面 1 条（@KentiqDev）。
- 作者已在库里 5 条（@rebrandgallery ×3、@nickbakeddesign、@kevserctk、@MengTo）。

## 70 个网站候选的处理

收 29 个。不收的 41 个：

- 请求失败或被拦：vitra.com（403）、height.app（连接被关）。
- 没有分享预览图：replicate.com、studiodumbar.com、wolffolins.com、zen-browser.app、bureauborsche.com、studiofeixen.ch、andwalsh.com、arcteryx.com、on.com。
- 整页弹窗或进入闸门盖住页面：oatly.com、1password.com、polaroid.com、ganni.com、allbirds.com（选国家）、dovetail.com（产品公告弹窗）。
- 第二屏起没渲染出内容（懒加载或 WebGL）：daylightcomputer.com、screen.studio、raggededge.com。
- 从本机访问被切到日文版：bang-olufsen.com、hermanmiller.com。
- 首页是产品本身的工作台，不是落地页：perplexity.ai。
- 看过但没收（版式普通，或和已收的太像）：modal.com、astro.build、huggingface.co、bolt.new、loom.com、tailscale.com、gitbook.com、proton.me、retool.com、webflow.com、exoape.com（只有一屏）；写了笔记后为了把这批控制在 40 条去掉的：liquiddeath.com（本机访问到的是 en-jp 版）、fantasy.co、cohere.com、cleanshot.com、capacities.io、reflect.app。

## 没做到的，下一位读者要知道

- 视频没有完整播放，看的是 6 帧；网站只看前三屏截图，没有交互和手机视图。
- 插画、海报两类第一次有内容，各 3 条和 2 条，tab 会自动出现；印刷仍为空。设计师账号名单这次只对 5 个账号有效，其余 10 个要么账号名不对、要么近一个月没有视频帖；下次要先在浏览器里核对账号名再列进去，并给 `x-discovery.mjs` 加可配置的账号组（TODO 第 3 组）。
- 有几条 X 帖子的文字是日文、韩文或只有话题标签：`post.lang` 按原帖写（`ja`、`ko`），只有话题标签的写 `en`，没有文字的写 `zxx`。
- `link-preview.mjs` 从本机抓预览，本机出口在日本；若某站按地区切语言，预览标题可能不是英文。这批收的站里没有这种情况（切到日文的两站没收）。
- 全部仍是 `link-only`：只存链接、标题、我们的笔记和公开帖文，不存对方的图片或视频。
- 首页脚本的 gzip 体积：参考数据块从 44 KB（169 条）涨到 60 KB（209 条）：这批的笔记比前几批长，约每条 0.4 KB，而不是之前的 0.26 KB；灵感页的脚本块也因为多了 29 条预览记录从 33 KB 涨到 37 KB。首页脚本合计实测 173 KB，超过 160 KB 的上限，`tests/landing.spec.mjs` 的上限提到了 180 KB。这是第二次为内容批次提上限；再加 40 条就会超过。拆数据（TODO 第 6 组）要在下一批之前做，不是之后。
- Vercel 的 `images.remotePatterns` 仍封顶 50 个域名，已满；这批新站点的卡片都由卡片回退加载原图（多一次请求）。
- 本地预览里 neon.com、convex.dev、groq.com 三张卡片显示为无图的文字卡：它们的预览图由 Vercel 托管，对本机的请求一律回 403（`x-vercel-mitigated: challenge`，本机 IP 今天已被 Vercel 的自动防护盯上，见 `docs/research` 之外的运维记录），无头浏览器和 curl 都一样，所以无法从本机核实这三张图在别的访客那里是否正常；上线后换一个网络看一眼。
- `link-preview.mjs` 重抓全部网站时，locomotive.ca 这次没有返回分享预览（用浏览器 UA 再请求一次也没有 og 标签），按脚本的规则它存着的记录被去掉，卡片暂时没有缩略图；lovable.dev 和 aesop.com 返回 403，之前也没有记录，不变。
- 新条目的 `addedAt` 按"一条视频、三个网站"交错排列，首张卡是视频；这是排序用的收录时间，不是逐条的真实写入时刻。
- Ego Lite 提示有更新：这批是在 0.6.2.9 上跑的；维护者同日说「升级」后升到了 0.6.2.10（Chromium 不变，156.0.8078.74），`x-discovery.mjs` 用到的 `taskSpace`、`page.goto/waitForSelector/evaluate`、`task.finish` 在新版用法指南里都还在。
