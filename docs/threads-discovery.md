# Threads 灵感发现：配置与边界

每周用 Meta 官方的 Threads API 按关键词搜一次公开帖子，把链接写进 `website/content/threads-post-inbox.json`，由人筛选后再写成灵感条目。做法和 X 的每周发现一样（`TODO.md` → X 设计样本收集箱），区别是 Threads 走官方接口，不在浏览器里读页面。

- **代码**：`website/scripts/threads-discovery.mjs`；测试 `website/scripts/threads-discovery.test.mjs`。
- **搜什么**：`website/content/threads-discovery.json`。每组有 `id`、时间窗口 `days`、`queries`；每条查询有关键词 `q`，可选 `mode`（`KEYWORD` 或 `TAG`，后者搜话题标签）、`mediaType`（`TEXT`、`IMAGE`、`VIDEO`）、`author`（只搜某个账号，不带 @）。标了 `weekly` 的组每周跑。
- **为什么用官方接口**：Threads 的条款不允许自动抓取页面，AGENTS.md 也不允许。

## 边界

- **候选不是条目**：收件箱只放帖子链接、作者、发帖时间、帖子附带的网址和前 280 个字。`threads-publish.mjs` 会打开帖子指向的网站，由模型读截图写中英文笔记，CI 通过后自动上线，没有人逐条看过。上线后发现不合适，删掉条目并把收件箱那行改成 `rejected`。
- **收录的是网站**：帖子是发现渠道。条目指向原网站，可以注明“发现于 @某某 的 Threads”。
- **不搬帖子里的图和视频**：按 RFC-008，只用链接、官方嵌入，或作者授权的素材。
- **已经收过的网站会标出来**：帖子附带的网址如果已经在 `website/src/inspiration-data.ts` 里，候选带 `inLibrary`（条目 id）。
- **每条都要处理**：`threads-publish.mjs` 处理完把 `status` 写成 `published`（带 `entry`）或 `rejected`（带 `reason`），并写 `reviewedAt`；读不到的留在 `pending`。

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

## 自动上线（后半段）

`website/scripts/threads-publish.mjs` 处理收件箱里的 `pending`：
- 没有附带网址的帖子、网址已在库里的站点（含 `www.` 和路径不同的）、打不开（非 200）或没有分享预览图的，直接拒；
- 其余在无头 Chrome 里打开一次（1280×800，前三屏拼成一张图），交给 `claude -p`（只许读这张图）。2026-11-28 起按素材识别标准的设计六维逐项打分并报一票否决（拦截页、验证或订阅闸门、停业公告算 `broken`，模板演示站算 `template`），代码算加权分：≥ 34/45 收并写中英文笔记，27–33 进待审（收件箱状态 `review`，不上线，PR 里一行一条等维护者回“收”或“拒”），其余拒；建站平台二级域名不打开直接拒。详见 `docs/benchmark.md`。答案不合格式时带原因重试一次；
- 收的条目追加进 `inspiration-data.ts`（`via` 指向 Threads 帖子），分享预览写进 `link-previews.json`；
- 读不到的（网络、Chrome、模型出错）留在 `pending` 等下一次。

`website/scripts/run-threads-weekly.sh` 把搜索、筛选和测试串起来，在临时 worktree 里开 `codex/threads-weekly-<日期>` 分支并自动开 PR，CI 通过后由 `website/scripts/merge-weekly-pr.sh` 自动合并上线（维护者 2026-11-19 决定不再等人合并）；CI 失败先重跑一次，仍失败就留着 PR 等人看。合并后 dev 快进到 master。只看了前三屏，没有交互和手机视图；`vercel.json` 的图片域名清单已满 50 个，新站的预览图走原图回退。

## 尚未验证

- 脚本只用假的接口响应测过，还没有用真凭据调过 Threads API。第一次真跑时要核对：返回字段和 `media_type` 的取值是否和文档一致，`link_attachment_url` 有没有值。
- 筛选这一步用真实网站（arc.net、tldraw.com、webflow.com）在 Chrome 和 claude 上演练过（`--dry-run`，收件箱用的是自己写的假候选）；`run-threads-weekly.sh` 的建分支、推送和开 PR 没有真跑过，搜索那一步仍没用真凭据。
- 审核没批之前，看不出这些关键词在公开帖子里能搜出多少有用的候选；批下来后第一周要人工看一遍，再调整 `threads-discovery.json`。
