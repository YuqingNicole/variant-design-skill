# 精选网站图库的每周收录

从人工精选的网站图库收录网站（`website/content/site-discovery.json`）。只读图库公开的 RSS，不爬页面；图库条目只是线索，库里收的是网站本身，`via` 记下是哪个图库的哪一条。维护者 2026-11-22 决定：和 X、Threads 一样，每周的 PR 在 CI 通过后自动合并。

## 来源

| 图库 | 网站地址怎么来 | 说明 |
|---|---|---|
| One Page Love | 条目页上的“Visit / Launch Website”链接（优先选标签里带条目名的那个，去掉 `?ref=`） | 每天约 1 条，只取标题以 `Website Inspiration:` 开头的条目 |
| Minimal Gallery | 条目截图的文件名就是域名（`studioplato.co_.jpg` → `studioplato.co`）；这是推测，只有该网站自己的标题里含条目名才保留 | 每天约 2 条，页面和 RSS 都没有网站链接 |

2026-11-22 核对过、没有接入的：SiteInspire（RSS 可读，但条目页对自动请求返回 403，RSS 里没有网站地址）、Awwwards、Land-book、Lapa Ninja、CodePen、Are.na、Bluesky（自动请求 403 或没有订阅源）、Httpster、It's Nice That（订阅源 404）、Product Hunt 和 Hacker News Show HN（能读，但多是 SaaS 新品和代码仓库，筛选成本高）。拒绝自动访问的站点不绕开。Vimeo Staff Picks 的 RSS 可读、内容适合视频分区，但网站还没有 Vimeo 播放器，留到下一步。

## 流程

- `node website/scripts/site-discovery.mjs [--sources a,b|all] [--days n] [--dry-run]`：读各图库最近 `days` 天、最多 `max` 条，解析出网站地址；库里已有的站点（按域名）和收件箱里已有的条目跳过；写进 `website/content/site-inbox.json`，状态 `pending`。
- `node website/scripts/threads-publish.mjs --inbox website/content/site-inbox.json [--limit n] [--dry-run]`：和 Threads 同一套筛选。打开网站一次（无界面 Chrome，1280×800，前三屏一张图），读分享预览，交给模型（`claude -p`）收或拒，收的写中英文笔记；提示词写明“图库收录只是线索，不代表质量”，拿不准就拒。读不到的留在 `pending`。
- `website/scripts/run-sites-weekly.sh [--sources a,b|all] [--limit n]`：整条流程，开 `codex/sites-weekly-<日期>` 的 PR，CI 通过后自动合并（`merge-weekly-pr.sh`，失败重跑一次，仍失败就留给人）。不需要账号或 API 密钥。

请求带 `VariantDesignDiscovery/1.0` 的 User-Agent 和隐私页地址。

## 试跑（2026-11-22）

两个图库最近 14 天：One Page Love 8 条全部解析到网站；Minimal Gallery 8 条里 6 条推测的域名通过标题核对，1 条对不上被丢弃，1 条超时。筛选试跑 3 条（`--dry-run`，没有写入）：收 1 条（Sunstill），拒 2 条（没有分享预览图；三屏大部分空白、主视觉没渲染）。

## 尚未做

- 定时：维护者 2026-11-22 说先不装定时任务，现在手动运行 `run-sites-weekly.sh`。
- 模型只看静态截图，写不出交互和动效，也没在手机上看过。
- Minimal Gallery 依赖截图文件名的命名习惯，图库改命名后会全部变成“没有网站地址”，报告里能看到。
