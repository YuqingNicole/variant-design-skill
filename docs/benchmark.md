# 素材识别标准（benchmark）

维护者 2026-11-28 批准的素材识别标准，原文是 Claude 文档《Variant 素材识别标准（草稿）》（https://claude.ai/artifact/Srshv9iF42vN6PdgtrwVrz）。这里记的是它在仓库里怎么落地：哪些脚本照它打分、门槛在哪里算、待审怎么处理、测试集怎么跑。English summary at the end.

## 标准本身

总原则五条：质量优先于数量（拿不准就拒）；原创、作者可确认；能用一句话说出它好在哪；不像模板、不像 AI 默认输出；诚实标注（AI 生成要标，看不到的写“未确认”）。

**设计（网站、界面、品牌）**，六个维度各打 1–5 分，满分 45：

| 维度 | 键 | 权重 |
|---|---|---|
| 概念与记忆点 | `concept` | ×2 |
| 细节与工艺 | `craft` | ×2 |
| 原创性 | `originality` | ×2 |
| 信息与层级（品牌类换成延展性 `extensibility`） | `hierarchy` | ×1 |
| 一致性 | `consistency` | ×1 |
| 可学习性 | `learnability` | ×1 |

≥ 34 直接收，27–33 待审，< 27 拒；`concept`、`craft`、`originality` 各要 ≥ 3。

**创意视频（视频页，含 AI 作品）**，五个维度，满分 40：点子 `idea` ×2、完成度 `completeness` ×2、手艺与质感 `craft` ×2、原创性 `originality` ×1、可分享性 `shareability` ×1。≥ 30 直接收，24–29 待审，< 24 拒；`idea`、`completeness` 各要 ≥ 3。AI 生成的（`"ai": true`，规则见 RFC-008 §8 末尾）还要看得出人做了选择（分镜、剪辑、风格统一）：模型答 `humanChoices: false` 的最多进待审；AI 瑕疵算在 `craft` 里扣分；“用 XX 模型生成”为主要卖点的按推广否决。

**一票否决**（命中直接拒，不看分数；代码 `VETOES`）：`fan-work` 名作同人（视频）；`not-original` 转发、搬运、策展号、作者不明；`promo` 工具或 repo 清单、赚钱帖、课程和产品推广；`merch` 游戏素材和商品销售（视频）；`news` 新闻、政治、体育转播（视频）；`template` 模板演示站、建站平台二级域名（设计）；`shock` 擦边、血腥、惊吓；`broken` 页面本身坏了（拦截页、验证或订阅墙、白屏、停服；设计）；`out-of-scope` 不在这个库收的范围（各来源自己的清单）。“只有一屏可看”不是否决：截图问题先重试，页面本身就是一屏的按层级和一致性打低分。

## 在哪里实现

- `website/scripts/screening-rubric.mjs`：维度、权重、门槛、否决清单、校准样本和提示词片段都在这里，三个筛选脚本共用。模型只打分和报否决，**加权总分、最低分和分档都在代码里算**（`bandFor`），不靠模型自己算。
- `website/scripts/threads-publish.mjs`（图库和 Threads 的网站）用设计标准；`website/scripts/x-publish.mjs` 和 `website/scripts/youtube-publish.mjs`（视频页）用视频标准，同人规则 `IP_RULE`、分类 `TAG_GUIDE` 和 AI 标记 `AI_RULE` 不变。
- 模型的回答是一个 JSON：`vetoes`、每个维度的 `score` 和一句 `reason`，视频还有 `ai`、`humanChoices`，不是拒的再加卡片字段（名称、分类、中英文笔记）。不合格的回答带着原因重问一次。
- 校准样本（标准文档第 7 节）写进提示词：Mimo 四工具对比、Ayush Soni 的 Second、Gleb Kuznetsov 个人站、斑马线变台阶、Beaver Moon 是收；贝多芬线稿测试、AI 毛毯海盗是待审；低多边形猫走路循环是拒；五夜后宫紫兔、Snapa 是否决。文档只给了总分，各维度怎么分是我们按总分拆的。
- 建站平台二级域名（`*.framer.website`、`*.webflow.io`、`*.sites.uprock.pro` 等，`BUILDER_HOSTS`）在打开网站之前就按 `template` 拒掉，不花模型调用。
- 每条决定的分数和理由存进收件箱那一行的 `screening`（`rubric`、`band`、`total`、`max`、`vetoes`、每维的 `score` 和 `reason`、`ai`、`at`），网站上不显示，留着以后校准。`reason` 是一行摘要：总分和最弱的两项。

## 待审

60–75% 那一档（设计 27–33，视频 24–29，或 AI 作品看不出人的选择）**不自动上线**：

- 收件箱那一行的状态是 `review`，带着它上线会用的卡片 `draft`（网站还有 `draftPreview`），以及 `screening` 和 `reason`。
- 每天或每周的 PR 描述里，报告最后有一节 “Held for review (n)”，一条一行：`~ <收件箱 id> <总分>/<满分> <名称> (<来源>). <理由>`。报告第一行变成 `Accepted a, rejected r, left pending k, held for review v.`，`weekly-guard.mjs` 把待审算作“已经定下来”。X 的周任务原来“没有新视频就不开 PR”，现在有待审也开 PR。
- 维护者对着 id 回“收”或“拒”。代理照着执行：
  - `node website/scripts/review-queue.mjs list`：列出所有收件箱里的待审行。
  - `node website/scripts/review-queue.mjs accept <id>`（或 `收`）：把 `draft` 加进 `inspiration-data.ts`（网站同时把 `draftPreview` 写进 `link-previews.json`），那一行改成 `published`，记 `decidedBy: "owner"`。X 帖子之后要跑一次 `node website/scripts/x-media.mjs` 补视频记录，和周任务一样。
  - `node website/scripts/review-queue.mjs reject <id> [原因]`（或 `拒`）：那一行改成 `rejected`，原因写“维护者从待审拒绝”加上筛选当时的理由。
  - 只有 `review` 状态的行能这样处理；条目 id 已被占用会拒绝，什么都不写。改动照常走 PR。
- 人工的另一项工作：每周从已收录的随机抽 5 条看一遍。不对的照旧撤下（删条目，收件箱那行改 `rejected`），并把它加进测试集。

## 测试集

`website/content/benchmark.json`：40 条，设计 20（收 13、拒 7）、视频 20（收 9、待审 1、拒 10），全部取自真实收件箱。标签都是 `labelStatus: "draft"`，等维护者改：维护者亲自加的（#316、#340、#343、#346、#351）标收；维护者要求撤下的（#338 的两条同人、#358 的两条同人、Snapa）和维护者指出的转发标拒；标准文档校准表里有的按校准表（贝多芬待审、猫走路循环拒，虽然它们现在在库里）；其余按收件箱现在的决定。每条的 `basis` 写了依据；`calibration: true` 的条目同时是提示词里的校准样本，它们的一致率不独立，报告里单独算一行“去掉校准样本”。

`node website/scripts/benchmark.mjs [--only id,id] [--rubric design|video] [--jobs n] [--json 文件]`：按各来源同样的步骤（X 抽 6 帧、网站开 Chrome 截前三屏）对每条打分，干跑，不写收件箱和库，也不做“库里已有”的检查。维护者加的 X 设计帖子用视频帧加设计标准打分（视频页的提示词会把设计作品当范围外拒掉）。输出每条的标签和模型结果，以及每类的分档一致率、“收或不收”一致率、否决命中、和校准估分的差，按维度列出收、待审、拒三组的平均分（差距越大，这个维度越能区分好坏）。每条一次模型调用，40 条大约 20–40 分钟。首次运行结果见 `docs/research/2026-11-28-material-benchmark-run.md`。

每月重跑一次。一致率低于 80% 的维度改定义或加例子；维护者新发来的“加入”和“撤下”补进测试集，标签改成 `confirmed`。门槛数字是第一版，第一次跑完后再调。

---

## English summary

The material standard approved by the owner on 2026-11-28 (source: the Claude doc linked above) is implemented in `website/scripts/screening-rubric.mjs` and shared by every screening script: `threads-publish.mjs` (sites, design rubric), `x-publish.mjs` and `youtube-publish.mjs` (Videos tab, video rubric).

- **Design**: concept ×2, craft ×2, originality ×2, information and hierarchy ×1 (extensibility for brands), consistency ×1, learnability ×1; max 45. Accept ≥ 34, review 27–33, reject < 27; concept, craft and originality each ≥ 3.
- **Creative video**: idea ×2, completeness ×2, craft and texture ×2, originality ×1, shareability ×1; max 40. Accept ≥ 30, review 24–29, reject < 24; idea and completeness each ≥ 3. An AI-generated piece with no visible human choices is held for review at most.
- **Vetoes** reject whatever the score: fan work, not original (reposts, curators, unknown author), promotions and tool lists, merchandise and game assets, news and sports, template demos and site-builder subdomains (also caught by host before any page is opened), shock content, broken pages, out of scope. A single screen is not a veto: captures are retried.
- The model returns a veto list or a 1–5 score with a one-line reason per dimension; the code computes the weighted total, floors and band. Scores and reasons are stored in the inbox row as `screening`, not shown on the site. The document's calibration items are in the prompts.
- **Review band**: rows are kept as `review` with the card they would publish (`draft`, plus `draftPreview` for sites) and listed one line each under "Held for review" in the weekly pull request. The owner replies 收 (accept) or 拒 (reject) per id; `node website/scripts/review-queue.mjs accept|reject <id>` applies it (`list` shows the queue). A week with only review items still opens a pull request.
- **Benchmark set**: `website/content/benchmark.json`, 40 real inbox items with draft labels for the owner to correct. `node website/scripts/benchmark.mjs` screens them in dry run and prints band agreement, collect-or-not agreement, veto hits, distance from the calibration estimates, and per-dimension mean scores by label. Rerun monthly; change a dimension's definition or examples when its agreement falls under 80%.
