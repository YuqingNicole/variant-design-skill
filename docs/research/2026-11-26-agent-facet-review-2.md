# 代理核对参考属性，第二轮（2026-11-26）

维护者 2026-11-26 让代理“继续分类完善”。第一轮（2026-11-22，`2026-11-22-agent-facet-review.md`）只核对了 11 个合集涉及的条目，剩下 138 条初稿。这一轮把这 138 条按同样的办法过了一遍，写成 `reviewedBy: "agent"`，日期 2026-11-26。

## 证据（都在本机草稿目录，没有提交）

- 网站（42 条，含 5 篇帮助文档）：Playwright 用本机 Chrome（1440×900）打开，截首屏，滚动一遍后截整页缩略图（最高 9000px，缩到 0.3 倍）。整页缩略图对 `100vh` 首屏的网站不准（视口被拉高，首屏占满整张图），所以另用 `scripts/site-capture.mjs` 逐屏截了 7 屏。后者在 lovable、aesop 等站被 Cloudflare 人机验证拦住，这些站只用 Playwright 的截图。
- X 视频（95 条）：用 `x-media.json` 里的视频地址下载，ffmpeg 等距抽 6 帧拼成 3×2 的图。YouTube（1 条）：yt-dlp 下最低清晰度，抽 9 帧。
- 全部 138 条都取到了证据。

和第一轮不同，这次是我自己逐条看图，没有交给子代理。

## 核对规则

和第一轮相同：证据里看得到才保留；证据里明显而重要的值可以补上（每项最多 3 个）；静态图看不出来的（悬停、转场、WebGL、着色器）只有帖子原文写明才保留；看不清就不写，或整条标“无法核对”、保持初稿。行业只在作品本身或帖子说明了公司做什么时才填。

## 结果

- **136 条写成 `reviewed`**，其中 125 条至少有一个属性和初稿不同。改得最多的是风格（118 条）、组件（47）、页面模式（37）、技法（22）、行业（12）、作品类型（11）、页面类型（7）。风格改得多，主要是初稿规则不许凭印象填风格，空着的很多，这次按截图补上了。
- **2 条无法核对，保持初稿：**
  - nothing：两种截图里，页面都被“你在日本，要不要去日本站”的地区弹窗挡住，只看得到深色 Black Friday 首屏的边。
  - lemonsqueezy：首页仍是停服公告（紫色首屏和常见问题），笔记描述的页面已经没有了。和第一轮一样，留给【维护者】决定要不要下架。
- 这 138 条里没有 Jev 起草的（`draftedBy: "jev"` 为 0），所以这轮不涉及对 Jev 判断的复核。

### 初稿常见的错

1. **作品类型**：没写平台的界面视频被当成网站。改了 11 条，例如手机样机里的应用（samdape、emilkowalski → `mobile-app`）、编辑器里的效果（abduzeedo → `web-app`）、macOS 窗口里的应用（jsngr → `desktop-app`）、实时三维场景（xrarchitect、areadnemaria → `3d`）。反过来，shuding 的“界面微积分”是一篇带图表的文章，不是仪表盘（`web-app`/`dashboard` → `website`）。
2. **网站改版**：好几个网站和笔记对不上了，按现在看到的写：amie 首屏现在讲 AI 代理；pitch 首屏是输入框加淡化的幻灯片缩略图（加了 `prompt-hero`）；harry-atkins 的作品索引现在是缩略图网格，不是表格（`list` → `card`、加 `case-grid`）；rapha 首屏是合作影片（加 `video-hero`）；oura、remarkable、bellroy、fellow、magicspoon 首屏都换成了 Black Friday 促销。
3. **漏掉看得见的模式**：标志墙（fallengrey、framer、jitter 等）、用户评价（pitch、plausible、basecamp、readwise）、便当格（cal-com、obsidian、linear-features）、分标签讲功能（wiki、superhuman、shlok776）。
4. **行业**：raunofreiberg 的一页格言没有产品，去掉了 `education`；kyleanthony 的 Particle 首页写着“Inference for developers”，补 `ai`；shedsgns 的银行卡材质拆解补 `fintech`。

### 没能确定的值（写进了记录，按“看不到就不写”处理）

- lovable：整页缩略图里首屏以下没有渲染，模板库看不到，去掉了 `template-gallery`，只留输入框首屏。第一轮因为人机验证没核对，这次 Playwright 进去了。
- gregor-collienne：两种截图里照片都没加载（只有文件名），`photographic` 无法确认，去掉了。
- cathy-dolle：中间的图片条没有渲染，只确认了编号名单。
- graza：两次截图的首屏画面不同（轮播或影片），静态图分不出来，没有给 `video-hero`。
- hellohex：视频只有开场拼贴，网站其余部分看不到。
- nothing-to-watch：只看得到选设备档位的入口页，后面的网站没截到。
- jakubantalik：帖子说页面会对磁铁做出反应，抽帧里看不出。
- tanglele0318：旋转和平移按钮太小，WebGL 和拖拽都去掉了。
- quantapar、mengto、akella、xrarchitect、r4nm4_64、mschwaibold：WebGL、three.js、着色器、程序生成只在帖子原文写明时保留；quantapar 的帖子没写，换成了看得到的拖动刻度尺。
- kraigdesigns：画面写着“AI security”，但词表没有安全行业，行业留空。
- magalyn07：粘土定格动画，没有合适的风格值，风格留空。

## 合集

核对后，正式站门槛（已核对 ≥ 6 条）下原有 11 个合集全部仍然达标：dark-websites 25、developer-tool-websites 30、ai-product-websites 18（lovable 核对后不再有初稿）、fintech-design 11（另有 lemonsqueezy 1 条初稿不显示）、design-studio-websites 14、product-ui-hero 33、tabbed-feature-sections 23、testimonial-sections 41、micro-interactions 20、grain-texture 23、illustrated-design 40。

新加 8 个合集（`website/src/collections.ts`），都已达到门槛：

| 合集 | 条件 | 已核对 |
|---|---|---|
| productivity-websites 协作与效率工具网站 | 行业 productivity + 网站，网页分区 | 22 |
| mobile-app-interfaces 移动应用界面 | 作品类型 mobile-app | 13 |
| brand-identity-design 品牌识别 | 作品类型 brand-identity | 15 |
| bento-grid-layouts 便当格布局 | 模式 bento-grid | 10 |
| big-type-layouts 大字号排版 | 模式 editorial-type | 19 |
| documentation-pages 文档与帮助页 | 页面类型 docs | 6 |
| gesture-interactions 拖拽与手势 | 技法 drag-gesture | 11 |
| playful-design 俏皮风格 | 风格 playful | 26 |

中英导语是代理写的，没人审过；英文按 RFC-005 §3.5 标成草稿，正式站不出英文合集页。`VERCEL_ENV=production` 构建核对过：19 个中文合集页全部公开（0 个只在预览可见），英文 19 个合集页加 `/collections` 列为草稿。

合集变多以后，手机上频道条里当前合集常在屏幕外。`CollectionPage.tsx` 现在载入时把当前频道横向滚到条里（页面本身不动），Playwright 加了一条回归测试。

### 还缺的

- **首页以外的页面类型仍然很薄**：已核对的 homepage 130 条；docs 6 条（刚好达到门槛，正好撑起文档页合集）、editor 6 条；product-page 5、onboarding 2、chat 2、auth 2，changelog、case-index、case-study、product-detail、about、dashboard 各 1；pricing、store、blog、search、settings 一条都没有。定价页、商品详情页、设置页这类合集还是要靠新收录，补标签补不出来。
- 达到门槛但这次没开合集的值：metrics 18、case-grid 12、rendered-3d 19、gradient 21、photographic 22、monochrome 16、morph 12、kinetic-type 8、design-tools 10、logo 组件 22、motion-graphics 24 等。是否开、开哪些，等这一批的收录数据再定，不要一次开太多。
- 还有 40 条已发布参考没有属性记录（周任务新收的，包括 x-uisabor 的 20 张轮播图），不在这次范围里。

## 词表检查（只提建议，这次没改词表）

1. **从没用过的值**（已核对和初稿都是 0）：作品类型 `wearable`；页面类型 `pricing`、`store`、`blog`、`search`、`settings`；风格 `brutalist`。页面类型是缺收录，不是词表错；`wearable` 和 `brutalist` 可以留着等收录，也可以删。
2. **容易混的近义值**：组件 `loader` 和技法 `loading-state`（已核对的 2 条 `loader` 都同时带 `loading-state`）；组件 `logo`（品牌标志本身）和模式 `logo-wall`（客户标志墙），中文名能分开，英文 Logo 和 Logo wall 也能分开，但打标时容易混；页面类型 `product-page`（SaaS 产品介绍）和 `product-detail`（电商单品）；页面类型 `case-index` 和模式 `case-grid`/`filterable-index`；组件 `text`、技法 `kinetic-type`、模式 `editorial-type` 三者都和“字”有关。建议在 `reference-facets.ts` 每个值旁加一句用法说明，而不是合并。
3. **装不进任何值的作品**：首页里的定价表（plausible、arena 都有，但 `pricing` 是页面类型，首页里的定价区块没有模式值，可加模式 `pricing-table`）；页脚（imharshin 的墨水页脚）；手作和定格（magalyn07、jammyjanmo、sicknire，风格里没有 `handmade`/`craft`，虽然视频分区有“定格与手作”）；字体发布（evilrabbit 的 Geist Serif，作品类型里没有 `typeface`）；安全行业（kraigdesigns）。
4. 这次只核对和补值，没有改词表：新增一个值（比如 `pricing-table`）要把 274 条已核对的参考都重新看一遍有没有这个值，否则合集会漏；删除值要改现有记录。两者都不算“小而明显安全”的改动，留给【维护者】决定。
