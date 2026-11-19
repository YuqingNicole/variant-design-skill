# YouTube 发现与上线

每周一次，通过 **YouTube Data API v3**（官方接口）按设计关键词搜索公开视频，筛选后进入视频 tab。不抓取 youtube.com 页面，不下载视频。

## 一次性准备（需要维护者）

1. 在 Google Cloud 新建项目，启用 **YouTube Data API v3**，创建一个 API 密钥，限制为只能调用这个 API。
2. 保存到本机（不进仓库，权限 600）：`node website/scripts/youtube-discovery.mjs --save-key < key.txt`，写入 `~/.config/variant-design/youtube.json`。也可以用环境变量 `YOUTUBE_API_KEY`。
3. 免费额度每天 10,000 单位，一次搜索 100 单位；默认每周一组 4 次搜索，不到一天额度的 5%。

## 流程

- `node website/scripts/youtube-discovery.mjs [--groups a,b|all] [--days n]`：按 `website/content/youtube-discovery.json` 的关键词组搜索（只要可嵌入、4 分钟内、观看数达到门槛的视频），写入 `website/content/youtube-video-inbox.json`。`--plan` 只列出会做的搜索，不联网。
- `node website/scripts/youtube-publish.mjs [--limit n] [--dry-run]`：逐条筛选。先挡掉库里已有的视频、同一频道已在库里的、YouTube 不允许嵌入的；再取 YouTube 公开缩略图（封面 + 视频中段三帧）拼成一张图，交给模型（`claude -p`，只许读这张图）收或不收，收的写双语笔记。能读不到的候选留在 `pending`。
- `node website/scripts/youtube-publish.mjs --url <watch 地址> [--dry-run]`：不用 API 密钥，筛一条指定的视频（用 oEmbed 取标题和频道，没有时长和发布日期）。
- `website/scripts/run-youtube-weekly.sh`：整条流程，开一个 `codex/youtube-weekly-<日期>` 的 PR，CI 通过后自合并（见 `merge-weekly-pr.sh`）。

## 展示与隐私

卡片用 YouTube 自己的缩略图（`i.ytimg.com`）；播放器是 `youtube-nocookie.com` 的 iframe，点击播放后才加载。隐私页写明了保存哪些信息和加载哪些外部内容。

## 尚未验证

- 搜索从未用真实密钥跑过，关键词组、观看数门槛和 4 分钟上限都是初值。
- 模型只看到封面和三张 120×90 的小帧，写不出动效的节奏；笔记写的是画面里有什么。
- 没有在手机和 Safari 上看过卡片和播放器。
