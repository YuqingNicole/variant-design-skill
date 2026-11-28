# 精选网站图库的每周收录

从人工精选的网站图库收录网站（`website/content/site-discovery.json`）。只读图库公开的 RSS，不爬页面；图库条目只是线索，库里收的是网站本身，`via` 记下是哪个图库的哪一条。维护者 2026-11-22 决定：和 X、Threads 一样，每周的 PR 在 CI 通过后自动合并。

## 来源

| 图库 | 网站地址怎么来 | 说明 |
|---|---|---|
| One Page Love | 条目页上的“Visit / Launch Website”链接（优先选标签里带条目名的那个，去掉 `?ref=`） | 每天约 1 条，只取标题以 `Website Inspiration:` 开头的条目 |
| Minimal Gallery | 条目截图的文件名就是域名（`studioplato.co_.jpg` → `studioplato.co`）；这是推测，只有该网站自己的标题里含条目名才保留 | 每天约 2 条，页面和 RSS 都没有网站链接 |
| Mindsparkle Mag（2026-11-23 加） | 条目页的“Visit website”按钮；只取 `/website/` 下的条目（`/designs/` 是品牌项目）。按钮有时指向做网站的工作室而不是网站本身（OpenTrade → shoreditchdesign.com），所以域名和条目网址的 slug 对不上就丢弃（`confirm: "slug"`） | 编辑撰写的网站专题，每周约 2–3 条 |
| CSS Winner（2026-11-23 加） | 条目页标题里以条目名为文字的外链（`<h1><a href="https://m0r1m1ch1.com">MORIMICHI</a></h1>`） | 网页设计奖的提名和每日之选，每周约 6 条；RSS 是 ISO-8859-1 编码，按响应头的字符集解码；RSS 日期比页面上的晚几天 |

2026-11-23 又核对过、没有接入的：Awwwards（robots.txt 禁止 `/feed`）、Godly（已并入 recent.design，没有订阅源，`/websites` 页的数据是内部序列化格式，且 robots.txt 明确拒绝 Anthropic 的爬虫，不接）、Typewolf Site of the Day（RSS 可读，但最新一条是 2025-12，已停更；站点链接走 robots 禁止的 `/go/`）、Web Design Inspiration（RSS 可读，但混有文章和 SaaS/工具类条目，网站地址藏在 base64 属性里，不解码绕开）、Httpster（没有订阅源，首页最新日期是 2023 年）、Brutalist Websites（没有订阅源，条目多是 2016–2018 年）、Hoverstates（没有订阅源）、CSS Design Awards（502）、SiteSee（订阅源跳到 robots 禁止的 `/api`）、Maxibestof、Land-book、Lapa Ninja（仍然 403）、SiteInspire（条目页仍然 403）。

2026-11-22 核对过、没有接入的：SiteInspire（RSS 可读，但条目页对自动请求返回 403，RSS 里没有网站地址）、Awwwards、Land-book、Lapa Ninja、CodePen、Are.na、Bluesky（自动请求 403 或没有订阅源）、Httpster、It's Nice That（订阅源 404）、Product Hunt 和 Hacker News Show HN（能读，但多是 SaaS 新品和代码仓库，筛选成本高）。拒绝自动访问的站点不绕开。Vimeo Staff Picks 的 RSS 可读、内容适合视频分区，但网站还没有 Vimeo 播放器，留到下一步。

## 流程

- `node website/scripts/site-discovery.mjs [--sources a,b|all] [--days n] [--dry-run]`：读各图库最近 `days` 天的条目，解析出网站地址；库里已有的站点（按域名）、收件箱里已有的条目和本次已从别的图库收到的同一站点跳过；每个图库每次最多加 `max` 个（现在都是 3）。写进 `website/content/site-inbox.json` 时各图库轮流排（每个图库第一条，再每个图库第二条……），状态 `pending`。筛选按收件箱顺序取前 `--limit` 条，所以一周不会被一个图库占满（2026-11-22 那次 10 条全来自 One Page Love）。
- `node website/scripts/threads-publish.mjs --inbox website/content/site-inbox.json [--limit n] [--dry-run]`：和 Threads 同一套筛选。打开网站一次（无界面 Chrome，1280×800，前三屏一张图，截法见下面“截图”），读分享预览，交给模型（`claude -p`）按素材识别标准打分（设计六维、一票否决，`docs/benchmark.md`），代码算加权分定收、待审或拒，收的写中英文笔记；提示词写明“图库收录只是线索，不代表质量”，拿不准的维度往低打。待审的不上线，留在收件箱（`review`），PR 描述最后一节一条一行，维护者回“收”或“拒”后用 `node website/scripts/review-queue.mjs accept|reject <id>` 处理。分数和理由存在收件箱那一行的 `screening` 里。读不到的留在 `pending`。
- `website/scripts/run-sites-weekly.sh [--sources a,b|all] [--limit n]`：整条流程，开 `codex/sites-weekly-<日期>` 的 PR，CI 通过后自动合并（`merge-weekly-pr.sh`，失败重跑一次，仍失败就留给人）。不需要账号或 API 密钥。
- 跳过一次运行（`website/scripts/weekly-guard.mjs`，X 和 Threads 的周任务也用）：上一个 `codex/sites-weekly-*` PR 还开着就不跑（#347 和没合并的 #342 有 8 条重复）；内存不够（压力等级到 critical、空闲内存低于 10%，或 swap 超过 12 GB）就每 10 分钟再看一次，三次都不够就不跑（#347 那次 swap 约 28 GB，10 条全是 Chrome 起不来）；筛完后一条都没定下来，或一半以上留在 `pending`，就不开 PR，候选留到下一次。每种情况日志里有一行原因，不推分支、不开 PR。

## 截图（`website/scripts/site-capture.mjs`，2026-11-23 改）

以前用 Chrome 的 `--screenshot` 一次截 1280×2400 的窗口。窗口本身就有 2400px 高，`100vh` 的首屏会撑满整张图，看起来像只有一屏（#314 里的 Sunstill、Hoy、Wowww、Studio Plato）；页面也从没滚动过，滚动触发的出现动画和懒加载图片不会执行，留下大片空白（Soma、LouieLouie）。现在窗口是真实的 1280×800：加载后等网络空闲、字体和首屏图片就绪，再等 2.5 秒让入场动画跑完，截第一屏；然后用鼠标滚轮往下滚一屏（滚轮输入能带动平滑滚动库和页面内部的滚动容器，`window.scrollTo` 不能），等 1.2 秒和这一屏的请求，截第二屏，第三屏同样。三张图在同一个 Chrome 里上下拼起来，中间隔一条 8px 的灰线，所以整张图是 1280×2416。页面滚不动时后面几屏会和上一屏一样，提示词里告诉了模型这一点。每个网站一般 10–30 秒，最多 75 秒，超时留在 `pending`。

2026-11-23 用 #314 的 10 个网站对比新旧截图（`--dry-run` 等价的调用，没有写入，提示词的收拒标准没改）：旧截图收 4 拒 6（Soma 这次被收，#314 里被拒，说明模型判断本身有波动）；新截图收 8 拒 2。新收的 Hoy、Wowww、Studio Plato、LouieLouie 在旧截图里都是一屏撑满或空白。仍被拒的：Damián Panes 没有分享预览图（不涉及截图）；Sunstill 页面确实不滚动，三屏重复，按“只有一屏内容”拒，这是标准问题，不是截图问题。

2026-11-28 补了两处（#356 里被误拒的站）：

- WebGL：无界面 Chrome 关了 GPU 就完全没有 WebGL，WebGL 站只剩黑屏或脚本报错（A DAY 显示 `Cannot read properties of null (reading 'getSupportedExtensions')`，MORIMICHI 三屏全黑）。现在启动时加 `--use-angle=swiftshader --enable-unsafe-swiftshader`，用 CPU 软件渲染 WebGL（Chrome 137 起要显式打开）。第一屏有占窗口四分之一以上的 canvas 时，每 0.5 秒截一张缩略图，等到不再是一整片纯色再截，最多 12 秒，算在 75 秒预算里。SwiftShader 吃 CPU，截图仍是一次一个。
- 入口页：整屏的“Enter with sound / Without”“Skip intro”“Explore”之类入口会挡住每一屏（Rinat Seif）。截第一屏前找这样的按钮：文字只有入口词，在一个盖住整个窗口的 fixed/absolute 层里（或页面还滚不动），周围可点的东西不超过 8 个，不指向别的页面；优先点静音或不带声音的选项，用真实鼠标点一次，再等入场时间。提示词会告诉模型点了哪个按钮。收拒标准没改。

同日对比（同样的调用方式，没有写入）：Rinat Seif 旧图三屏都是入口页，新图点了“WITHOUT”后是完整作品集，模型收；MORIMICHI 旧图全黑，新图点了“ENTER”，是 3D 显示器和蓝屏多语言问候，收；Study Hall 旧图首屏只有字标、第二屏空白（主视觉是 canvas，没画出来），新图首屏是滑雪照片拼贴，收；A DAY 旧图是 WebGL 报错，新图 WebGL 能画了，但 75 秒内页面还停在加载计数（28→40），模型按“没渲染出来”拒，这个站在预算内加载不完，没再放宽。SLOWRAT、Manna 两个普通站新旧截图一样，仍收；普通站没有触发入口点击。

请求带 `VariantDesignDiscovery/1.0` 的 User-Agent 和隐私页地址。

## 试跑（2026-11-22）

两个图库最近 14 天：One Page Love 8 条全部解析到网站；Minimal Gallery 8 条里 6 条推测的域名通过标题核对，1 条对不上被丢弃，1 条超时。筛选试跑 3 条（`--dry-run`，没有写入）：收 1 条（Sunstill），拒 2 条（没有分享预览图；三屏大部分空白、主视觉没渲染）。

## 试跑（2026-11-23，四个图库，`--dry-run`，没有写入）

加入 10 条：One Page Love 2、Minimal Gallery 2、Mindsparkle Mag 3、CSS Winner 3。One Page Love 和 Minimal Gallery 其余条目都已在收件箱；CSS Winner 有 1 条超过每次 3 个的上限；Minimal Gallery 1 条、Mindsparkle 1 条（OpenTrade，按钮指向工作室）没有网站地址。没有跑筛选。

## 尚未做

- 定时：维护者 2026-11-22 说先不装定时任务，现在手动运行 `run-sites-weekly.sh`。
- 模型只看静态截图，写不出交互和动效，也没在手机上看过。
- Minimal Gallery 依赖截图文件名的命名习惯，图库改命名后会全部变成“没有网站地址”，报告里能看到。
