# 灵感库第六批新增（2026-11-13，同日第二批）

灵感库从 209 条增至 248 条：9 条 X 视频帖、30 个官方网站。分类：网站 109→140、交互 38→42、品牌 14→16、印刷 0→2（印刷 tab 第一次出现），产品界面（12）、动效（31）、插画（3）、海报（2）不变。目标是 40 条，最后是 39 条：一条印刷视频写完笔记后发现发帖账号是转发性质的内容号，印刷的人没有署名，去掉了（见"加搜 40 条的处理"）。

## 候选从哪来

1. **每周发现**：`website/scripts/run-x-discovery.sh` 在维护者已登录的 Ego Lite 里跑。第一次跑时 X 的会话已过期，搜索页跳到登录页，脚本只报"20 秒内没读到帖子"；维护者重新登录后再跑：12 条合格、2 条新进收件箱，`lochieaxon`、`ibelick` 本周没有。
2. **加搜**：换了 7 组关键词（应用界面、仪表盘和设计系统、字体排印、3D 和滚动动效、印刷和包装、品牌识别和标志动画、插画过程），窗口放宽到 2026-10-13 起，点赞下限 150；另列 15 个设计师账号，这次脚本先打开账号页核对再搜：3 个账号名不存在（`emilkowalski_`、`cassie_codes`、`underconsideration`），7 个近一个月没有视频帖（`samuelkraft`、`hakimel`、`schoolofmotion`、`oddfellows`、`loish`、`pascalcampion`、`designmilk`），读出帖子的 5 个是 @nitishkmrk（8 条）、@mrncst（1）、@jsngr（2）、@bruno_simon（2）、@akella（4）。共 68 条，去掉收件箱里已有的 2 条、作者已在库里或收件箱里的 10 条、同一作者在结果里重复的 16 条后 40 条。脚本仍是一次性的（`scratchpad/b6/discover.mjs` 的复制件没有进仓库）；规则与每周发现相同：只存链接和公开数据，人看过再写笔记。
3. **网站**：人工列了 112 个候选（开发者平台、AI、SaaS、知识工具、金融、电商、工作室），42 个已在库里，剩下 70 个每站在无头 Chrome 里以 1280×800 访问一次，存前三屏为一张图，分享预览（og 标签）从同一次加载里读。

## 怎么筛

- X 帖子：把每条视频流到本机临时目录，抽 6 帧拼成一张图，看图写笔记；没有完整播放。同一作者只收一条；转发他人视频、原作者不明的不收；资源清单、教程、新闻、工具推销、周边预售和粉丝转发的物料不收。
- 网站：只看截图里的前三屏，没有交互，没有看手机。被拦截、没有分享预览、JS 没渲染出内容、整页弹窗或进入闸门盖住页面、只有一屏、已停业或并购公告页的不收；小的 cookie 提示框不作为排除理由，但盖住首屏主体的记为"没看清"。
- 每条笔记写"看什么"和"用在哪"，中英文各一句。

## 收件箱 2 条的处理

| 帖子 | 处理 | 原因 |
|---|---|---|
| @socoloffalex 2119717795134882263 | 不收 | 自家动效工具的预告，问要不要免费发布；画面是抽象的粒子渲染，没有界面或平面设计可看。同一作者的品牌识别帖在加搜里收了 |
| @noahelhadedy 2120554647845060614 | 不收 | 组件库新增栏目的公告，属于资源清单 |

处理结果写回了收件箱：`status` 改为 `rejected`（带 `reason`），加 `reviewedAt`。加搜收下的 9 条也以 `published` 进了收件箱，`query` 字段记着来源查询；收件箱现在 48 条，没有 `pending`。

## 加搜 40 条的处理

收 9 条：Cron 手机版引导页（@raphaelschaad，交互）、对折 zine 和信封包装（@narynorlu，印刷）、蓝色猫 zine（@yone_ru，印刷）、Trava 品牌识别（@socoloffalex，品牌）、Tessel 标志动画（@secondeight_，品牌）、拇指反馈按钮（@nitishkmrk，交互）、侧栏拖拽把手（@mrncst，交互；作者注明做法来自 Jamie Merrill 的帖子，笔记里写明）、在 Mainframe 画布里设计 Mainframe（@jsngr，交互）、Codevember 的苔藓三角（@akella，网站）。

不收 31 条，按原因：

- 资源清单 10 条（@amananimates、@himanshubuildss、@neropursue、@MaybeFlorent、@beamnxw、@Asteri_eth、@e1genqq、@rachiitgr、@fuji_ai_、@okapi_fukugyo），都是"收藏这几个站 / 这几个仓库"。
- 工具、产品或赞助推广 10 条：@sinanyorulmazz（检查工具）、@CamilleRoux（Claude Code 技能）、@fal（官方账号的产品演示）、@mathewpregasen（产品发布串）、@_nghiatran（自家 agent 工具）、@senumy_ipa（改版应用发布）、@crimexbt（钱包赞助）、@IronSage_（CapCut 促销）、@TweetsByTBI（转售模板的媒体号）、@TomFrankly（引用他人帖子的建议文字）。
- 转发或原作者不明 5 条：@Ramoda85（转发别人的绘画过程）、@JuanAG_IT（第三方应用的试用评价）、@ChrisGPT（AI 生成的故事动画，不是设计）、@nfarina（给 Kindle 应用打补丁的前后对比，设计不是作者的）、@Old_But_Gold50s（彩虹墨凸版印刷的过程视频，先收了并写了笔记，再看账号是怀旧内容号，印刷者没有署名，去掉）。
- zine 预售和周边 3 条：@deathroadbooks（帧里是周边促销画面）、@ABottleofStars（美少女向画集）、@ourhermitage（杂志上架消息）。
- 作品集混剪 1 条（@itschatto，含加密货币落地页）；美少女向的角色插画过程 1 条（@TayeRexx），和本库的定位不符；3D 打印的实物车 1 条（@bruno_simon），不是界面或平面设计。

## 70 个网站候选的处理

收 30 个。不收的 40 个：

- 没有分享预览图 15 个：openai.com（403）、read.cv（402）、squarespace.com、frame.work（408）、byredo.com、muuto.com、fritzhansen.com、patagonia.com、bluebottlecoffee.com（403）、maap.cc、flybyjing.com、whoop.com（403）、sonos.com（403）、withings.com（403）、order.design。
- 跳转到别的站 2 个：windsurf.com 跳到 devin.ai 的一个产品子页，bento.me 跳到 linktr.ee。
- 停业或并购公告页 3 个：june.so（告别信）、campsite.com（结业公告）、stainless.com（并入 Anthropic 的一页）。
- 进入闸门或验证 4 个：gamma.app（Cloudflare 验证）、glossier.com（订阅弹窗加 cookie 弹窗）、drinkghia.com（折扣闸门）、eightsleep.com（问卷闸门）。
- 第二屏起没渲染出内容 6 个：sourcegraph.com、scale.com、paddle.com、maze.co、protopie.io（演示嵌入是空白）、ideogram.ai（客户标志图片没加载）。
- 只有一屏 3 个：suno.com、krea.ai、omsom.com。
- 截图没抓好 2 个：tella.com（视频正在切换）、monzo.com（首屏文字压在照片上，一张卡片空白）。
- 看过但没收 5 个：statsig.com、plane.so、sunsama.com（cookie 框盖住主体，版式普通）、carrd.co（样式陈旧）、ledger.com（cookie 框盖住章节标题）。

## 没做到的，下一位读者要知道

- 视频没有完整播放，看的是 6 帧；网站只看前三屏截图，没有交互和手机视图。
- 印刷分类第一次有内容，两条都是 zine；活字印刷那条因为作者归属不明去掉了，下次找印刷类要从印刷工作室或设计师本人的账号找。
- 几条 X 帖子的文字不是英文：`post.lang` 按原帖写，印尼语写 `id`（X 自己标的是 `in`），日语 `ja`。@narynorlu 和 @yone_ru 的显示名分别是「kartu debit」和「よね/Yone COMITIA158 い44a」，前者照录，后者的 `designer` 写成「よね (Yone)」，去掉了展会摊位号。
- 全部仍是 `link-only`：只存链接、标题、我们的笔记和公开帖文，不存对方的图片或视频。
- 首页拆分后的体积（gzip）：索引 5.3→6.1 KB（上限 12），首页第一页 17.0→19.1 KB（上限 25），网站分类的分片 41.6→59.2 KB。直接打开一条网站类参考的深链会取整个分片，这是 TODO 第 6 组记着的按条拆分片的事；首页脚本上限（130 KB）没有动。
- Vercel 的 `images.remotePatterns` 仍封顶 50 个域名，已满；这批的 30 个网站都由卡片回退加载原图。
- `link-preview.mjs` 重抓全部网站：127 条预览记录（之前 96），没有丢失；locomotive.ca 这次读到了预览。nothing.tech 没有分享预览（和之前一样），lovable.dev 和 aesop.com 返回 403，不变。
- 新条目的 `addedAt` 按"一条视频、三个网站"交错排列，时间写在 17 时和 16 时，排在第五批（11 时）之后；这是排序用的收录时间，不是逐条的真实写入时刻。
- Ego Lite 里的 X 登录会过期，脚本看不出登录页和空结果的区别；跑之前先开一次 x.com。
