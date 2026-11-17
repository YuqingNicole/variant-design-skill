# Threads 灵感发现：配置与边界

每周用 Meta 官方的 Threads API 按关键词搜一次公开帖子，把链接写进 `website/content/threads-post-inbox.json`，由人筛选后再写成灵感条目。做法和 X 的每周发现一样（`TODO.md` → X 设计样本收集箱），区别是 Threads 走官方接口，不在浏览器里读页面。

- **代码**：`website/scripts/threads-discovery.mjs`；测试 `website/scripts/threads-discovery.test.mjs`。
- **搜什么**：`website/content/threads-discovery.json`。每组有 `id`、时间窗口 `days`、`queries`；每条查询有关键词 `q`，可选 `mode`（`KEYWORD` 或 `TAG`，后者搜话题标签）、`mediaType`（`TEXT`、`IMAGE`、`VIDEO`）、`author`（只搜某个账号，不带 @）。标了 `weekly` 的组每周跑。
- **为什么用官方接口**：Threads 的条款不允许自动抓取页面，AGENTS.md 也不允许。

## 边界

- **候选不是条目**：收件箱只放帖子链接、作者、发帖时间、帖子附带的网址和前 280 个字。要先打开原帖和它指向的网站，写好中英文研究笔记，才能加进灵感页。
- **收录的是网站**：帖子是发现渠道。条目指向原网站，可以注明“发现于 @某某 的 Threads”。
- **不搬帖子里的图和视频**：按 RFC-008，只用链接、官方嵌入，或作者授权的素材。
- **已经收过的网站会标出来**：帖子附带的网址如果已经在 `website/src/inspiration-data.ts` 里，候选带 `inLibrary`（条目 id）。
- **每条都要处理**：和 X 收件箱一样，处理完把 `status` 改成 `published`（带 `entry`）或 `rejected`（带 `reason`），并写 `reviewedAt`。

## 接口的限制

- **没有点赞数**：搜索结果不返回点赞数，所以不能像 X 那样设点赞下限，每条查询都要 Threads 的“热门”（`TOP`）结果。
- **审核前只能搜到自己的帖子**：`threads_keyword_search` 权限没被 Meta 批准时，搜索只返回授权账号自己发的帖子。这时跑脚本不会报错，多数查询是空的。
- **限额**：每个账号每 24 小时 2,200 次查询（所有应用合计）。每周一次、每次几条查询，远低于限额。
- **出错就停**：任何接口错误都会停止运行，收件箱不变；查询没有结果是正常的，只在输出里计数。

## 维护者要做的配置（一次）

1. **建应用**：在 [Meta for Developers](https://developers.facebook.com/apps/) 新建应用，用途选 “Access the Threads API”。
2. **加权限**：在应用的 Threads 用途里加 `threads_basic` 和 `threads_keyword_search`。
3. **加测试账号**：在 App roles → Roles 里把自己的 Threads 账号加为 Threads Tester，然后在 Threads 的 设置 → 账号 → 网站权限 里接受邀请。
4. **生成凭据**：在应用的 Threads 设置里用 User Token Generator 给自己的账号生成一个访问凭据。如果拿到的是 1 小时的短期凭据，在**自己的终端**里换成 60 天的长期凭据（应用密钥不要贴到聊天里）：
   ```sh
   curl -s "https://graph.threads.com/access_token?grant_type=th_exchange_token&client_secret=$THREADS_APP_SECRET&access_token=$SHORT_TOKEN"
   ```
5. **存凭据**：把长期凭据复制到剪贴板，在仓库根目录运行：
   ```sh
   pbpaste | node website/scripts/threads-discovery.mjs --save-token
   ```
   凭据存在 `~/.config/variant-design/threads.json`（只有自己可读），不进仓库。`THREADS_ACCESS_TOKEN` 环境变量可以临时覆盖它。
6. **申请审核**：在 App Review 里为 `threads_keyword_search` 提交审核。隐私政策网址可以填 `https://variantdesign.xyz/privacy`；用途写“每周按设计相关关键词搜索公开帖子，供编辑人工挑选值得收录的网站，只保存帖子链接和摘要”。批准前脚本只能搜到自己的帖子。

## 运行

```sh
node website/scripts/threads-discovery.mjs                    # 跑标了 weekly 的组
node website/scripts/threads-discovery.mjs --groups zh,weekly # 跑指定的组，或 --groups all
node website/scripts/threads-discovery.mjs --days 14          # 临时改时间窗口
node website/scripts/threads-discovery.mjs --plan --groups all # 不连网，只列出会搜什么
```

- **凭据会自动续期**：长期凭据 60 天过期。脚本发现凭据存了超过 6 天，就先续期再搜，所以只要每周在跑，凭据就不会过期。停了超过 60 天，就要回到第 4 步重新生成。
- **定时**：加到每周一和 X 发现一起跑；不需要浏览器，普通的 Node 22 就行。

## 尚未验证

- 脚本只用假的接口响应测过，还没有用真凭据调过 Threads API。第一次真跑时要核对：返回字段和 `media_type` 的取值是否和文档一致，`link_attachment_url` 有没有值。
- 审核没批之前，看不出这些关键词在公开帖子里能搜出多少有用的候选；批下来后第一周要人工看一遍，再调整 `threads-discovery.json`。
