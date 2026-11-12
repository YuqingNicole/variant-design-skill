# 灵感库第四批新增（2026-11-12）

灵感库从 129 条增至 169 条：11 条 X 视频帖、29 个官方网站。分类：网站 46→79、交互 34→36、动效 27→29、品牌 10→13，产品界面不变（12）。插画、海报、印刷仍是 0 条（见末尾）。

## 候选从哪来

1. **收件箱**：`website/content/x-post-inbox.json` 里 2026-11-11 每周发现留下的 14 条 `pending`。
2. **一次性的关键词加搜**：每周发现只搜 `(design OR UI OR interaction OR motion)`，这次为了补插画、海报、印刷、品牌，在维护者已登录的 Ego Lite 里另搜了 6 组关键词（illustration / poster, typography / print, packaging / branding / motion design / webgl, web design），范围 2026-11-02 起、至少 150 赞、每组读前三屏，共 51 条，50 条是新作者。脚本是一次性的，没有并入仓库；规则与每周发现相同：只存链接和公开数据，人看过再写笔记。
3. **网站**：人工列了 50 个候选（SaaS、AI、电商、工作室、开发者工具），每站在无头 Chrome 里以 1280×800 访问一次，存前三屏为一张图，分享预览（og 标签）从同一次加载里读，不另发请求。

## 怎么筛

- X 帖子：把每条视频流到本机临时目录，抽 6 帧拼成一张图，看图写笔记；没有完整播放。同一作者只收一条；转发他人视频、原作者不明的不收；资源清单、教程录屏、新闻和 AI 工具推销帖不收。
- 网站：只看截图里的前三屏，没有交互、没有滚动到底、没有看手机。被拦截、没有分享预览、JS 没渲染出内容、只有进入闸门或弹窗盖住页面的不收。
- 每条笔记写"看什么"和"用在哪"，中英文各一句。

## 收件箱 14 条的处理

| 帖子 | 处理 | 原因 |
|---|---|---|
| @jakubkrehel 2118030760800379386（图表） | 收录 `x-jakubkrehel-379386` | 悬停提示、系列筛选、占比汇总 |
| @raunofreiberg 2119856840003797178 | 收录 `x-raunofreiberg-797178` | devouringdetails.com/mantras 的字体化页面 |
| @elayadesigns 2114049200749175174 | 收录 `x-elayadesigns-175174` | 六个插画首屏；作者自述图像由 AI 生成，笔记里写明 |
| @Ibelick 2118015141564260594 | 不收 | 技能发布，视频是文字页面 |
| @jh3yy ×2、@RaminNasibov、@Jakubantalik | 不收 | 作者已在库里 |
| @jakubkrehel ×2（Loading、Interfaces） | 不收 | 同一作者本批只收一条 |
| @neropursue、@himanshubuildss | 不收 | 资源清单 |
| @dominikmartn 2120154832694858224 | 不收 | 模型输出拼贴，没有产品语境 |
| @sundyme 2115106690836435400 | 不收 | 转发视频，原作者无法确认 |

处理结果写回了收件箱：`status` 从 `pending` 改为 `published`（带 `entry`）或 `rejected`（带 `reason`），并加 `reviewedAt`。加搜收下的 8 条也以 `published` 进了收件箱，`query` 字段记着来源查询。

## 加搜 50 条的处理

收 8 条：Onest 识别（@rebrandgallery 发布，设计方 BR*Studio 按帖文署名）、Kyron 识别（@sajon_co）、Coronal 品牌探索（@praveenisomer）、Bane 实验室概念页（@stackedlol）、重做的交互合辑（@kirtanlb）、动态字体漩涡（@abduzeedo，Fabio Sasso）、three.js 公寓（@MengTo）、提示词生成的功能区块（@kevserctk）。

不收 42 条，按原因：

- AI 工具清单和"一个提示词替代工作室"类推销帖 15 条（@Y0urDumble ×2、@renproton ×2、@0xnicc0、@X1Kafadzhy、@dyfwsammy、@seeconvm、@HeLi8866、@viktoroddy、@MaybeFlorent、@neropursue、@fuckscales、@CamtoIke、@genue）。
- 软件教程录屏 6 条（@ducthangds ×5 的 Illustrator 海报教程、@Savannah_Gray32）。
- 与设计无关的新闻和科普 6 条（@XFreeze、@supriyasahuias、@ChinaNow24、@Rainmaker1973、@guilleflorvs、@lennysan）。
- 引用或转发他人视频 4 条（@marcelkargul、@me____likex、@szpakat、@heizolshao）。
- 同一账号只收一条 6 条（@rebrandgallery 另 4 条、@MengTo 另 1 条、@praveenisomer 另 1 条）。
- 企业账号、AI 广告或产品演示 5 条（@creativecloud、@clockmaker、@theodorsan、@AiwithAlyar、@manishkumar_dev）。

## 50 个网站候选的处理

收 29 个。不收的 21 个：

- 请求失败或被拦：gretel.tv（证书）、manvsmachine.com（域名不解析）、frame.work（408）、jacquemus.com（403）。
- 没有分享预览图：byredo.com、work.co、order.design。
- 无头浏览器里没渲染出内容（WebGL 或加载态）：activetheory.net、lusion.co、obys.agency、hellomonday.com、portorocha.com、14islands.com。
- 只有进入闸门或整页弹窗：unseen.co、eightsleep.com、studio.build、oddfellows.tv。
- 从本机访问被切到日文版：stripe.com、loewe.com（本机出口在日本，预览标题会是日文）。
- 内容性质：arc.net 是停运告别信，不作参考。
- krea.ai 在浏览器里有分享预览，但 `link-preview.mjs` 的普通请求拿不到，卡片会没有图，换成了 devouringdetails.com（Rauno Freiberg 的手册站；他的 X 帖子收的是另一页 /mantras）。

## 没做到的，下一位读者要知道

- 视频没有完整播放，看的是 6 帧；网站只看前三屏截图，没有交互和手机视图。
- Koto 的首屏影片在截图里没加载出来，笔记按可见结构写。
- `link-preview.mjs` 从本机抓预览，本机出口在日本；若某站按地区切语言，预览标题可能不是英文，上线前在预览页核一眼。
- 插画、海报、印刷三类这次仍为空：关键词加搜返回的几乎都是教程录屏和 AI 工具清单，没有可收的作品帖。下次要么换数据源（设计师账号名单），要么接受这三类暂时没有 tab。
- 加搜脚本是临时的；如果要常态化，应给 `x-discovery.mjs` 加可配置的查询，并在周报里分开统计。
- 全部仍是 `link-only`：只存链接、标题、我们的笔记和公开帖文，不存对方的图片或视频。
- 首页脚本的 gzip 体积从 145 KB 以内涨到 152.6 KB，因为参考数据整体在首页脚本里；`tests/landing.spec.mjs` 的上限提到了 160 KB，拆数据的事记在 TODO 第 6 组。
- 新条目的 `addedAt` 按"一条视频、三个网站"交错排列，让时间流的第一张卡是视频、两类内容混在一起；这是排序用的收录时间，不是逐条的真实写入时刻。
